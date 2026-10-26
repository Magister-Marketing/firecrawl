#!/usr/bin/env sh
# Re-copies the brand-kit script from the API, where upstream maintains it, so
# this service runs the same extraction as Firecrawl's cloud engine. Run after
# merging upstream.
set -eu
cd "$(dirname "$0")"
rm -rf branding-script && mkdir branding-script
cp ../api/src/scraper/scrapeURL/engines/fire-engine/branding-script/*.ts branding-script/
echo "branding-script: $(ls branding-script | wc -l | tr -d ' ') files copied from apps/api"
