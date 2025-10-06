#!/bin/bash
set -euo

registry="$1"
projectName="$2"
gitrepo="$3"
HARBOR_USERNAME="$4"
HARBOR_PASSWORD="$5"

if [ -z "$registry" ] || [ -z "$projectName" ] || [ -z "$gitrepo" ] || [ -z "$HARBOR_USERNAME" ] || [ -z "$HARBOR_PASSWORD" ]; then
  echo "Usage: $0 <registry> <projectName> <gitrepo> <HARBOR_USERNAME> <HARBOR_PASSWORD>"
  exit 1
fi

repoName=$(basename -s .git "$gitrepo")

# Clone or pull repo
if [ -d "$repoName" ]; then
  echo "Directory $repoName exists. Pulling latest changes..."
  cd "$repoName"
  git pull
else
  git clone "$gitrepo"
  cd "$repoName"
fi

# Get Git commit SHA for tagging
commit_sha=latest

# Login to Harbor once
echo "$HARBOR_PASSWORD" | docker login "$registry" -u "$HARBOR_USERNAME" --password-stdin

# Loop through services
services=("gateway-service" "core-service")

for service in "${services[@]}"; do
    if [ ! -d "$service" ]; then
        echo "Skipping $service, directory not found"
        continue
    fi
    echo "🔨 Building $service..."
    docker build -t "$service" "$service"

    fullImageName="$registry/$projectName/$service:$commit_sha"
    docker tag "$service" "$fullImageName"

    echo "🚀 Pushing $fullImageName..."
    docker push "$fullImageName"
done

echo "✅ All images built and pushed successfully!"
