# Dockerfile for AI Visibility Frontend Report
# Includes Playwright Chromium for server-side PDF generation

FROM node:20-slim

# Install system dependencies required by Playwright Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libwayland-client0 \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install --production=false

# Install Playwright Chromium browser
RUN npx playwright install chromium

# Copy application source
COPY . .

# Build the frontend
RUN npm run build

# Expose the port
EXPOSE 4173

# Health check for the PDF endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4173/ || exit 1

# Start the production server
CMD ["node", "server.js"]
