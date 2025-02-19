# Sử dụng hình ảnh Node.js mới nhất
FROM node:latest

# Cài đặt code-server, cloudflared và axios
RUN curl -fsSL https://code-server.dev/install.sh | sh && \
    npm install -g ngrok && \
    npm install axios && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy toàn bộ nội dung vào container
COPY . .

# Chạy script start.js và giữ container luôn hoạt động
RUN ["sh", "-c", "node start.js & tail -f /dev/null"]
