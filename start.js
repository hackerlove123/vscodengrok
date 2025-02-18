const { exec, spawn } = require("child_process");
const axios = require("axios");

// Cấu hình
const BOT_TOKEN = "7828296793:AAEw4A7NI8tVrdrcR0TQZXyOpNSPbJmbGUU";
const CHAT_ID = "7371969470";
const NGROK_API_TOKEN = "2tEXCJqTfWD0ISxY23q4joQ08v8_5q4KXTJdoUXoUjBeJp8qD";

// Hàm gửi tin nhắn qua Telegram
const sendTelegramMessage = async (message) => {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
        });
        console.log("Tin nhắn đã được gửi thành công!");
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
    }
};

// Hàm kiểm tra xem code-server đã sẵn sàng chưa
const waitForCodeServer = () => new Promise((resolve, reject) => {
    const checkServer = setInterval(() => {
        exec("curl -s http://localhost:8080", (error) => {
            if (!error) {
                clearInterval(checkServer);
                resolve();
            }
        });
    }, 1000);

    // Timeout sau 30 giây nếu code-server không khởi động được
    setTimeout(() => {
        clearInterval(checkServer);
        reject(new Error("Không thể kết nối đến code-server sau 30 giây."));
    }, 30000);
});

// Hàm lấy URL từ Ngrok API
const getNgrokUrl = async () => {
    try {
        const response = await axios.get("http://localhost:4040/api/tunnels");
        const tunnels = response.data.tunnels;
        if (tunnels.length > 0) {
            return tunnels[0].public_url;
        }
    } catch (error) {
        console.error("Lỗi khi lấy URL từ Ngrok API:", error);
    }
    return null;
};

// Hàm khởi chạy Ngrok Tunnel
const startNgrokTunnel = async (port) => {
    console.log("Đang khởi chạy Ngrok...");
    const ngrokProcess = spawn("ngrok", ["http", port, "--authtoken", NGROK_API_TOKEN, "--log", "stdout"]);

    // Xử lý đầu ra của Ngrok
    ngrokProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`[ngrok] ${output}`);
    });

    ngrokProcess.stderr.on("data", (data) => {
        const errorOutput = data.toString();
        console.error(`[ngrok] ${errorOutput}`);
        sendTelegramMessage(`❌ Lỗi từ Ngrok: ${errorOutput}`);
    });

    // Đợi 5 giây để Ngrok khởi động
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Lấy URL từ Ngrok API
    const tunnelUrl = await getNgrokUrl();
    if (tunnelUrl) {
        console.log(`🌐 URL: ${tunnelUrl}`);
        sendTelegramMessage(`🌐 Ngrok Tunnel đang chạy:\n${tunnelUrl}`);
    } else {
        console.error("Không thể lấy URL từ Ngrok.");
        sendTelegramMessage("❌ Không thể lấy URL từ Ngrok.");
    }

    // Xử lý khi Ngrok đóng
    ngrokProcess.on("close", (code) => {
        console.log(`Ngrok đã đóng với mã ${code}`);
        sendTelegramMessage(`🔴 Ngrok đã đóng với mã ${code}`);
    });
};

// Hàm khởi chạy code-server và Ngrok Tunnel
const startCodeServerAndNgrok = async () => {
    try {
        console.log("Đang khởi chạy code-server...");
        await sendTelegramMessage("🔄 Đang khởi chạy code-server...");

        const codeServerProcess = exec("code-server --bind-addr 0.0.0.0:8080 --auth none");

        // Bỏ qua các lỗi từ code-server
        codeServerProcess.stderr.on("data", () => {}); // Không xử lý lỗi

        // Đợi code-server khởi động thành công
        await waitForCodeServer();
        console.log("✅ code-server đã sẵn sàng!");
        await sendTelegramMessage("✅ code-server đã sẵn sàng!");

        console.log("Đang khởi chạy Ngrok Tunnel...");
        await sendTelegramMessage("🔄 Đang khởi chạy Ngrok Tunnel...");

        await startNgrokTunnel(8080);
    } catch (error) {
        console.error("Lỗi trong quá trình khởi chạy:", error);
        sendTelegramMessage(`❌ Lỗi trong quá trình khởi chạy: ${error.message}`);
    }
};

// Khởi chạy mọi thứ
startCodeServerAndNgrok();
