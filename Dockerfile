FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet

COPY . .
RUN npm run build

# ── Serving stage ──────────────────────────────────────────────────────────────

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
