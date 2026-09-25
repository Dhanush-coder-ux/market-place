# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Replace default nginx config with our SPA config
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
