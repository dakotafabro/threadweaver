# ThreadWeaver Export Import Workflow

## Source
ThreadWeaver supports OpenAI ChatGPT export input as either:
- a single conversations file
- a directory containing shard files named conversations-*.json

## Flow
1. Run connect command with a file or export directory path
2. ThreadWeaver parses conversation records and normalizes message content
3. Threads are written to ~/.threadweaver/chatgpt_threads.json
4. Projects discovered from source metadata are synced into policy
5. Policy controls allow/deny access by project

## Commands
- threadweaver connect chatgpt-export --file /path/to/export
- threadweaver projects sync-from-import
- threadweaver projects list
- threadweaver recent --project chatgpt-general --limit 10
- threadweaver recall "query text" --project chatgpt-general --limit 5

## Boundary
ThreadWeaver currently operates on exported ChatGPT data and local ingestion.
Direct live synchronization with a ChatGPT account is not available in the current release.

## Boundary
ThreadWeaver currently operates on exported ChatGPT data and local ingestion.
Direct live synchronization with a ChatGPT account is not available in the current release.

## Boundary

ThreadWeaver currently operates on exported ChatGPT data and local ingestion.
Direct live synchronization with a ChatGPT account is not available in the current release.
