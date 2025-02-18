const { exec, spawn } = require("child_process");
const axios = require("axios");

const BOT_TOKEN = "7828296793:AAEw4A7NI8tVrdrcR0TQZXyOpNSPbJmbGUU";
const CHAT_ID = "7371969470";
const NGROK_API_TOKEN = "2tEXCJqTfWD0ISxY23q4joQ08v8_5q4KXTJdoUXoUjBeJp8qD";

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

const waitForCodeServer = () => new Promise((resolve, reject) => {
    const checkServer = setInterval(() => {
        exec("curl -s http://localhost:8080", (error) => {
            if (!error) {
                clearInterval(checkServer);
                resolve();
            }
        });
    }, 1000);

    setTimeout(() => {
        clearInterval(checkServer);
        reject(new Error("Không thể kết nối đến code-server sau 30 giây."));
    }, 30000);
});

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

const startNgrokTunnel = async (port) => {
    console.log("Đang khởi chạy Ngrok...");
    const ngrokProcess = spawn("ngrok", ["start", "--all", "--config", "/app/ngrok.yml"]);

    ngrokProcess.stderr.on("data", (data) => {
        const errorOutput = data.toString();
        console.error(`[ngrok] ${errorOutput}`);
        if (errorOutput.includes("ERR_NGROK_108")) {
            sendTelegramMessage("❌ Lỗi: Tài khoản Ngrok của bạn đang bị giới hạn chỉ cho phép 1 session. Vui lòng dừng các session khác hoặc nâng cấp tài khoản.");
        } else {
            sendTelegramMessage(`❌ Lỗi từ Ngrok: ${errorOutput}`);
        }
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const tunnelUrl = await getNgrokUrl();
    if (tunnelUrl) {
        console.log(`🌐 URL: ${tunnelUrl}`);
        sendTelegramMessage(`🌐 Ngrok Tunnel đang chạy:\n${tunnelUrl}`);
    } else {
        console.error("Không thể lấy URL từ Ngrok.");
        sendTelegramMessage("❌ Không thể lấy URL từ Ngrok.");
    }

    ngrokProcess.on("close", (code) => {
        console.log(`Ngrok đã đóng với mã ${code}`);
        sendTelegramMessage(`🔴 Ngrok đã đóng với mã ${code}`);
    });
};

const startCodeServerAndNgrok = async () => {
    try {
        console.log("Đang khởi chạy code-server...");
        await sendTelegramMessage("🔄 Đang khởi chạy code-server...");

        const codeServerProcess = exec("code-server --bind-addr 0.0.0.0:8080 --auth none");

        codeServerProcess.stderr.on("data", () => {});

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

startCodeServerAndNgrok();
