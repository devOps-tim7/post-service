#!/bin/bash

VERSION=${1}
DOCKERHUB_USERNAME=${2}
DOCKERHUB_PASSWORD=${3}

IMAGE=${DOCKERHUB_USERNAME}/post-service:${VERSION}

DOCKER_BUILDKIT=1 docker build -t ${IMAGE} --no-cache .

docker login --username ${DOCKERHUB_USERNAME} --password=${DOCKERHUB_PASSWORD}
docker push ${IMAGE}
