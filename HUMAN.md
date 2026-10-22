# ThreadWeaver - what changes for you

ThreadWeaver lets your agent recall past ChatGPT conversations you choose to import. It's consent-first: nothing is recalled from a project until you allow it.

## How it interacts with an agent

You import a ChatGPT data export. ThreadWeaver normalizes it into projects locally. You allow a project at an access level (for example `summary`). Then the agent can surface recall through MCP tools, within the scope you set. It doesn't connect to or sync from a live ChatGPT account.

## When to use it

When ideas from old ChatGPT conversations belong in your current work. Skip it for conversations you wouldn't want an agent to read, and don't import those.

## Reserved for human judgment

What you import, which projects you allow, and at what access level. The docs describe policy as deny by default, and say personal changes shouldn't override that. Read `docs/core-vs-personalization-boundary.md` before changing trust or contract files.

## What it reads, writes and sends

- Reads the export file you point it at.
- `threadweaver init` writes `~/.threadweaver/policy.json` and `~/.threadweaver/audit.log`. Imported data also lives under `~/.threadweaver/`.
- Network use: not documented.

## Cost

0 tokens of context (`token_cost` in bpm.json). That figure isn't verified against the MCP tool descriptions it loads.

## Check it's working

Run `threadweaver doctor`, then `threadweaver recent --project chatgpt-general --limit 10` and `threadweaver recall "query text" --project chatgpt-general`.

## Turn it off

Uninstall the goose plugin, then `bpm remove threadweaver`. Whether removal deletes `~/.threadweaver/` isn't documented; delete it yourself if you want the imported data gone.
