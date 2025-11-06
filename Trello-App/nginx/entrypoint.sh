#!/bin/sh

# Read from the template file (inside the container)
# Substitute the BACKEND_HOST variable
envsubst '${BACKEND_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the original Nginx CMD
exec "$@"