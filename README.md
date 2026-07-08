# ThreadWeaver

Consent-first conversational memory for Goose workflows, currently powered by ChatGPT data export ingestion.

## Current product boundary

ThreadWeaver does not directly connect to or sync from a live ChatGPT account at this time.

Current support:
- Import ChatGPT export data
- Normalize and scope conversations locally
- Apply policy-gated retrieval
- Surface recall in Goose via MCP tools

In progress:
- Export-bundle producer workflow for project and chat selection
- Ingest contracts for deterministic archive and query
- Future connector architecture for richer sync paths

## Packages

- cli
- dashboard
- mcp
- sdk
- docs

## Commands

- threadweaver init
- threadweaver connect chatgpt-export --file /path/to/export
- threadweaver projects sync-from-import
- threadweaver projects allow --project chatgpt-general --access summary
- threadweaver recent --project chatgpt-general --limit 10
- threadweaver recall "query text" --project chatgpt-general --limit 5

## Quickstart

Run:

npm install
npm run -w @threadweaver/cli dev -- init
threadweaver connect chatgpt-export --file /absolute/path/to/export-or-conversations.json
threadweaver projects sync-from-import
threadweaver projects allow --project chatgpt-general --access summary

## Active project docs

- docs/active-project-threadweaver.md
- docs/specs/chatgpt-export-bundle-v0.2.md

## Stability notice

See docs/core-vs-personalization-boundary.md before modifying trust and contract files.

## Stability checks

Run a core drift preflight before recall workflows:

- threadweaver doctor
