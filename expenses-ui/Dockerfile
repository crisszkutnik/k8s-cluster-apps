# syntax=docker/dockerfile:1.6

FROM node:24-alpine AS builder

WORKDIR /app

ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL=__VITE_API_BASE_URL__
ARG VITE_BASE_URL=__VITE_BASE_URL__
ARG VITE_TANSTACK_BASE_URL=__VITE_TANSTACK_BASE_URL__
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BASE_URL=${VITE_BASE_URL}
ENV VITE_TANSTACK_BASE_URL=${VITE_TANSTACK_BASE_URL}

RUN pnpm build

FROM nginx:1.27-alpine AS runner

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx","-g","daemon off;"]