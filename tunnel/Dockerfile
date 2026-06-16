FROM alpine:latest
RUN apk add --no-cache openssh-client
CMD ["ssh", "-NT", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=60", "-i", "/root/.ssh/id_ed25519", "-R", "8080:localhost:80", "root@187.127.143.121"]
