# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage  
FROM node:20-alpine AS production-deps

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (skip scripts since build already done)
RUN npm ci --only=production --ignore-scripts

# Final stage
FROM gcr.io/distroless/nodejs24-debian12

# Set working directory
WORKDIR /app

# Copy package files
COPY --from=builder package*.json ./

# Copy production dependencies
COPY --from=production-deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/build ./build

# Expose HTTP port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the Streamable HTTP server by default (recommended for multi-client support)
CMD ["build/streamable-http-server.js"]