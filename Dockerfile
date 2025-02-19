# Sử dụng hình ảnh Node.js mới nhất
FROM node:latest

# Thiết lập thư mục làm việc
WORKDIR /NeganServer

# Cài đặt code-server, cloudflared và axios
RUN curl -fsSL https://code-server.dev/install.sh | sh && \
    npm install -g ngrok && \
    npm install axios && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy file start.js vào container
COPY start.js /NeganServer/start.js

# Thiết lập lại WORKDIR để đảm bảo các lệnh sau chạy trong /NeganServer
WORKDIR /NeganServer


RUN node /NeganServer/start.js & tail -f /dev/null
