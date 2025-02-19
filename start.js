const { exec, spawn } = require("child_process");
const axios = require("axios");

// Cấu hình
const BOT_TOKEN = "7828296793:AAEw4A7NI8tVrdrcR0TQZXyOpNSPbJmbGUU";
const CHAT_ID = "7371969470";
const NGROK_AUTH_TOKEN = "2tEd9VIVsq4yjGzeuELkR33Uw12_7QvuNGXyPCb9Bty6r4jdK";
const VSCODE_PASSWORD = "negan123"; // Mật khẩu đăng nhập VSCode

// Hàm gửi tin nhắn qua Telegram
const sendTelegramMessage = async (message) => {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { chat_id: CHAT_ID, text: message });
        console.log("✅ Tin nhắn đã được gửi thành công!");
    } catch (error) {
        console.error("❌ Lỗi khi gửi tin nhắn:", error);
    }
};

// Hàm kiểm tra code-server
const waitForCodeServer = async () => {
    await sendTelegramMessage("🔄 Đang kiểm tra code-server...");
    return new Promise((resolve, reject) => {
        const checkServer = setInterval(() => exec("curl -s http://localhost:8080", (error) => !error && (clearInterval(checkServer), resolve())), 1000);
        setTimeout(() => (clearInterval(checkServer), reject(new Error("❌ Không thể kết nối đến code-server sau 30 giây."))), 30000);
    });
};

// Hàm lấy URL của Ngrok Tunnel từ API
const getNgrokTunnelUrl = async () => {
    try {
        const { data: { tunnels } } = await axios.get("http://127.0.0.1:4040/api/tunnels");
        return tunnels[0]?.public_url || Promise.reject(new Error("❌ Không tìm thấy tunnel nào."));
    } catch (error) {
        console.error("❌ Lỗi khi lấy URL từ Ngrok API:", error);
        throw error;
    }
};

// Hàm khởi chạy Ngrok Tunnel
const startNgrokTunnel = async (port) => {
    await sendTelegramMessage("🔄 Đang thêm authtoken cho Ngrok...");
    exec(`ngrok config add-authtoken ${NGROK_AUTH_TOKEN}`, async (error) => {
        if (error) return await sendTelegramMessage("❌ Lỗi khi thêm authtoken cho Ngrok.");
        await sendTelegramMessage("✅ Authtoken đã được thêm thành công!");
        const ngrokProcess = spawn("ngrok", ["http", port]);
        setTimeout(async () => {
            try {
                const tunnelUrl = await getNgrokTunnelUrl();
                const fullUrl = `${tunnelUrl}/?folder=/root`;
                await sendTelegramMessage(`🌐 Ngrok Tunnel đang chạy:\n${fullUrl}\n🔑 Mật khẩu đăng nhập VSCode: ${VSCODE_PASSWORD}`);
            } catch (error) {
                await sendTelegramMessage("❌ Không thể lấy URL của Ngrok Tunnel.");
            }
        }, 5000);
        ngrokProcess.stderr.on("data", (data) => console.error(`[ngrok] ${data.toString()}`));
        ngrokProcess.on("close", (code) => sendTelegramMessage(`🔴 Ngrok đã đóng với mã ${code}`));
    });
};

// Hàm khởi chạy code-server
const startCodeServer = async () => {
    await sendTelegramMessage("🔄 Đang khởi chạy code-server...");
    const codeServerProcess = exec(`code-server --bind-addr 0.0.0.0:8080 --auth password --password ${VSCODE_PASSWORD} --trust`);
    codeServerProcess.stderr.on("data", (data) => console.error(`[code-server] ${data.toString()}`));
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
