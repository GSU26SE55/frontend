# Stage 1: Build
FROM node:22.14.0-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# BuildKit deliberately excludes secret contents from its cache key. Jenkins
# supplies a unique build id so changing FRONTEND_ENV_FILE always rebuilds the
# Vite bundle while the dependency-install layer above remains cached.
ARG FRONTEND_BUILD_ID=local
RUN --mount=type=secret,id=frontend_env,target=/app/.env,required=true \
    test -n "$FRONTEND_BUILD_ID" && \
    grep -q '^VITE_API_BASE_URL=' /app/.env && \
    pnpm build

# Stage 2: Serve với Nginx
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing — mọi route 404 về index.html
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
