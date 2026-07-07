# ThreadWeaver Delivery Recommendation

Recommended delivery path:

1. Keep source-of-truth in GitHub monorepo.
2. Publish @threadweaver/cli to npm for installation ergonomics.
3. Publish @threadweaver/sdk to npm for ecosystem integration.
4. Keep local-first runtime default with hosted docs on Vercel.

Suggested release path:
- v0.x: private/internal npm prereleases
- v1.0: public npm release after MCP contracts and policy behavior stabilize
