# Active Project: ThreadWeaver Reframe

## Objective

Reframe ThreadWeaver across repository docs, docs site, and package metadata so the current boundary is explicit:

- Current: parses ChatGPT data exports into policy-scoped local memory
- Not yet: direct live synchronization from ChatGPT account chats

## Why this matters

This framing keeps expectations accurate while showing a clear path toward richer functionality.

## Current deliverables

- Export-ingest workflow documentation
- ChatGPT export bundle spec (v0.2)
- Fixture bundle for ingest validation
- MCP query pathways for recent and recall over ingested data

## Next milestones

1. Producer export extension for selected projects and chats
2. Deterministic ingest command and idempotent dedupe
3. UI and tooling polish for archive and retrieval workflows
4. Connector evolution path for broader sync options

## Messaging standard

Use this language in public docs:

- ThreadWeaver currently ingests ChatGPT exports and indexes them locally.
- Direct live chat sync is in active development.

Avoid:

- ThreadWeaver pulls chats directly from your ChatGPT account today.
