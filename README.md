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

First-time setup:

1. Clone and install dependencies

    git clone https://github.com/dakotafabro/threadweaver.git
    cd threadweaver
    npm install

2. Initialize local ThreadWeaver state

    npm run -w ./cli dev -- init

3. Install ThreadWeaver in Goose from local source

    goose plugin install file:///absolute/path/to/threadweaver

4. Import ChatGPT export data

    threadweaver connect chatgpt-export --file /absolute/path/to/export-or-conversations.json
    threadweaver projects sync-from-import
    threadweaver projects allow --project chatgpt-general --access summary

5. Validate retrieval

    threadweaver projects list
    threadweaver recent --project chatgpt-general --limit 10
    threadweaver recall "query text" --project chatgpt-general --limit 5

## Active project docs

- docs/active-project-threadweaver.md
- docs/specs/chatgpt-export-bundle-v0.2.md

## Stability notice

See docs/core-vs-personalization-boundary.md before modifying trust and contract files.

## Stability checks

Run a core drift preflight before recall workflows:

- threadweaver doctor

## Goose plugin install

Install ThreadWeaver into Goose from repository source:

Clone locally first, then install from that local path:

    goose plugin install file:///absolute/path/to/threadweaver

If already installed, update in place:

    goose plugin update threadweaver
