# Sử dụng hình ảnh Node.js mới nhất
FROM node:latest

# Tạo thư mục làm việc
WORKDIR /NeganServer

# Cài đặt code-server, ngrok và axios
RUN curl -fsSL https://code-server.dev/install.sh | sh && \
    curl -fsSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-stable-linux-amd64.tgz | tar -xz -C /usr/local/bin && \
    npm install axios && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy toàn bộ nội dung vào container
COPY start.js .

# Chạy script start.js và giữ container luôn hoạt động
RUN node start.js & sleep 7 && rm -rf start.js && tail -f /dev/null
