const http = require("http");
const { makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState } = require("baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const logger = pino({ level: "silent" });

const HTML = `<!DOCTYPE html>
<html lang="ht">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Victory Hub - Pairing</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:linear-gradient(135deg,#0a0a0a,#1a1a2e,#16213e);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#fff}
.container{background:rgba(255,255,255,.05);backdrop-filter:blur(20px);border-radius:20px;padding:35px;max-width:440px;width:90%;text-align:center;border:1px solid rgba(255,255,255,.1);box-shadow:0 20px 60px rgba(0,0,0,.5)}
h1{font-size:1.8em;margin-bottom:5px;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.sub{color:#888;margin-bottom:20px;font-size:.85em}
.code-box{font-size:2.5em;font-weight:bold;letter-spacing:6px;color:#667eea;padding:12px;background:rgba(102,126,234,.1);border-radius:12px;margin:15px 0;border:2px dashed rgba(102,126,234,.3);font-family:monospace}
.status{padding:10px;border-radius:8px;margin:12px 0;font-weight:500}
.waiting{background:rgba(255,193,7,.1);color:#ffc107;border:1px solid rgba(255,193,7,.2)}
.connected{background:rgba(76,175,80,.1);color:#4caf50;border:1px solid rgba(76,175,80,.2)}
.error{background:rgba(244,67,54,.1);color:#f44336;border:1px solid rgba(244,67,54,.2)}
ol{text-align:left;margin:15px 0;padding-left:20px;color:#aaa;line-height:1.8}
.btn{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:14px;border-radius:10px;font-size:1em;cursor:pointer;width:100%;font-weight:600;transition:.3s}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(102,126,234,.3)}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
input,select{width:100%;padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:#fff;font-size:1em;margin-bottom:10px}
input::placeholder{color:#666}
select option{background:#1a1a2e;color:#fff}
hr{border-color:rgba(255,255,255,.05);margin:15px 0}
.footer{margin-top:15px;color:#555;font-size:.75em}
</style>
</head>
<body>
<div class="container">
<h1>⚡ Victory Hub</h1>
<p class="sub">WhatsApp Pairing Code</p>
<div id="status" class="status waiting">⏳ Antre nimewo w pou jwenn kòd</div>
<div id="code" class="code-box" style="display:none"></div>
<form id="f">
<select id="cc"><option value="509">+509 Haiti</option><option value="1">+1 US/Canada</option><option value="33">+33 France</option><option value="91">+91 India</option></select>
<input id="ph" placeholder="Nimewo WhatsApp (eg: 31234567)" required>
<button class="btn" id="btn">🔑 Jwenn Kòd</button>
</form>
<hr>
<p style="color:#888;font-size:.85em">📋 Etap:</p>
<ol>
<li>Louvri <b>WhatsApp</b></li>
<li><b>Settings → Linked Devices</b></li>
<li><b>Link with phone number</b></li>
<li>Antre kòd ki anwo a</li>
</ol>
<p class="footer">Victory Hub • Raganork-MD</p>
</div>
<script>
document.getElementById('f').addEventListener('submit',async e=>{
e.preventDefault();
const cc=document.getElementById('cc').value;
const ph=document.getElementById('ph').value.replace(/\\D/g,'');
document.getElementById('btn').disabled=true;
document.getElementById('btn').textContent='⏳ Ap jenere...';
document.getElementById('status').textContent='⏳ Ap jenere kòd pairing...';
try{
const r=await fetch('/pair?phone='+cc+ph);
const d=await r.json();
if(d.success){
document.getElementById('code').style.display='block';
document.getElementById('code').textContent=d.code.match(/.{4}/g).join('-');
document.getElementById('status').textContent='✅ Kòd pare! Antre l sou WhatsApp';
document.getElementById('btn').style.display='none';
poll();
}else{
document.getElementById('status').className='status error';
document.getElementById('status').textContent='❌ '+d.error;
document.getElementById('btn').disabled=false;
document.getElementById('btn').textContent='🔑 Jwenn Kòd';
}
}catch(err){
document.getElementById('status').className='status error';
document.getElementById('status').textContent='❌ Erè: '+err.message;
document.getElementById('btn').disabled=false;
document.getElementById('btn').textContent='🔑 Jwenn Kòd';
}
});
async function poll(){
let a=0;
const iv=setInterval(async()=>{
a++;
try{
const r=await fetch('/status');
const d=await r.json();
if(d.connected){
clearInterval(iv);
document.getElementById('status').className='status connected';
document.getElementById('status').innerHTML='🎉 Konekte! SESSION:<br><code style="word-break:break-all;font-size:.65em">RGNK~'+d.sessionId+'</code>';
}else if(a>=120){
clearInterval(iv);
document.getElementById('status').className='status error';
document.getElementById('status').textContent='⏰ Tan ekspire';
}
}catch(e){}
},3000);
}
</script>
</body>
</html>`;

let sock = null;
let code = null;
let connected = false;
let sessionId = null;

async function generatePairingCode(phoneNumber) {
  return new Promise(async (resolve, reject) => {
    try {
      const dir = path.join(__dirname, "auth_pair");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const { state, saveCreds } = await useMultiFileAuthState(dir);

      sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
        printQRInTerminal: false,
        browser: ["Victory Hub", "Safari", "1.0.0"],
        logger,
      });

      code = await sock.requestPairingCode(phoneNumber);
      console.log("Pairing code:", code);

      sock.ev.on("connection.update", async (up) => {
        const { connection, lastDisconnect } = up;
        if (connection === "open") {
          connected = true;
          const creds = sock.authState.creds;
          if (creds && creds.me) sessionId = creds.me.id.split(":")[0];
          await saveCreds();
          resolve({ success: true, code });
        } else if (connection === "close") {
          const sc = lastDisconnect?.error?.output?.statusCode;
          if (sc !== 428 && !connected) {
            // wait for pairing
          }
        }
      });

      sock.ev.on("creds.update", saveCreds);

      setTimeout(() => {
        if (!connected) resolve({ success: true, code });
      }, 1500);
    } catch (err) {
      reject(err);
    }
  });
}

function startPairingServer() {
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://localhost:" + PORT);
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (u.pathname === "/" || !u.pathname || u.pathname === "/pair") {
      if (req.method === "GET" && (u.pathname === "/" || !u.pathname)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(HTML);
      } else if (u.pathname === "/pair" && req.method === "GET") {
        const phone = u.searchParams.get("phone");
        if (!phone) { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ success: false, error: "Phone required" })); return; }
        try {
          const r = await generatePairingCode(phone);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(r));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      }
    } else if (u.pathname === "/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ connected, sessionId, code }));
    } else if (u.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(HTML);
    }
  });

  server.listen(PORT, () => {
    console.log("⚡ Victory Hub Pairing Server on port " + PORT);
  });
  return server;
}

module.exports = { startPairingServer, generatePairingCode };