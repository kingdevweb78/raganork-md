// ========================================
// Victory Hub — Bot WhatsApp
// Sipòte: Pairing Code + QR Code + Auto-Reconnect
// Bibliyotèk: @whiskeysockets/baileys
// ========================================

const {
  makeWASocket,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");
const fs = require("fs");
const http = require("http");
const config = require("./config");

const logger = pino({ level: "info" });

// Paj pairing HTML
const pairingHTML = `<!DOCTYPE html>
<html lang="ht">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Victory Hub — Pairing</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#0a0a14;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#e8e8f0;padding:15px}
.w{max-width:420px;width:100%;text-align:center}
.ic{font-size:3em;margin-bottom:8px}
h1{font-size:1.5em;font-weight:800;background:linear-gradient(135deg,#f0a500,#e86a10);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.al{padding:16px;border-radius:12px;margin:16px 0;font-weight:600;background:rgba(34,197,94,.08);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
.cd{font-size:2.5em;font-weight:900;letter-spacing:4px;color:#f0a500;font-family:monospace;background:rgba(240,165,0,.06);padding:16px;border-radius:12px;border:2px dashed rgba(240,165,0,.3);margin:12px 0}
.if{color:#6b7280;font-size:.85em;margin-top:12px}
</style>
</head>
<body>
<div class="w">
<div class="ic">⚡</div>
<h1>Victory Hub</h1>
<div class="al" id="st">⏳ Ap tann pairing code...</div>
<div class="cd" id="cd">---</div>
<div class="if">📱 Louvri WhatsApp → Settings → Linked Devices → Link with phone number<br>Antre kòd ki anwo a</div>
</div>
<script>
setInterval(async()=>{try{const r=await fetch('/state');const d=await r.json();if(d.code)document.getElementById('cd').textContent=d.code.match(/.{3,4}/g).join('-');document.getElementById('st').innerHTML=d.status}catch(e){}},2000);
</script>
</body>
</html>`;

let pairingCode=null,isConnected=false,sessionId=null,botSocket=null,retryCount=0;
const MAX_RETRIES=10;

function startHTTPServer(){
  http.createServer((req,res)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    const u=new URL(req.url,"http://localhost:"+config.PORT);
    if(u.pathname==="/health"){res.writeHead(200,{"Content-Type":"text/plain"});res.end("OK")}
    else if(u.pathname==="/state"){
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({connected:isConnected,code:pairingCode,sessionId,status:isConnected?"✅ <b>KONEKTE!</b> Bot la ap mache!":pairingCode?"✅ <b>Kòd pare!</b> Antre l nan WhatsApp ⬆️":"⏳ <b>Ap jenere kòd...</b> Tann..."}))
    }else{res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(pairingHTML)}
  }).listen(config.PORT,()=>logger.info("🌐 HTTP sou pòt "+config.PORT));
}

async function connectToWhatsApp(){
  if(botSocket){try{botSocket.end()}catch(e){}botSocket=null}
  const ad=path.join(__dirname,"auth_info");
  if(!fs.existsSync(ad))fs.mkdirSync(ad,{recursive:true});
  const{state,saveCreds}=await useMultiFileAuthState(ad);
  const ph=config.PAIRING_PHONE||"";
  logger.info("🔌 Ap konekte ak WhatsApp...");
  botSocket=makeWASocket({
    auth:state,printQRInTerminal:false,
    browser:Browsers.ubuntu("Chrome"),logger,
    connectTimeoutMs:60000,defaultQueryTimeoutMs:60000,
    markOnlineOnConnect:true,syncFullHistory:false
  });
  botSocket.ev.on("creds.update",saveCreds);
  botSocket.ev.on("connection.update",async(u)=>{
    const{connection,lastDisconnect,qr}=u;
    logger.info("📡 "+(connection||"inisyalize..."));
    if(connection==="open"){
      isConnected=true;retryCount=0;
      if(botSocket?.authState?.creds?.me)sessionId=botSocket.authState.creds.me.id.split(":")[0];
      await saveCreds();
      logger.info("✅ KONEKTE! ID: RGNK~"+sessionId);
      logger.info("📋 Kopye ID sa pou Railway SESSION_ID");
    }
    if(connection==="close"){
      const sc=lastDisconnect?.error?.output?.statusCode;
      // Si PAIRING_PHONE etabli, kontinye eseye menm si loggedOut
      if(sc===DisconnectReason.loggedOut&&!ph){logger.warn("🚫 Dekonekte. Sispann.");return}
      if(retryCount<MAX_RETRIES){retryCount++;const d=Math.min(1000*Math.pow(2,retryCount),60000);logger.warn("🔄 Rekonekte nan "+(d/1000)+"s... ("+retryCount+"/"+MAX_RETRIES+")");setTimeout(()=>connectToWhatsApp(),d)}
      else logger.error("❌ Twòp tantativ.")
    }
    if(!isConnected&&ph&&(connection==="connecting"||!!qr)&&!pairingCode){
      try{
        logger.info("📱 Jenere pairing code pou +"+ph);
        pairingCode=await botSocket.requestPairingCode(ph);
        logger.info("⚡ KÒD: "+pairingCode.match(/.{3,4}/g)?.join("-"));
        logger.info("📱 ANTRE KÒD SA NAN WHATSAPP → Linked Devices → Link with phone number");
      }catch(e){logger.error("❌ "+e.message);pairingCode=null}
    }
    if(!ph&&!!qr&&!isConnected){
      logger.info("📱 Eskane QR nan WhatsApp → Linked Devices → Scan QR");
      try{require("qrcode-terminal").generate(qr,{small:true})}catch(e){}
      pairingCode="[QR — gade konsol]";
    }
  });
  botSocket.ev.on("messages.upsert",async(msg)=>{
    try{
      const m=msg.messages[0];if(!m?.message||m.key?.fromMe)return;
      const t=m.message.conversation||m.message.extendedTextMessage?.text||"";
      const jid=m.key.remoteJid;
      if(t===".ping")await botSocket.sendMessage(jid,{text:"🏓 Pong! Bot la ap mache!"});
      else if(t===".menu"||t===".help")await botSocket.sendMessage(jid,{text:"⚡ *Victory Hub v2.0* ⚡\n\n📋 *.ping* — Verifye si bot ap mache\n*.menu* — Lis kòmand yo\n*.info* — Enfòmasyon bot la"});
      else if(t===".info")await botSocket.sendMessage(jid,{text:"⚡ *Victory Hub v2.0*\n🔗 @whiskeysockets/baileys\n🔄 Auto-reconnect: ON\n💾 Session sove: WI\n\n💡 Fè .ping pou teste!"});
    }catch(e){}
  });
}

async function startBot(){
  logger.info("⚡ VICTORY HUB v2.0");
  logger.info("📱 Nimewo: "+(config.PAIRING_PHONE?"+"+config.PAIRING_PHONE:"QR Code"));
  startHTTPServer();
  await connectToWhatsApp();
}

startBot().catch(e=>{logger.error("Erè fatal: "+e.message);process.exit(1)});