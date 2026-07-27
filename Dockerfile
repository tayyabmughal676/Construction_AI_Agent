# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM oven/bun:1 as builder
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY frontend/package.json ./frontend/package.json

# Install all dependencies (including devDependencies for frontend build)
RUN bun install
RUN cd frontend && bun install

# Copy source code
COPY . .

# Build the frontend (Vite)
RUN cd frontend && bun run build

# Optional: Run backend TS check (commented out to speed up build, but good practice)
# RUN bunx tsc --noEmit

# ==========================================
# Stage 2: Production Image
# ==========================================
FROM oven/bun:1-slim as production
WORKDIR /app

ENV NODE_ENV=production

# Copy package files for prod install
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --production

# Copy built frontend assets
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy backend source (Bun runs TS natively, no need to transpile)
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.ts ./index.ts

# Set non-root user for security
USER bun

# Expose API port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "index.ts"]
