ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app

# --- Install workspace deps for `api` only ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
# Workspace package manifests (api may depend on shared packages later)
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter api...

# --- Compile ---
FROM deps AS build
COPY apps/api ./apps/api
COPY packages ./packages
COPY tsconfig.json ./
RUN pnpm --filter api run build

# --- Production bundle (pnpm deploy: dist + prod node_modules) ---
FROM build AS bundle
RUN pnpm --filter api deploy --prod /srv

# --- Runtime ---
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /srv

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8000

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

COPY --from=bundle --chown=app:app /srv /srv

USER app
EXPOSE 8000

CMD ["node", "dist/server.js"]
