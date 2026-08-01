const path = require("path");
const fs = require("fs");
if (fs.existsSync("./config.env")) require("dotenv").config({ path: "./config.env" });
const { suppressLibsignalLogs } = require("./core/helpers"); suppressLibsignalLogs();
const { initializeDatabase } = require("./core/database");
const { BotManager } = require("./core/manager");
const config = require("./config"); const { SESSION, logger } = config;
const http = require("http");
const { ensureTempDir, TEMP_DIR, initializeKickBot, cleanupKickBot } = require("./core/helpers");
let botManager = null;

async function main() {
  ensureTempDir();
  logger.info(`temp dir: ${TEMP_DIR}`);
  console.log(`Victory Hub v${require("./package.json").version}`);
  console.log(`- Sessions: ${SESSION.join(", ") || "(none)"}`);
  console.log(`- MODE: ${config.MODE} | ADMIN_ACCESS: ${config.ADMIN_ACCESS}`);

  if (SESSION.length === 0) {
    console.warn("⚠️ No sessions. Starting Pairing Server...");
    try { const { startPairingServer } = require("./pair"); startPairingServer(); }
    catch (err) {
      console.error("Pairing error:", err.message);
      const PORT = process.env.PORT || 3000;
      require("http").createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<h1>⚡ Victory Hub</h1><p>Pairing server loading...</p>"); }).listen(PORT, () => console.log("Fallback on port " + PORT));
    }
    return;
  }

  try { await initializeDatabase(); console.log("- DB initialized"); } catch (dbError) { console.error("DB Error:", dbError.message); process.exit(1); }

  botManager = new BotManager();
  process.on("SIGINT", async () => { cleanupKickBot(); if(botManager) await botManager.shutdown(); process.exit(0); });
  process.on("SIGTERM", async () => { cleanupKickBot(); if(botManager) await botManager.shutdown(); process.exit(0); });

  await botManager.initializeBots();
  console.log("- Bots initialized"); logger.info("Bot initialization complete");
  initializeKickBot();

  try {
    const { startDashboardServer } = require("./dashboard");
    startDashboardServer(botManager);
    console.log("📊 Dashboard server started!");
  } catch (err) {
    console.error("Dashboard error:", err.message);
    const PORT = process.env.PORT || 3000;
    http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<h1>⚡ Victory Hub</h1><p>Online - MODE: public</p>"); }).listen(PORT, () => logger.info(`Fallback on ${PORT}`));
  }
}

if (require.main === module) { main().catch((error) => { console.error(`Fatal: ${error.message}`); process.exit(1); }); }