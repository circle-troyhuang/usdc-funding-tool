# Production image with pre-built client and pre-installed deps
FROM node:18-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

# Copy server deps, server code, and pre-built React client
COPY node_modules/ ./node_modules/
COPY package.json ./
COPY server/ ./server/
COPY client/build/ ./client/build/

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "server/index.js"]
