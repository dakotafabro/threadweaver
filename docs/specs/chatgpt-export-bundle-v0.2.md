# Threadweaver ChatGPT Export Bundle Spec v0.2

## Goal
Define a production-ready handoff between a ChatGPT-facing producer and Threadweaver ingest:
- user selects chats/projects,
- one downloadable export artifact is generated,
- Goose/Threadweaver ingests deterministically,
- archive remains human-readable and machine-fast.

## Architecture
1. Producer tool builds export artifact from selected chats/projects.
2. Artifact is downloaded locally as a single zip bundle.
3. Threadweaver ingest validates, dedupes, and indexes.
4. Query tools return recent and recall views.

## Bundle format
- File: `threadweaver-export-<YYYY-MM-DD>-<HHmmss>-v0.2.zip`
- Required contents:
  - `manifest.json`
  - `index/conversations.jsonl`
  - `index/messages.jsonl`
  - `conversations/<conversation_id>.md`
  - `checksums/sha256.txt`

## Canonical record contracts

### Conversation line (JSONL)
`source`, `conversation_id`, `title`, `project_id`, `created_at`, `updated_at`, `message_count`

### Message line (JSONL)
`source`, `conversation_id`, `message_id`, `role`, `created_at`, `content`, `sequence`, optional `metadata`

### Markdown archive contract
Conversation markdown must include frontmatter with:
`spec_version`, `source`, `conversation_id`, `title`, `project_id`, `created_at`, `updated_at`, `message_count`, `exported_at`.

## Dedupe + idempotency
- Conversation key: `source + conversation_id`
- Message key: `source + conversation_id + message_id`
- Synthetic message ID fallback: hash(role + created_at + normalized_content + sequence)
- Ingest must be idempotent across retries.

## Apps SDK alignment

## File handling
Use Apps SDK file params for input and file URI for output.

Input contract in tool descriptor:
- `_meta["openai/fileParams"]: ["source_file"]`

Output contract in `structuredContent`:
- `file_uri.download_url`
- `file_uri.file_id`
- optional `file_uri.mime_type`
- optional `file_uri.file_name`

## Tool annotations policy
Every tool must include annotations that accurately describe impact:
- `readOnlyHint`
- `openWorldHint` (write tools)
- `destructiveHint` (write tools)

If hints are missing, treat as invalid tool definition.

## Tool visibility policy
- User-facing retrieval tools: `_meta.ui.visibility: ["model", "app"]`
- Operational control tools (ingest, sync admin): `_meta.ui.visibility: ["app"]`

## Structured payload sizing
- Keep `structuredContent` concise and model-relevant.
- Put large payloads in `_meta` for widget-only consumption.
- Never place secrets in `structuredContent`, `content`, or `_meta`.

## Resource URI versioning
Widget template URIs are cache keys.
When HTML/JS/CSS changes in a breaking way, increment URI version and update all references:
- resource registration URI
- `_meta.ui.resourceUri`
- template `contents[].uri`

## Recommended MCP tools

### 1) build_threadweaver_bundle
- Purpose: produce downloadable v0.2 bundle from selected source data.
- Type: write tool.
- Annotations:
  - `readOnlyHint: false`
  - `openWorldHint: false`
  - `destructiveHint: false`

### 2) ingest_export_bundle
- Purpose: ingest zip bundle into Threadweaver canonical store.
- Type: write tool, typically app-only visibility.
- Annotations:
  - `readOnlyHint: false`
  - `openWorldHint: false`
  - `destructiveHint: false`

### 3) recent_chatgpt
- Purpose: list recent conversations from ingested store.
- Type: read-only.
- Annotations:
  - `readOnlyHint: true`

### 4) recall_chatgpt
- Purpose: fetch full conversation by id.
- Type: read-only.
- Annotations:
  - `readOnlyHint: true`

## Company knowledge compatibility
If enabling Company Knowledge compatibility, implement `search` and `fetch` with exact MCP input shapes and read-only annotations.

## TypeScript descriptor stubs

```ts
import { z } from "zod";

const fileRef = z.object({
  download_url: z.string(),
  file_id: z.string(),
  mime_type: z.string().optional(),
  file_name: z.string().optional(),
});

export const buildThreadweaverBundleTool = {
  name: "build_threadweaver_bundle",
  title: "Build Threadweaver Export Bundle",
  inputSchema: {
    source_file: fileRef,
    selection: z.object({
      mode: z.enum(["projects", "chats", "mixed", "time_range"]),
      project_ids: z.array(z.string()).default([]),
      chat_ids: z.array(z.string()).default([]),
      after: z.string().nullable().optional(),
      before: z.string().nullable().optional(),
    }),
    format: z.literal("zip"),
  },
  outputSchema: {
    file_uri: fileRef,
    export_id: z.string(),
    counts: z.object({
      conversations: z.number().int().nonnegative(),
      messages: z.number().int().nonnegative(),
    }),
  },
  annotations: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  _meta: {
    ui: { resourceUri: "ui://widget/threadweaver-export-v1.html", visibility: ["model", "app"] },
    "openai/fileParams": ["source_file"],
  },
};

export const ingestExportBundleTool = {
  name: "ingest_export_bundle",
  title: "Ingest Threadweaver Export Bundle",
  inputSchema: {
    bundle_file: fileRef,
  },
  outputSchema: {
    ok: z.boolean(),
    export_id: z.string(),
    ingested: z.object({
      conversations_new: z.number().int().nonnegative(),
      conversations_updated: z.number().int().nonnegative(),
      messages_new: z.number().int().nonnegative(),
      messages_skipped_duplicate: z.number().int().nonnegative(),
    }),
  },
  annotations: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  _meta: {
    ui: { resourceUri: "ui://widget/threadweaver-ingest-v1.html", visibility: ["app"] },
    "openai/fileParams": ["bundle_file"],
  },
};

export const recentChatgptTool = {
  name: "recent_chatgpt",
  title: "List recent ChatGPT conversations",
  inputSchema: {
    limit: z.number().int().positive().max(100).default(20),
    project_id: z.string().nullable().optional(),
    since: z.string().nullable().optional(),
  },
  outputSchema: {
    rows: z.array(
      z.object({
        conversation_id: z.string(),
        title: z.string(),
        project_id: z.string().nullable(),
        updated_at: z.string().nullable(),
        message_count: z.number().int().nonnegative(),
      })
    ),
  },
  annotations: {
    readOnlyHint: true,
  },
};

export const recallChatgptTool = {
  name: "recall_chatgpt",
  title: "Recall ChatGPT conversation",
  inputSchema: {
    conversation_id: z.string(),
  },
  outputSchema: {
    conversation: z.object({
      conversation_id: z.string(),
      title: z.string(),
      project_id: z.string().nullable(),
      updated_at: z.string().nullable(),
    }),
    messages: z.array(
      z.object({
        message_id: z.string(),
        role: z.enum(["user", "assistant", "system", "tool"]),
        created_at: z.string().nullable(),
        content: z.string(),
        sequence: z.number().int().positive(),
      })
    ),
  },
  annotations: {
    readOnlyHint: true,
  },
};
```

## Ingest error model
- `INVALID_BUNDLE_STRUCTURE`
- `INVALID_MANIFEST`
- `CHECKSUM_MISMATCH`
- `INVALID_RECORD`
- `UNSUPPORTED_SPEC_VERSION`
- `INGEST_PARTIAL_SUCCESS`

Each error returns: `file`, optional `line`, `reason`, `suggested_fix`.

## Security baseline
- Enforce auth in server-side handlers.
- Do not trust locale, userAgent, or location hints for authorization.
- Treat all returned payloads as user-visible.

## Acceptance checklist
- Bundle validates against schemas.
- Checksums match.
- Ingest is idempotent.
- Query tools return consistent output from ingested data.
- File param + file URI flow works end-to-end.
