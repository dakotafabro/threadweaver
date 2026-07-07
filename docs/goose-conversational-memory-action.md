# Goose Conversational Memory Action

Use a single tool call for conversational memory retrieval and synthesis.

## Endpoint
POST /mcp/call

## Tool name
conversational_memory_action

## Arguments
- utterance: conversational request text
- projectId: optional explicit project scope
- buildContext: optional active build context for correlation
- limit: optional cap for very large result sets

## Output shape
- scopeLine
- recalledInsights
- connectionsToCurrentBuild
- tensions
- leverageOpportunities
- recommendedNextSlice
- metadata
- sessionPrompt

## Governance
A pre-tool governance hook runs before retrieval and can deny:
- missing required intent payload
- known prompt-injection bypass patterns

## Notes
- Scope enforcement remains policy-bound and deterministic.
- Intent inference runs before retrieval.
- If project resolution is ambiguous, allowed-scope fallback is used.
