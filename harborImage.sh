#!/bin/bash

set -euo pipefail

registry="$1"
projectName="$2"
imageName="$3"
gitrepo="$4"
HARBOR_PASSWORD="$5"
HARBOR_USERNAME="$6"


if [ -z "$registry" ] || [ -z "$projectName" ] || [ -z "$imageName" ] || [ -z "$gitrepo" ] || [ -z "$HARBOR_PASSWORD" ] || [ -z "$HARBOR_USERNAME" ]; then
  echo "Usage: $0 <registry> <projectName> <imageName> <gitrepo> <HARBOR_PASSWORD> <HARBOR_USERNAME>"
  exit 1
fi

# Extract the repository name from the git URL
repoName=$(basename -s .git "$gitrepo")
if [ -z "$repoName" ]; then
  echo "Failed to extract repository name from URL: $gitrepo"
  exit 1
fi

# Clone the repository
if [ -d "$repoName" ]; then
  echo "Directory $repoName already exists. Pulling latest changes."
  cd "$repoName"
  git pull
else
  git clone "$gitrepo"
  cd "$repoName"
fi

# Build the Docker image
docker build -t "$imageName" .

# Tag the image for the Harbor registry
fullImageName="$registry/$projectName/$imageName:latest"
docker tag "$imageName" "$fullImageName"

# Login to Docker registry (Harbor)
echo "$HARBOR_PASSWORD" | docker login "$registry" -u "$HARBOR_USERNAME" --password-stdin

# Push the image to the Harbor registry
docker push "$fullImageName"