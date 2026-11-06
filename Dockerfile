FROM node:24.22.2-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare pnpm@12.17.0 --activate && chown -R node:node /opt/corepack
USER node
RUN pnpm --version
USER root
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @app/api... --filter @app/worker...

FROM deps AS build
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker
RUN pnpm --filter @app/api build && pnpm --filter @app/worker build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
USER node
EXPOSE 3001
CMD ["pnpm", "--filter", "@app/api", "start"]
