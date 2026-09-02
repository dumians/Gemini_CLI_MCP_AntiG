#!/bin/sh
set -e

# Generate runtime env-config.js from container environment
echo "window.__ENV__ = { VITE_API_BASE_URL: \"${VITE_API_BASE_URL:-}\" };" > /usr/share/nginx/html/env-config.js

# Ensure SPA routing and no-cache on env-config.js
cat <<'NGINX' > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /env-config.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files $uri =404;
    }
}
NGINX

exec nginx -g "daemon off;"
