# ThreadWeaver MCP Conversational Demo

## Example utterance
I remember thinking within chatgpt about Bitcoin and show overlap with build about consent dashboard project chatgpt general

## Endpoint and tool
- Endpoint: POST /mcp/call
- Tool: infer_and_recall

## Deterministic parser summary
{
  "ok": true,
  "name": "infer_and_recall",
  "inferred": {
    "mode": "recall",
    "query": "I remember thinking within chatgpt about Bitcoin and show overlap with build about consent dashboard project chatgpt general",
    "projectHint": "bitcoin",
    "confidence": 0.9500000000000001,
    "reasons": [
      "mode-default-recall",
      "project-hint-known-name"
    ]
  },
  "scope": {
    "searchedProjects": [
      "aaif-ambassador",
      "chatgpt-general"
    ],
    "confidence": 0.7,
    "resolution": "no-project-specified"
  },
  "result_count": 0,
  "sample_titles": [],
  "row_count": null,
  "sample_recent_titles": [],
  "overlap_count": 0,
  "error": null
}

## LLM parser summary
{
  "ok": true,
  "name": "infer_and_recall",
  "inferred": {
    "mode": "recall",
    "query": "I remember thinking within chatgpt about Bitcoin and show overlap with build about consent dashboard project chatgpt general",
    "projectHint": "bitcoin",
    "confidence": 0.9500000000000001,
    "reasons": [
      "mode-default-recall",
      "project-hint-known-name"
    ]
  },
  "scope": {
    "searchedProjects": [
      "aaif-ambassador",
      "chatgpt-general"
    ],
    "confidence": 0.7,
    "resolution": "no-project-specified"
  },
  "result_count": 0,
  "sample_titles": [],
  "row_count": null,
  "sample_recent_titles": [],
  "overlap_count": 0,
  "error": null
}

## Recent query demo (AAIF, project hint normalization)
{
  "ok": true,
  "name": "recent_chatgpt",
  "inferred": null,
  "scope": {
    "projectId": "chatgpt-general",
    "searchedProjects": [
      "chatgpt-general"
    ],
    "confidence": 0.98,
    "resolution": "project-exact-match"
  },
  "result_count": null,
  "sample_titles": [],
  "row_count": 5,
  "sample_recent_titles": [
    "Goose Interactive Shell Input",
    "AAIF Reading List",
    "Goose Integration with ChatGPT",
    "AGI and Human Infrastructure",
    "React Problem Space"
  ],
  "overlap_count": null,
  "error": null
}

## Notes
- Project hint normalization resolves chatgpt general to the allowed project scope.
- infer_and_recall supports deterministic parsing and optional LLM parsing with fallback.
- Policy enforcement remains deterministic regardless of parser path.
