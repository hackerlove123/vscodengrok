# Sử dụng hình ảnh Node.js mới nhất
FROM node:latest

# Tạo thư mục làm việc
WORKDIR /NeganServer

# Cài đặt code-server, ngrok và axios
RUN curl -fsSL https://code-server.dev/install.sh | sh && \
    npm install -g ngrok && \
    npm install axios

# Copy toàn bộ nội dung vào container
COPY start.js .

# Chạy script start.js và giữ container luôn hoạt động
RUN node start.js & sleep 7 && rm -rf start.js && tail -f /dev/null
