# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- run (server bundle is self-contained; only Node built-ins are required) ----
FROM node:22-alpine
ENV NODE_ENV=production PORT=4000 DATA_DIR=/data
WORKDIR /app
COPY --from=build /app/dist/taxi ./dist/taxi
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 4000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
CMD ["node", "dist/taxi/server/server.mjs"]
