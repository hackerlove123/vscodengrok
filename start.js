const { exec, spawn } = require("child_process");
const axios = require("axios");

// Cấu hình
const BOT_TOKEN = "7828296793:AAEw4A7NI8tVrdrcR0TQZXyOpNSPbJmbGUU";
const CHAT_ID = "7371969470";
const NGROK_AUTH_TOKEN = "2tEd9VIVsq4yjGzeuELkR33Uw12_7QvuNGXyPCb9Bty6r4jdK";

// Hàm gửi tin nhắn qua Telegram
const sendTelegramMessage = async (message) => {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
        });
        console.log("✅ Tin nhắn đã được gửi thành công!");
    } catch (error) {
        console.error("❌ Lỗi khi gửi tin nhắn:", error);
    }
};

// Hàm kiểm tra xem code-server đã sẵn sàng chưa
const waitForCodeServer = async () => {
    await sendTelegramMessage("🔄 Đang kiểm tra code-server...");
    return new Promise((resolve, reject) => {
        const checkServer = setInterval(() => {
            exec("curl -s http://localhost:8080", (error) => {
                if (!error) {
                    clearInterval(checkServer);
                    resolve();
                }
            });
        }, 1000);

        // Timeout sau 30 giây
        setTimeout(() => {
            clearInterval(checkServer);
            reject(new Error("❌ Không thể kết nối đến code-server sau 30 giây."));
        }, 30000);
    });
};

// Hàm lấy URL của Ngrok Tunnel từ API
const getNgrokTunnelUrl = async () => {
    try {
        const response = await axios.get("http://127.0.0.1:4040/api/tunnels");
        const tunnels = response.data.tunnels;

        if (tunnels.length > 0) {
            return tunnels[0].public_url;
        } else {
            throw new Error("❌ Không tìm thấy tunnel nào.");
        }
    } catch (error) {
        console.error("❌ Lỗi khi lấy URL từ Ngrok API:", error);
        throw error;
    }
};

// Hàm khởi chạy Ngrok Tunnel
const startNgrokTunnel = async (port) => {
    await sendTelegramMessage("🔄 Đang thêm authtoken cho Ngrok...");

    // Thêm authtoken cho Ngrok
    exec(`ngrok config add-authtoken ${NGROK_AUTH_TOKEN}`, async (error) => {
        if (error) {
            await sendTelegramMessage("❌ Lỗi khi thêm authtoken cho Ngrok.");
            throw error;
        }

        await sendTelegramMessage("✅ Authtoken đã được thêm thành công!");

        // Khởi chạy Ngrok Tunnel
        const ngrokProcess = spawn("ngrok", ["http", port]);

        // Đợi 5 giây để Ngrok khởi động hoàn toàn
        setTimeout(async () => {
            try {
                const tunnelUrl = await getNgrokTunnelUrl();
                await sendTelegramMessage(`🌐 Ngrok Tunnel đang chạy:\n${tunnelUrl}`);
            } catch (error) {
                await sendTelegramMessage("❌ Không thể lấy URL của Ngrok Tunnel.");
            }
        }, 5000);

        ngrokProcess.stderr.on("data", (data) => {
            console.error(`[ngrok] ${data.toString()}`);
        });

        ngrokProcess.on("close", (code) => {
            sendTelegramMessage(`🔴 Ngrok đã đóng với mã ${code}`);
        });
    });
};

// Hàm khởi chạy code-server
const startCodeServer = async () => {
    await sendTelegramMessage("🔄 Đang khởi chạy code-server...");

    const codeServerProcess = exec("code-server --bind-addr 0.0.0.0:8080 --auth none");

    // Bỏ qua các lỗi từ code-server
    codeServerProcess.stderr.on("data", () => {});

    // Đợi code-server khởi động thành công
    await waitForCodeServer();
    await sendTelegramMessage("✅ code-server đã sẵn sàng!");
};

// Hàm chính
const main = async () => {
    try {
        await startCodeServer();
        await startNgrokTunnel(8080);
    } catch (error) {
        await sendTelegramMessage(`❌ Lỗi trong quá trình khởi chạy: ${error.message}`);
    }
};

// Khởi chạy
main();
