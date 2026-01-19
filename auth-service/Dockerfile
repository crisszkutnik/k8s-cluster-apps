FROM node:25.3.0-slim AS base

WORKDIR /app

# Production dependencies
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml /app/
RUN npm install -g pnpm@10.28.0
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

# Build time
FROM base AS build
COPY . /app
RUN npm install -g pnpm@10.28.0
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build:ts

# Build the final runtime version
FROM node:25.3.0-slim AS runtime

ENV NODE_ENV="production"

WORKDIR /app

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/package.json /app/package.json 
COPY --from=prod-deps /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build /app/dist /app/dist
CMD [ "node", "dist/app.js" ]