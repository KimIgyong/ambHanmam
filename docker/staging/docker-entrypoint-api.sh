#!/bin/sh
# Ensure uploads directory exists and is writable
# (Named volumes mount as root, overriding Dockerfile chown)
mkdir -p /app/apps/api/uploads
chown -R node:node /app/apps/api/uploads

# Drop privileges and run app as node user
exec su-exec node node dist/main
