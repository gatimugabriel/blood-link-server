FROM ubuntu:latest
LABEL authors="gabu"

ENTRYPOINT ["top", "-b"]
