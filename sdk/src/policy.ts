import { appendFile, chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type AccessLevel = "deny" | "metadata" | "summary" | "markdown" | "ask";

export interface ProjectPolicy {
  id: string;
  name: string;
  access: AccessLevel;
}

export interface Policy {
  defaultAccess: "deny" | "allow";
  requireSessionApproval: boolean;
  expirePermissionsAfterHours: number | null;
  showAuditHistory: boolean;
  defaultDeny: boolean;
  projects: ProjectPolicy[];
}

export interface AuditEvent {
  agent: string;
  requested: string;
  project?: string;
  decision: "approved" | "denied";
  detail?: string;
}

export const threadweaverDir = join(homedir(), ".threadweaver");
export const policyPath = join(threadweaverDir, "policy.json");
export const auditPath = join(threadweaverDir, "audit.log");

export const defaultProjects: ProjectPolicy[] = [
  { id: "aaif-ambassador", name: "AAIF Ambassador", access: "deny" },
  { id: "eleventh-house-studios", name: "Eleventh House Studios", access: "deny" },
  { id: "career", name: "Career", access: "deny" },
  { id: "personal", name: "Personal", access: "deny" },
  { id: "health", name: "Health", access: "deny" }
];

export const defaultPolicy: Policy = {
  defaultAccess: "deny",
  requireSessionApproval: true,
  expirePermissionsAfterHours: null,
  showAuditHistory: true,
  defaultDeny: true,
  projects: defaultProjects
};

export async function ensureStore() {
  await mkdir(threadweaverDir, { recursive: true });
  await chmod(threadweaverDir, 0o700).catch(() => undefined);
}

function normalizeProjects(input: ProjectPolicy[] | undefined) {
  const map = new Map<string, ProjectPolicy>();
  for (const p of defaultProjects) map.set(p.id, p);
  for (const p of input ?? []) {
    if (!p?.id) continue;
    map.set(p.id, {
      id: p.id,
      name: p.name || p.id,
      access: p.access ?? "deny"
    });
  }
  return [...map.values()];
}

export async function writePolicy(policy: Policy) {
  await ensureStore();
  const next: Policy = {
    ...defaultPolicy,
    ...policy,
    projects: normalizeProjects(policy.projects)
  };
  await writeFile(policyPath, JSON.stringify(next, null, 2), "utf8");
  await chmod(policyPath, 0o600).catch(() => undefined);
}

export async function readPolicy(): Promise<Policy> {
  await ensureStore();
  try {
    const content = await readFile(policyPath, "utf8");
    const parsed = JSON.parse(content) as Policy;
    return {
      ...defaultPolicy,
      ...parsed,
      projects: normalizeProjects(parsed.projects)
    };
  } catch {
    await writePolicy(defaultPolicy);
    return {
      ...defaultPolicy,
      projects: normalizeProjects(defaultPolicy.projects)
    };
  }
}

export async function initPolicyStore() {
  await ensureStore();
  try {
    await readFile(policyPath, "utf8");
  } catch {
    await writePolicy(defaultPolicy);
  }
  try {
    await readFile(auditPath, "utf8");
  } catch {
    await writeFile(auditPath, "", "utf8");
    await chmod(auditPath, 0o600).catch(() => undefined);
  }
}

export async function listAllowedProjects() {
  const policy = await readPolicy();
  return policy.projects.filter((project) => project.access !== "deny");
}

export async function upsertProjects(projects: Array<{ id: string; name: string }>) {
  const policy = await readPolicy();
  const map = new Map(policy.projects.map((p) => [p.id, p]));
  for (const project of projects) {
    if (!project.id) continue;
    const existing = map.get(project.id);
    map.set(project.id, {
      id: project.id,
      name: project.name || project.id,
      access: existing?.access ?? "deny"
    });
  }
  const next: Policy = {
    ...policy,
    projects: [...map.values()]
  };
  await writePolicy(next);
  return next;
}

export async function setProjectAccess(projectId: string, access: AccessLevel) {
  const policy = await readPolicy();
  const hasProject = policy.projects.some((p) => p.id === projectId);
  const projects = hasProject
    ? policy.projects.map((p) => (p.id === projectId ? { ...p, access } : p))
    : [...policy.projects, { id: projectId, name: projectId, access }];
  const next: Policy = { ...policy, projects };
  await writePolicy(next);
  return next;
}

export async function appendAudit(event: AuditEvent) {
  await ensureStore();
  const now = new Date().toISOString();
  const line =
    now +
    "\tagent=" +
    event.agent +
    "\trequested=" +
    event.requested +
    "\tproject=" +
    (event.project || "n/a") +
    "\tdecision=" +
    event.decision +
    (event.detail ? "\tdetail=" + event.detail : "") +
    "\n";
  await appendFile(auditPath, line, "utf8");
  await chmod(auditPath, 0o600).catch(() => undefined);
}
