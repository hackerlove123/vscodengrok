const { exec, spawn } = require("child_process"), axios = require("axios"), BOT_TOKEN = "7828296793:AAEw4A7NI8tVrdrcR0TQZXyOpNSPbJmbGUU", CHAT_ID = "7371969470", NGROK_AUTH_TOKEN = "2tEd9VIVsq4yjGzeuELkR33Uw12_7QvuNGXyPCb9Bty6r4jdK";

const sendTelegramMessage = async m => { try { await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { chat_id: CHAT_ID, text: m }); console.log("✅ Tin nhắn đã gửi!"); } catch(e) { console.error("❌ Lỗi gửi Telegram:", e); } };

const waitForCodeServer = async () => {
  await sendTelegramMessage("🔄 Đang kiểm tra code-server...");
  return new Promise((rs, rj) => {
    const check = setInterval(() => exec("curl -s http://localhost:8080", e => !e && (clearInterval(check), rs())), 1000);
    setTimeout(() => (clearInterval(check), rj(new Error("❌ Không kết nối được code-server sau 30s"))), 30000);
  });
};

const getNgrokUrl = async () => ((await axios.get("http://127.0.0.1:4040/api/tunnels")).data.tunnels[0]?.public_url) || (() => { throw new Error("❌ Không tìm thấy tunnel"); })();

const startNgrok = async port => {
  await sendTelegramMessage("🔄 Thêm authtoken Ngrok...");
  exec(`ngrok config add-authtoken ${NGROK_AUTH_TOKEN}`, async e => {
    if(e) return await sendTelegramMessage("❌ Lỗi thêm authtoken");
    await sendTelegramMessage("✅ Authtoken thành công!");
    const ngrok = spawn("ngrok", ["http", port]);
    setTimeout(async () => { try { const url = await getNgrokUrl(); await sendTelegramMessage(`🌐 Public URL: ${url}/?folder=/NeganServer\n👉 [Truy cập ngay](${url}/?folder=/NeganServer)`); } catch(e) { await sendTelegramMessage("❌ Lỗi lấy URL Ngrok"); } }, 5000);
    ngrok.stderr.on("data", d => console.error(`[ngrok] ${d}`));
    ngrok.on("close", c => sendTelegramMessage(`🔴 Ngrok đóng với mã ${c}`));
  });
};

const startCodeServer = async () => {
  await sendTelegramMessage("🔄 Khởi động code-server...");
  const cs = spawn("code-server", ["--bind-addr", "0.0.0.0:8080", "--auth", "none"]);
  cs.stderr.on("data", d => console.error(`[code-server] ${d}`));
  cs.stdout.on("data", d => console.log(`[code-server] ${d}`));
  await waitForCodeServer();
  await sendTelegramMessage("✅ Code-server sẵn sàng!");
};

(async () => {
  try { await startCodeServer(); await startNgrok(8080); }
  catch(e) { await sendTelegramMessage(`❌ Lỗi: ${e.message}`); }
})();
