FROM node:18-alpine as build

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_DEBUG
ARG VITE_ENABLE_ANALYTICS
ARG VITE_ENABLE_PWA

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_DEBUG=${VITE_DEBUG}
ENV VITE_ENABLE_ANALYTICS=${VITE_ENABLE_ANALYTICS}
ENV VITE_ENABLE_PWA=${VITE_ENABLE_PWA}

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]