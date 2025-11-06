# Stage 1: Build React app
FROM node:18-alpine AS build-stage
WORKDIR /app

# Declare build argument for API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL


COPY frontend/package*.json ./
RUN npm install

COPY frontend/public ./public
COPY frontend/src ./src
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Install gettext-base for envsubst utility
RUN apk update && apk add --no-cache gettext-envsubst

COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy custom nginx configuration from your local 'nginx.conf'
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf.template

COPY nginx/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

ENTRYPOINT ["/docker-entrypoint.sh"]

# Original Nginx CMD will be executed by our entrypoint script via "exec "$@""
CMD ["nginx", "-g", "daemon off;"]
