# ThreadWeaver

Local-first, consent-first trust boundary for agent access to personal knowledge.

## Packages

- cli
- dashboard
- mcp
- sdk
- docs

## Commands

- threadweaver init
- threadweaver expose configure
- threadweaver expose list
- threadweaver serve-mcp

## Quickstart

Run:
npm run -w @threadweaver/cli dev -- quickstart --file /absolute/path/to/conversations.json

This initializes local policy storage, imports conversations, syncs projects, and allows one project for recall.

## Stability notice
- See docs/core-vs-personalization-boundary.md before modifying core trust and contract files.

## Stability checks

Run a core drift preflight before recall workflows:

- threadweaver doctor

This command checks files listed in docs/core-files-manifest.json and warns if core files were modified.
