#!/usr/bin/env node
import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { Command } from "commander";
import { startDashboardServer } from "@dakotafabrodev/threadweaver-dashboard";
import { startMcpServer } from "@dakotafabrodev/threadweaver-mcp";
import { appendAudit, importChatGptExport, initPolicyStore, listProjectsFromThreads, listRecentFromThreads, readPolicy, recallFromThreads, setProjectAccess, upsertProjects } from "@dakotafabrodev/threadweaver-sdk";
const execAsync = promisify(exec);
async function openBrowser(url) {
    try {
        if (process.platform === "darwin") {
            await execAsync("open '" + url + "'");
            return;
        }
        if (process.platform === "win32") {
            await execAsync("start " + url);
            return;
        }
        await execAsync("xdg-open '" + url + "'");
    }
    catch {
        process.stdout.write("Open manually: " + url + "\n");
    }
}
const program = new Command();
program.name("threadweaver").description("Consent-first knowledge platform").version("0.1.0");
program.command("init").description("Initialize policy and audit store").action(async function () {
    await initPolicyStore();
    await appendAudit({ agent: "threadweaver-cli", requested: "init", decision: "approved" });
    process.stdout.write("Initialized ~/.threadweaver/policy.json and ~/.threadweaver/audit.log\n");
});
program
    .command("quickstart")
    .requiredOption("-f, --file <path>", "path to conversations export file or directory")
    .option("-p, --project <id>", "project to allow after import")
    .option("-a, --access <level>", "metadata|summary|markdown|ask", "summary")
    .description("Initialize, import export data, sync projects, and allow one project")
    .action(async function (opts) {
    await initPolicyStore();
    const imported = await importChatGptExport(opts.file);
    const policy = await upsertProjects(imported.projects);
    const projectId = opts.project || (imported.projects[0] ? imported.projects[0].id : "");
    if (projectId) {
        const access = opts.access;
        await setProjectAccess(projectId, access);
        process.stdout.write("Allowed project: " + projectId + " with access=" + access + "\n");
    }
    await appendAudit({
        agent: "threadweaver-cli",
        requested: "quickstart",
        project: projectId || undefined,
        decision: "approved"
    });
    process.stdout.write("Imported threads: " + imported.threadsImported + "\n");
    process.stdout.write("Projects discovered: " + imported.projects.length + "\n");
    process.stdout.write("Projects in policy: " + policy.projects.length + "\n");
    process.stdout.write("Next: threadweaver recall your query\n");
});
const connect = program.command("connect").description("Connect data sources");
connect
    .command("chatgpt-export")
    .requiredOption("-f, --file <path>", "path to conversations export file or directory")
    .action(async function (opts) {
    await initPolicyStore();
    const result = await importChatGptExport(opts.file);
    await upsertProjects(result.projects);
    await appendAudit({ agent: "threadweaver-cli", requested: "connect_chatgpt_export", decision: "approved" });
    process.stdout.write("Imported threads: " + result.threadsImported + "\n");
    process.stdout.write("Projects discovered: " + result.projects.length + "\n");
});
const projects = program.command("projects").description("Project policy controls");
projects.command("list").action(async function () {
    await initPolicyStore();
    const policy = await readPolicy();
    const rows = policy.projects.map((p) => p.id + "\t" + p.name + "\t" + p.access).join("\n");
    process.stdout.write((rows || "No projects found") + "\n");
});
projects.command("sync-from-import").action(async function () {
    await initPolicyStore();
    const found = await listProjectsFromThreads();
    const next = await upsertProjects(found);
    await appendAudit({ agent: "threadweaver-cli", requested: "projects_sync_from_import", decision: "approved" });
    process.stdout.write("Projects in policy: " + next.projects.length + "\n");
});
projects
    .command("allow")
    .requiredOption("-p, --project <id>", "project id")
    .option("-a, --access <level>", "metadata|summary|markdown|ask", "summary")
    .action(async function (opts) {
    const access = opts.access;
    await setProjectAccess(opts.project, access);
    await appendAudit({ agent: "threadweaver-cli", requested: "projects_allow", project: opts.project, decision: "approved" });
    process.stdout.write("Updated project " + opts.project + " to access=" + access + "\n");
});
projects
    .command("deny")
    .requiredOption("-p, --project <id>", "project id")
    .action(async function (opts) {
    await setProjectAccess(opts.project, "deny");
    await appendAudit({ agent: "threadweaver-cli", requested: "projects_deny", project: opts.project, decision: "approved" });
    process.stdout.write("Updated project " + opts.project + " to access=deny\n");
});
program
    .command("recent")
    .option("-p, --project <id>", "project id")
    .option("-q, --query <text>", "optional keyword filter")
    .option("-l, --limit <n>", "optional limit")
    .action(async function (opts) {
    await initPolicyStore();
    const policy = await readPolicy();
    const allowed = policy.projects.filter((p) => p.access !== "deny").map((p) => p.id);
    if (opts.project) {
        const selected = policy.projects.find((p) => p.id === opts.project);
        if (!selected || selected.access === "deny") {
            process.stdout.write("Project access denied: " + opts.project + "\n");
            return;
        }
    }
    const rows = await listRecentFromThreads({
        projectId: opts.project,
        query: opts.query,
        limit: opts.limit ? Number(opts.limit) : undefined,
        allowedProjectIds: allowed
    });
    await appendAudit({
        agent: "threadweaver-cli",
        requested: "recent",
        project: opts.project,
        decision: "approved"
    });
    if (!rows.length) {
        process.stdout.write("No recent conversations found\n");
        return;
    }
    for (const row of rows) {
        process.stdout.write("[" + row.projectName + "] " + row.title + " | " + (row.updatedAt || "unknown") + " | messages=" + row.messageCount + "\n");
    }
});
program
    .command("recall <query>")
    .option("-p, --project <id>", "project id")
    .option("-l, --limit <n>", "optional limit")
    .action(async function (query, opts) {
    await initPolicyStore();
    const policy = await readPolicy();
    const allowed = policy.projects.filter((p) => p.access !== "deny").map((p) => p.id);
    if (opts.project) {
        const selected = policy.projects.find((p) => p.id === opts.project);
        if (!selected || selected.access === "deny") {
            process.stdout.write("Project access denied: " + opts.project + "\n");
            return;
        }
    }
    const hits = await recallFromThreads({
        query,
        projectId: opts.project,
        limit: opts.limit ? Number(opts.limit) : undefined,
        allowedProjectIds: allowed
    });
    await appendAudit({
        agent: "threadweaver-cli",
        requested: "recall",
        project: opts.project,
        decision: "approved"
    });
    if (!hits.length) {
        process.stdout.write("No matching recall results found\n");
        return;
    }
    for (const hit of hits) {
        process.stdout.write("[" + hit.projectName + "] " + hit.threadTitle + " (score " + hit.score + ")\n");
        process.stdout.write(hit.excerpt + "\n\n");
    }
});
program
    .command("doctor")
    .description("Check core file drift and surface stability warnings")
    .action(async function () {
    await initPolicyStore();
    let manifest = {};
    const manifestCandidates = [
        "docs/core-files-manifest.json",
        "../docs/core-files-manifest.json",
        "../../docs/core-files-manifest.json"
    ];
    let loaded = false;
    for (const candidate of manifestCandidates) {
        try {
            const raw = await readFile(candidate, "utf8");
            manifest = JSON.parse(raw);
            loaded = true;
            break;
        }
        catch { }
    }
    if (!loaded) {
        process.stdout.write("Manifest not found in expected paths\n");
        return;
    }
    const coreFiles = manifest.core_files ?? [];
    if (!coreFiles.length) {
        process.stdout.write("No core files listed in manifest\n");
        return;
    }
    const changed = new Set();
    try {
        const status = await execAsync("git status --porcelain");
        for (const line of status.stdout.split("\n")) {
            if (!line.trim())
                continue;
            const file = line.slice(3).trim();
            if (file)
                changed.add(file);
        }
    }
    catch {
        process.stdout.write("Git status unavailable. Reporting manifest files only.\n");
    }
    const drift = coreFiles.filter((f) => changed.has(f));
    process.stdout.write("Core files tracked: " + coreFiles.length + "\n");
    if (!drift.length) {
        process.stdout.write("No core drift detected via git status.\n");
        process.stdout.write("Stability notice: editing core files can break tool behavior.\n");
    }
    else {
        process.stdout.write("Core drift detected in:\n" + drift.join("\n") + "\n");
        process.stdout.write("Warning: changing core files can break contracts, policy behavior, or recall correctness.\n");
    }
    await appendAudit({
        agent: "threadweaver-cli",
        requested: "doctor",
        decision: "approved"
    });
});
const expose = program.command("expose").description("Configure policy exposure");
expose
    .command("configure")
    .option("-p, --port <port>", "dashboard port", "4317")
    .action(async function (opts) {
    await initPolicyStore();
    const port = Number(opts.port);
    await startDashboardServer(port);
    const url = "http://localhost:" + port;
    await openBrowser(url);
    process.stdout.write("Dashboard running at " + url + "\n");
});
expose.command("list").description("List current project policies").action(async function () {
    await initPolicyStore();
    const policy = await readPolicy();
    const output = policy.projects.map((p) => p.name + ": " + p.access).join("\n");
    process.stdout.write(output + "\n");
});
program.command("serve-mcp").option("-p, --port <port>", "mcp port", "4318").action(async function (opts) {
    await initPolicyStore();
    const port = Number(opts.port);
    await startMcpServer(port);
    process.stdout.write("MCP server running at http://localhost:" + port + "\n");
});
program.parseAsync(process.argv);
