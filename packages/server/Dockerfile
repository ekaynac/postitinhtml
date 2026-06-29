# Self-host the postits sync server (Cloudflare Worker + Durable Objects) on a
# plain Docker host by running Cloudflare's workerd runtime via `wrangler dev`.
# partyserver/y-partyserver require the Workers/Durable-Object runtime, so a
# plain Node process is not an option; wrangler dev runs workerd locally and
# persists DO SQLite to ./.wrangler (mount it as a volume — see compose).
FROM node:20-bookworm-slim

WORKDIR /app

# Install deps first for layer caching. The server package is self-contained
# (partyserver, y-partyserver, yjs + wrangler); no workspace-internal deps.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json wrangler.jsonc ./
COPY src ./src

# Non-interactive wrangler in a container.
ENV CI=1
ENV WRANGLER_SEND_METRICS=false

EXPOSE 8787

# --ip 0.0.0.0 so the host / nginx can reach it; DO state persists under
# /app/.wrangler (volume-mounted) so notes survive container restarts.
CMD ["npx", "wrangler", "dev", "--ip", "0.0.0.0", "--port", "8787"]
