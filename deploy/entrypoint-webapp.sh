#!/bin/sh
set -e

# Generate runtime env-config.js from container environment
echo "window.__ENV__ = { VITE_API_BASE_URL: \"${VITE_API_BASE_URL:-}\" };" > /usr/share/nginx/html/env-config.js

# Build Nginx configuration with SPA routing, cache policies, and optional API proxying
if [ -n "${VITE_API_BASE_URL}" ]; then
cat <<NGINX > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass ${VITE_API_BASE_URL}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files \$uri =404;
    }

    location = /env-config.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files \$uri =404;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files \$uri =404;
    }

    location / {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
else
cat <<'NGINX' > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files $uri =404;
    }

    location = /env-config.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files $uri =404;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location / {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files $uri $uri/ /index.html;
    }
}
NGINX
fi

exec nginx -g "daemon off;"
