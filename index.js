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
  logger.info(`Configured sessions: ${SESSION.join(", ")}`);
  console.log(`- MODE: ${config.MODE}`);
  console.log(`- ADMIN_ACCESS: ${config.ADMIN_ACCESS}`);
  
  if (SESSION.length === 0) {
    const warnMsg = "⚠️ No sessions configured. Starting Pairing Code Server...";
    console.warn(warnMsg);
    logger.warn(warnMsg);
    
    try {
      const { startPairingServer } = require("./pair");
      startPairingServer();
      console.log("📱 Pairing server started! Open the service URL to generate a pairing code.");
    } catch (err) {
      console.error("Failed to start pairing server:", err.message);
      const PORT = process.env.PORT || 3000;
      require("http").createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Victory Hub</title><style>body{font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px}div{background:rgba(255,255,255,.05);border-radius:20px;padding:40px;max-width:440px;border:1px solid rgba(255,255,255,.1)}h1{background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}p{color:#aaa;margin:10px 0;line-height:1.6}code{color:#667eea}a{color:#667eea}</style></head><body><div><h1>⚡ Victory Hub</h1><p>Pa gen sesyon. Ale sou:</p><p><a href="https://rgnk.site/">rgnk.site</a> → Get Session → Enter code</p><p>Apre sa, ajoute nan Railway:<br><code>SESSION=RGNK~ID_OU_A</code></p></div></body></html>`);
      }).listen(PORT, () => console.log("Fallback on port " + PORT));
    }
    return;
  }

  try {
    await initializeDatabase();
    console.log("- Database initialized");
    logger.info("Database initialized successfully.");
  } catch (dbError) {
    console.error("🚫 Failed to initialize database or load configuration. Bot cannot start.", dbError);
    logger.fatal("🚫 Failed to initialize database or load configuration. Bot cannot start.", dbError);
    process.exit(1);
  }

  const botManager = new BotManager();

  const shutdownHandler = async (signal) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    logger.info(`Received ${signal}, shutting down...`);
    cleanupKickBot();
    await botManager.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdownHandler("SIGINT"));
  process.on("SIGTERM", () => shutdownHandler("SIGTERM"));

  await botManager.initializeBots();
  console.log("- Bot initialization complete.");
  logger.info("Bot initialization complete");

  initializeKickBot();

  const startServer = () => {
    const PORT = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Victory Hub</title><style>body{font-family:system-ui;background:linear-gradient(135deg,#0a0a0a,#1a1a2e);color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px}div{background:rgba(255,255,255,.05);border-radius:20px;padding:40px;max-width:500px;border:1px solid rgba(255,255,255,.1)}h1{font-size:2.2em;margin-bottom:5px;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}span{display:inline-block;background:rgba(76,175,80,.2);color:#4caf50;padding:5px 15px;border-radius:20px;font-size:.9em;margin:10px 0}p{color:#aaa;line-height:1.8;margin:5px 0}b{color:#fff}small{color:#555;display:block;margin-top:20px}</style></head><body><div><h1>⚡ Victory Hub</h1><span>🟢 Online</span><p>Bot la <b>ap mache</b>!</p><p>Sesyon: <b>${SESSION.join(", ")}</b></p><p>MODE: <b>public</b> • Tout moun ka sèvi</p><p>Prefix: <b>${config.HANDLERS}</b></p><small>Victory Hub • Raganork-MD</small></div></body></html>`);
      }
    });
    server.listen(PORT, () => logger.info(`Web server listening on port ${PORT}`));
  };

  if (process.env.USE_SERVER !== "false") startServer();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error in main execution: ${error.message}`, error);
    logger.fatal({ err: error }, `Fatal error in main execution`);
    process.exit(1);
  });
}