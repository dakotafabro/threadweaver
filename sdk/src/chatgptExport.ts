import { chmod, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ThreadMessage {
  role: string;
  text: string;
  createdAt: string | null;
}

export interface ThreadRecord {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  updatedAt: string | null;
  messages: ThreadMessage[];
}

const threadweaverDir = join(homedir(), ".threadweaver");
const threadsPath = join(threadweaverDir, "chatgpt_threads.json");

function textFromContent(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const c = content as Record<string, unknown>;
  const parts = c.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((p) => (typeof p === "string" ? p : ""))
      .join("\n")
      .trim();
  }
  const text = c.text;
  if (typeof text === "string") return text.trim();
  return "";
}

function toIso(value: unknown): string | null {
  if (typeof value === "number") {
    const ms = value > 10_000_000_000 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function projectMeta(conversation: Record<string, unknown>) {
  const directId = typeof conversation.project_id === "string" ? conversation.project_id : "";
  const directName = typeof conversation.project_name === "string" ? conversation.project_name : "";
  const metadata = conversation.metadata && typeof conversation.metadata === "object" ? (conversation.metadata as Record<string, unknown>) : {};
  const metaId = typeof metadata.project_id === "string" ? metadata.project_id : "";
  const metaName = typeof metadata.project_name === "string" ? metadata.project_name : "";
  const id = directId || metaId || "chatgpt-general";
  const name = directName || metaName || "ChatGPT General";
  return { id, name };
}

function parseConversation(raw: unknown): ThreadRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const id = typeof c.id === "string" ? c.id : typeof c.conversation_id === "string" ? c.conversation_id : "";
  if (!id) return null;
  const title = typeof c.title === "string" && c.title.trim() ? c.title.trim() : "Untitled";
  const { id: projectId, name: projectName } = projectMeta(c);

  const mapping = c.mapping && typeof c.mapping === "object" ? (c.mapping as Record<string, unknown>) : {};
  const messages: ThreadMessage[] = [];

  for (const node of Object.values(mapping)) {
    if (!node || typeof node !== "object") continue;
    const entry = node as Record<string, unknown>;
    const message = entry.message;
    if (!message || typeof message !== "object") continue;
    const m = message as Record<string, unknown>;
    const author = m.author && typeof m.author === "object" ? (m.author as Record<string, unknown>) : {};
    const role = typeof author.role === "string" ? author.role : "unknown";
    const text = textFromContent(m.content);
    if (!text) continue;
    messages.push({
      role,
      text,
      createdAt: toIso(m.create_time)
    });
  }

  messages.sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return at - bt;
  });

  if (!messages.length) return null;

  return {
    id,
    title,
    projectId,
    projectName,
    updatedAt: toIso(c.update_time),
    messages
  };
}

async function collectConversationEntries(pathValue: string): Promise<unknown[]> {
  const info = await stat(pathValue);
  if (info.isFile()) {
    const content = await readFile(pathValue, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Expected export file to contain an array of conversations");
    return parsed;
  }

  if (!info.isDirectory()) throw new Error("Input path must be a file or directory");

  const names = await readdir(pathValue);
  const files = names
    .filter((name) => /^conversations(?:-\d+)?\.json$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  if (!files.length) throw new Error("No conversation files found in directory");

  const entries: unknown[] = [];
  for (const file of files) {
    const content = await readFile(join(pathValue, file), "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) continue;
    entries.push(...parsed);
  }
  return entries;
}

export async function importChatGptExport(pathValue: string) {
  const parsed = await collectConversationEntries(pathValue);

  const threads: ThreadRecord[] = [];
  for (const item of parsed) {
    const record = parseConversation(item);
    if (record) threads.push(record);
  }

  await mkdir(threadweaverDir, { recursive: true });
  await chmod(threadweaverDir, 0o700).catch(() => undefined);
  await writeFile(threadsPath, JSON.stringify(threads, null, 2), "utf8");
  await chmod(threadsPath, 0o600).catch(() => undefined);

  const projectMap = new Map<string, string>();
  for (const t of threads) projectMap.set(t.projectId, t.projectName);

  return {
    threadsImported: threads.length,
    projects: [...projectMap.entries()].map(([id, name]) => ({ id, name }))
  };
}

export async function loadThreads(): Promise<ThreadRecord[]> {
  try {
    const content = await readFile(threadsPath, "utf8");
    const parsed = JSON.parse(content) as ThreadRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function listProjectsFromThreads() {
  const threads = await loadThreads();
  const map = new Map<string, string>();
  for (const t of threads) map.set(t.projectId, t.projectName);
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

export async function listRecentFromThreads(input: {
  projectId?: string;
  limit?: number;
  query?: string;
  allowedProjectIds?: string[];
}) {
  const limit = input.limit && input.limit > 0 ? input.limit : null;
  const q = (input.query ?? "").trim().toLowerCase();
  const allowed = input.allowedProjectIds ? new Set(input.allowedProjectIds) : null;
  const threads = await loadThreads();

  const filtered = threads
    .filter((thread) => !input.projectId || thread.projectId === input.projectId)
    .filter((thread) => !allowed || allowed.has(thread.projectId))
    .filter((thread) => {
      if (!q) return true;
      const title = thread.title.toLowerCase();
      if (title.includes(q)) return true;
      return thread.messages.some((message) => message.text.toLowerCase().includes(q));
    })
    .map((thread) => ({
      projectId: thread.projectId,
      projectName: thread.projectName,
      threadId: thread.id,
      title: thread.title,
      updatedAt: thread.updatedAt,
      messageCount: thread.messages.length
    }))
    .sort((a, b) => {
      const bt = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      const at = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      return bt - at;
    });

  return limit ? filtered.slice(0, limit) : filtered;
}

export async function recallFromThreads(input: {
  query: string;
  projectId?: string;
  limit?: number;
  allowedProjectIds?: string[];
}) {
  const query = input.query.trim().toLowerCase();
  const limit = input.limit && input.limit > 0 ? input.limit : null;
  const allowed = input.allowedProjectIds ? new Set(input.allowedProjectIds) : null;
  const threads = await loadThreads();
  const results: Array<{
    projectId: string;
    projectName: string;
    threadId: string;
    threadTitle: string;
    excerpt: string;
    score: number;
  }> = [];

  for (const thread of threads) {
    if (input.projectId && thread.projectId !== input.projectId) continue;
    if (allowed && !allowed.has(thread.projectId)) continue;

    let bestScore = 0;
    let bestExcerpt = "";

    for (const msg of thread.messages) {
      const text = msg.text;
      const lower = text.toLowerCase();
      if (!query) continue;
      const idx = lower.indexOf(query);
      if (idx < 0) continue;
      const occurrences = lower.split(query).length - 1;
      const score = Math.max(1, occurrences);
      if (score > bestScore) {
        bestScore = score;
        const start = Math.max(0, idx - 120);
        const end = Math.min(text.length, idx + query.length + 220);
        bestExcerpt = text.slice(start, end).replace(/\s+/g, " ").trim();
      }
    }

    if (bestScore > 0) {
      results.push({
        projectId: thread.projectId,
        projectName: thread.projectName,
        threadId: thread.id,
        threadTitle: thread.title,
        excerpt: bestExcerpt,
        score: bestScore
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return limit ? results.slice(0, limit) : results;
}
