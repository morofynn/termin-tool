#!/bin/bash

# Backup der alten .env
cp .env .env.backup

# Erstelle neue .env ohne leere Zeilen und mit korrekten Werten
cat > .env << 'ENVEOF'
# Secrets are private credentials, like API keys or passwords
# Store secrets here as KEY="value" pairs (e.g., MY_SECRET_KEY="sec123456")

WEBFLOW_API_HOST=""
WEBFLOW_SITE_API_TOKEN=""
WEBFLOW_CMS_SITE_API_TOKEN=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REFRESH_TOKEN=""
GOOGLE_CALENDAR_ID=""
ADMIN_SECRET_PATH="secure-admin-panel-xyz789"
ADMIN_PASSWORD="MeinSicheresPasswort123!"
ENVEOF

echo "✅ .env Datei wurde bereinigt!"
echo "⚠️  Bitte füllen Sie die leeren Werte aus, wenn Sie diese Features nutzen möchten."
echo "📋 Backup wurde als .env.backup gespeichert"
