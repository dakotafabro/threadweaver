import express from "express";
import { readPolicy, type AccessLevel, type Policy, writePolicy } from "@dakotafabrodev/threadweaver-sdk";

const levels: AccessLevel[] = ["metadata", "summary", "markdown", "ask", "deny"];

function label(level: AccessLevel) {
  if (level === "metadata") return "Metadata only";
  if (level === "summary") return "Thread summaries";
  if (level === "markdown") return "Markdown export";
  if (level === "ask") return "Ask every session";
  return "Deny";
}

function render(policy: Policy) {
  const projects = policy.projects
    .map((project) => {
      const options = levels
        .map((level) => {
          const checked = project.access === level ? "checked" : "";
          return '<label style="margin-right:10px;display:inline-block"><input type="radio" name="project_' + project.id + '_access" value="' + level + '" ' + checked + '/> ' + label(level) + "</label>";
        })
        .join("");
      return '<section style="border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px"><h3 style="margin:0 0 8px 0">' + project.name + "</h3>" + options + "</section>";
    })
    .join("");

  const requireSessionApproval = policy.requireSessionApproval ? "checked" : "";
  const showAuditHistory = policy.showAuditHistory ? "checked" : "";
  const defaultDeny = policy.defaultDeny ? "checked" : "";
  const hours = policy.expirePermissionsAfterHours ?? "";

  return '<!doctype html><html><head><meta charset="utf-8"/><title>ThreadWeaver Consent Dashboard</title></head><body style="font-family:system-ui;padding:24px;max-width:980px;margin:auto"><h1>ThreadWeaver Consent Dashboard</h1><p>Policy file: ~/.threadweaver/policy.json</p><form method="post" action="/save"><h2>Projects</h2>' +
    projects +
    '<h2>Global Settings</h2><label style="display:block;margin-bottom:8px"><input type="checkbox" name="requireSessionApproval" ' +
    requireSessionApproval +
    '/> Require approval every Goose session</label><label style="display:block;margin-bottom:8px"><input type="checkbox" name="showAuditHistory" ' +
    showAuditHistory +
    '/> Show audit history</label><label style="display:block;margin-bottom:8px"><input type="checkbox" name="defaultDeny" ' +
    defaultDeny +
    '/> Default deny</label><label style="display:block;margin-bottom:8px">Expire permissions after hours: <input type="number" min="1" name="expirePermissionsAfterHours" value="' +
    hours +
    '"/></label><button type="submit">Save Policy</button></form></body></html>';
}

function bool(value: string | undefined) {
  return value === "on";
}

export async function startDashboardServer(port = 4317) {
  const app = express();
  app.use(express.urlencoded({ extended: true }));

  app.get("/", async (_req, res) => {
    const policy = await readPolicy();
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.send(render(policy));
  });

  app.post("/save", async (req, res) => {
    const current = await readPolicy();
    const projects = current.projects.map((project) => {
      const access = String(req.body["project_" + project.id + "_access"] ?? "deny") as AccessLevel;
      return { id: project.id, name: project.name, access };
    });

    const rawHours = String(req.body.expirePermissionsAfterHours ?? "").trim();
    const parsedHours = rawHours ? Number(rawHours) : null;

    const next: Policy = {
      ...current,
      projects,
      requireSessionApproval: bool(req.body.requireSessionApproval),
      showAuditHistory: bool(req.body.showAuditHistory),
      defaultDeny: bool(req.body.defaultDeny),
      defaultAccess: bool(req.body.defaultDeny) ? "deny" : "allow",
      expirePermissionsAfterHours: Number.isFinite(parsedHours) ? parsedHours : null
    };

    await writePolicy(next);
    res.redirect("/");
  });

  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

if (import.meta.url === "file://" + process.argv[1]) {
  const port = Number(process.env.THREADWEAVER_DASHBOARD_PORT ?? "4317");
  startDashboardServer(port).then(() => {
    process.stdout.write("ThreadWeaver dashboard running at http://localhost:" + port + "\n");
  });
}
