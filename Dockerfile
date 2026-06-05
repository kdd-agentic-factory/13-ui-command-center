FROM node:20.18.0-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet

COPY . .
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
