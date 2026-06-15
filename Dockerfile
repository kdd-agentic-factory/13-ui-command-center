FROM node:20.18.0-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet

COPY . .
# Bake the live telemetry-dataset service URL so the Data Cube reads real
# sessions (CORS is open on the service). Overridable at build time.
ARG VITE_TELEMETRY_URL=https://kdd-rjz-telemetry.fly.dev
ENV VITE_TELEMETRY_URL=$VITE_TELEMETRY_URL
ARG VITE_TWIN_URL=https://kdd-rjz-digital-twin.fly.dev
ENV VITE_TWIN_URL=$VITE_TWIN_URL
# RAG base only (NEVER the API key — that stays server-side). With just the URL
# the browser reaches the service and surfaces the honest "KB reachable" state;
# full grounding lights up once a key-injecting proxy is configured.
ARG VITE_RAG_URL=https://kdd-rjz-rag.fly.dev
ENV VITE_RAG_URL=$VITE_RAG_URL
RUN npm run build

# ── Serving stage ──────────────────────────────────────────────────────────────

FROM nginx:1.27.3-alpine

COPY --from=build /app/dist /usr/share/nginx/html
# Template is envsubst'd → /etc/nginx/conf.d/default.conf at container start.
# Filter to KDD_* only so nginx's own $vars (e.g. $uri) are left untouched.
COPY default.conf.template /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER=KDD_

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
