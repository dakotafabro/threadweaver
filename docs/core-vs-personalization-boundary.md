# Core vs Personalization Boundary

ThreadWeaver supports personalization, but core trust and contract files must remain stable.

## Core
Core files define policy enforcement, retrieval behavior, and MCP tool contracts.

Changing core files can create unexpected behavior, break compatibility, or weaken safety guarantees.

## Personalization
Personalization should be applied through user profile mappings, aliases, and language preferences.

Personalization should not override deny-by-default policy enforcement, scope checks, or audit behavior.

## Stability Notice
If core files are changed locally, run threadweaver doctor before using recall workflows.
