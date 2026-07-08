# Threadweaver ChatGPT Export Bundle Spec v0.1

## Goal
Portable single-file export from a ChatGPT-side producer into a deterministic Threadweaver ingest path.

## Bundle
- File: `threadweaver-export-<YYYY-MM-DD>-<HHmmss>-v0.1.zip`
- Contents:
  - `manifest.json`
  - `index/conversations.jsonl`
  - `index/messages.jsonl`
  - `conversations/<conversation_id>.md`
  - `checksums/sha256.txt`

## Required fields
- Manifest: `spec_version`, `export_id`, `source`, `exported_at`, `counts`, `files`
- Conversation line: `source`, `conversation_id`, `title`
- Message line: `source`, `conversation_id`, `message_id`, `role`, `content`, `sequence`

## Dedupe keys
- Conversation key: `source + conversation_id`
- Message key: `source + conversation_id + message_id`

## Ingest behavior
1. Validate structure
2. Validate manifest schema
3. Verify checksums
4. Validate JSONL rows
5. Upsert conversations/messages with dedupe

## Error codes
- `INVALID_BUNDLE_STRUCTURE`
- `INVALID_MANIFEST`
- `CHECKSUM_MISMATCH`
- `INVALID_RECORD`
- `UNSUPPORTED_SPEC_VERSION`
- `INGEST_PARTIAL_SUCCESS`
