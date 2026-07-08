# ThreadWeaver Docs

## Current state

ThreadWeaver is local-first and export-ingest based for ChatGPT conversation memory.

It currently parses ChatGPT data exports and does not perform direct live account synchronization.

## Active project

See docs/active-project-threadweaver.md for active scope, milestones, and release messaging.

## Key specs

- docs/specs/chatgpt-export-bundle-v0.2.md
- docs/export-import-workflow.md

## Goose plugin install

    goose plugin install file:///absolute/path/to/threadweaver

    goose plugin update threadweaver

## Quickstart

1) Clone and install:

    git clone https://github.com/dakotafabro/threadweaver.git
    cd threadweaver
    npm install

2) Initialize local state:

    npm run -w @threadweaver/threadweaver-cli dev -- init

3) Install Goose plugin from local source:

    goose plugin install file:///absolute/path/to/threadweaver

4) Export ChatGPT data, unzip locally, then ingest:

    threadweaver connect chatgpt-export --file /absolute/path/to/unzipped-export-or-conversations.json
    threadweaver projects sync-from-import
    threadweaver projects allow --project chatgpt-general --access summary

5) Validate retrieval:

    threadweaver projects list
    threadweaver recent --project chatgpt-general --limit 10
    threadweaver recall "query text" --project chatgpt-general --limit 5
