ARG NODE_IMAGE
ARG NGINX_IMAGE
FROM ${NODE_IMAGE} AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet

COPY . .
# Commercial delivery never defaults to direct historical service URLs.
ARG VITE_PRODUCT_PROFILE=chassis
ENV VITE_PRODUCT_PROFILE=$VITE_PRODUCT_PROFILE
ENV VITE_TELEMETRY_URL=/api/telemetry
ENV VITE_ENABLE_RACE_COMMAND_CENTER_PREVIEW=false
ARG VITE_INSFORGE_URL
ARG VITE_INSFORGE_ANON_KEY
ENV VITE_INSFORGE_URL=$VITE_INSFORGE_URL
ENV VITE_INSFORGE_ANON_KEY=$VITE_INSFORGE_ANON_KEY
RUN node scripts/render-chassis-surface.mjs --check && npm run build

# ── Serving stage ──────────────────────────────────────────────────────────────

FROM ${NGINX_IMAGE}

# Alpine3.24 fixes for CVE-2026-111497 and CVE-2026-92392.
# Exact versions fail closed if the selected base/repository is incompatible.
RUN apk add --no-cache brotli-libs=1.2.1-r0 curl=8.23.0-r0 libcurl=8.23.0-r0

COPY docker/nginx-commercial.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Template is envsubst'd → /etc/nginx/conf.d/default.conf at container start.
# Filter to KDD_* only so nginx's own $vars (e.g. $uri) are left untouched.
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/chassis-surface.map.conf /etc/nginx/chassis-surface.map.conf
COPY docker/15-validate-chassis-env.envsh /docker-entrypoint.d/15-validate-chassis-env.envsh
RUN chmod +x /docker-entrypoint.d/15-validate-chassis-env.envsh
ENV NGINX_ENVSUBST_FILTER=KDD_

USER 101:101
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
