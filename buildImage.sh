#!/bin/bash

username="$1"

docker login

cd gateway-service

docker build -t gateway-service:latest .

docker tag gateway-service:latest "$username/gateway-service:latest"

docker push "$username/gateway-service:latest"

cd ..

cd core-service

docker build -t core-service:latest .

docker tag core-service:latest "$username/core-service:latest"

docker push "$username/core-service:latest"