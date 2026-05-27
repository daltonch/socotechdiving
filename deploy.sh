#!/usr/bin/env bash
#
# deploy.sh — publish the SoCoTechDiving site to GitHub Pages.
#
# The site lives in docs/ and is served by GitHub Pages from the main branch
# (Settings -> Pages -> Source: "Deploy from a branch", branch: main, folder: /docs).
#
# Deploying is just a commit + push: GitHub Pages rebuilds automatically and
# purges its own Fastly CDN on every deploy, so there is NO manual cache
# invalidation step (unlike CloudFront/S3).
#
# Usage:
#   ./deploy.sh                 # commit docs/ changes with an auto message and push
#   ./deploy.sh "your message"  # commit with a custom message and push
#
set -euo pipefail

# Always operate from the repo root, regardless of where the script is called from.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

BRANCH="main"
SITE_DIR="docs"
COMMIT_MSG="${1:-deploy: site update $(date -u '+%Y-%m-%d %H:%M:%S UTC')}"

# Sanity checks.
command -v git >/dev/null 2>&1 || { echo "error: git not found on PATH" >&2; exit 1; }
[ -d "$SITE_DIR" ] || { echo "error: $SITE_DIR/ not found — run from the project that contains it" >&2; exit 1; }

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "error: on branch '$CURRENT_BRANCH', expected '$BRANCH'. Checkout $BRANCH first." >&2
  exit 1
fi

# Stage only the site directory.
git add "$SITE_DIR"

if git diff --cached --quiet; then
  echo "No staged changes in $SITE_DIR/ — nothing to deploy."
  exit 0
fi

echo "Committing changes in $SITE_DIR/ ..."
git commit -m "$COMMIT_MSG"

echo "Pushing to origin/$BRANCH ..."
git push origin "$BRANCH"

echo
echo "Done. GitHub Pages will rebuild in ~30-60s and auto-purge its CDN."
echo "Live site: https://socotechdiving.com"
echo "Build status: https://github.com/daltonch/socotechdiving/actions"
