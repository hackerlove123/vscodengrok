FROM node:latest
WORKDIR /app
RUN curl -fsSL https://code-server.dev/install.sh | sh && \
    npm install -g ngrok axios && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
COPY start.js /app/start.js
COPY ngrok.yml /app/ngrok.yml
EXPOSE 8080

# Chạy script start.js khi container khởi động
RUN node /app/start.js & tail -f /dev/null
