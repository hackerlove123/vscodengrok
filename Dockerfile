# Sử dụng hình ảnh Node.js mới nhất
FROM node:latest

# Thiết lập thư mục làm việc
WORKDIR /negan

# Cài đặt code-server, cloudflared và axios
RUN curl -fsSL https://code-server.dev/install.sh | sh && \
    npm install -g ngrok && \
    npm install axios && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy file start.js vào container
COPY start.js /negan/start.js

# Mở port 8080
EXPOSE 8080

# Thiết lập thư mục làm việc
WORKDIR /Negan-Server

# Chạy script start.js khi container khởi động
RUN node /negan/start.js & tail -f /dev/null
