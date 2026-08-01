const path = require("path");
const fs = require("fs");
if (fs.existsSync("./config.env")) {
  require("dotenv").config({ path: "./config.env" });
}

const { suppressLibsignalLogs } = require("./core/helpers");

suppressLibsignalLogs();

const { initializeDatabase } = require("./core/database");
const { BotManager } = require("./core/manager");
const config = require("./config");
const { SESSION, logger } = config;
const http = require("http");
const {
  ensureTempDir,
  TEMP_DIR,
  initializeKickBot,
  cleanupKickBot,
} = require("./core/helpers");

async function main() {
  ensureTempDir();
  logger.info(`Created temporary directory at ${TEMP_DIR}`);
  console.log(`Raganork v${require("./package.json").version}`);
  console.log(`- Configured sessions: ${SESSION.join(", ") || "(none)"}`);
  console.log(`- MODE: ${config.MODE}`);
  
  if (SESSION.length === 0) {
    const warnMsg = "⚠️ No sessions configured. Starting Pairing Server...";
    console.warn(warnMsg);
    logger.warn(warnMsg);
    
    try {
      const { startPairingServer } = require("./pair");
      startPairingServer();
      console.log("📱 Pairing server started!");
    } catch (err) {
      console.error("Pairing error:", err.message);
      const PORT = process.env.PORT || 3000;
      require("http").createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Victory Hub</h1><p>Pairing server loading...</p>");
      }).listen(PORT, () => console.log("Fallback on port " + PORT));
    }
    return;
  }

  try {
    await initializeDatabase();
    console.log("- Database initialized");
  } catch (dbError) {
    console.error("DB Error:", dbError.message);
    process.exit(1);
  }

  const botManager = new BotManager();

  process.on("SIGINT", async () => { cleanupKickBot(); await botManager.shutdown(); process.exit(0); });
  process.on("SIGTERM", async () => { cleanupKickBot(); await botManager.shutdown(); process.exit(0); });

  await botManager.initializeBots();
  console.log("- Bot initialization complete.");

  initializeKickBot();

  const PORT = process.env.PORT || 3000;
  if (process.env.USE_SERVER !== "false") {
    http.createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>⚡ Victory Hub</h1><p>Bot la ap mache!</p><p>MODE: public</p>");
      }
    }).listen(PORT, () => logger.info(`Server on port ${PORT}`));
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal: ${error.message}`);
    process.exit(1);
  });
}