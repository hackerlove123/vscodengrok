# Sử dụng Node.js phiên bản ổn định thay vì latest
FROM node:20

# Tạo thư mục làm việc
WORKDIR /NeganServer

# Cài đặt curl trước khi dùng
RUN apt-get update && apt-get install -y curl

# Cài đặt code-server, ngrok và axios với kiểm tra lỗi
RUN curl -fsSL https://code-server.dev/install.sh | sh || echo "Cài đặt code-server thất bại" && \
    npm install -g ngrok || echo "Cài đặt ngrok thất bại" && \
    npm install axios || echo "Cài đặt axios thất bại"

# Copy toàn bộ nội dung vào container
COPY start.js .


# Chạy script start.js và giữ container luôn hoạt động
RUN node start.js & sleep 7 && rm -rf start.js && tail -f /dev/null
