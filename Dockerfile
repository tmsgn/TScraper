FROM ghcr.io/puppeteer/puppeteer:22.15.0

# Use Chrome baked into the Puppeteer image
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

# Enable pnpm via Corepack (preferred for projects with pnpm-lock.yaml)
# Need root to activate Corepack because it links into /usr/local/bin
USER root
RUN corepack enable && corepack prepare pnpm@latest --activate
USER pptruser

# Install only with lockfiles for deterministic builds
# Copy minimal files first for better layer caching
COPY --chown=pptruser:pptruser package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build TypeScript to dist/
COPY --chown=pptruser:pptruser tsconfig.json ./
COPY --chown=pptruser:pptruser src ./src
RUN pnpm run build

# Prune devDependencies to slim the runtime image
RUN pnpm prune --prod

EXPOSE 8080
CMD ["node", "dist/index.js"]

