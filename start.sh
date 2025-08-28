#!/bin/bash

CLUSTER_ID='MkU3OEVBNTcwNTJENDM2Qk'

echo "Formatting storage for controller-1..."
docker run --rm \
  -v controller-1-data:/var/lib/kafka/data \
  -v "$(pwd)/controller1.properties:/tmp/server.properties" \
  confluentinc/cp-kafka:latest \
  bash -c "/usr/bin/kafka-storage format --ignore-formatted -t $CLUSTER_ID -c /tmp/server.properties"

echo "Formatting storage for controller-2..."
docker run --rm \
  -v controller-2-data:/var/lib/kafka/data \
  -v "$(pwd)/controller2.properties:/tmp/server.properties" \
  confluentinc/cp-kafka:latest \
  bash -c "/usr/bin/kafka-storage format --ignore-formatted -t $CLUSTER_ID -c /tmp/server.properties"


echo "Formatting storage for controller-3..."
docker run --rm \
  -v controller-3-data:/var/lib/kafka/data \
  -v "$(pwd)/controller3.properties:/tmp/server.properties" \
  confluentinc/cp-kafka:latest \
  bash -c "/usr/bin/kafka-storage format --ignore-formatted -t $CLUSTER_ID -c /tmp/server.properties"


# run docker compose
docker compose up -d