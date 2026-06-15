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
# RAG / pipelines / security are API-key/credentialed: they are NOT baked to a
# direct URL here. They default to the same-origin BFF paths (/api/rag,
# /api/pipelines, /api/security) which the nginx BFF below proxies to the Fly
# services while injecting the internal key + principal server-side. This is how
# the credentialed integrations go fully live without any secret in the browser.
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
