const http=require("http");
const{makeWASocket,useMultiFileAuthState,Browsers,fetchLatestBaileysVersion,makeCacheableSignalKeyStore}=require("baileys");
const pino=require("pino");const fs=require("fs");const path=require("path");
const PORT=3000;const logger=pino({level:"silent"});

const HTML=`<!DOCTYPE html>
<html lang="ht"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Victory Hub — Pairing Code</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:linear-gradient(160deg,#0a0a14,#141028,#0d1117);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#e8e8f0;padding:15px}
.wrapper{max-width:440px;width:100%}
.logo-section{text-align:center;margin-bottom:20px}
.logo-box{width:72px;height:72px;margin:0 auto 10px;background:linear-gradient(135deg,#f0a500,#e86a10,#d4380d);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:2em;box-shadow:0 8px 32px rgba(240,165,0,.25);animation:pulse 2.5s ease-in-out infinite}
@keyframes pulse{0%,100%{box-shadow:0 8px 32px rgba(240,165,0,.25)}50%{box-shadow:0 8px 48px rgba(240,165,0,.45)}}
.logo-section h1{font-size:1.5em;font-weight:800;background:linear-gradient(135deg,#f0a500,#e86a10,#f0a500);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.tagline{font-size:.75em;color:#6b7280;margin-top:2px}
.card{background:rgba(20,20,40,.85);backdrop-filter:blur(24px);border-radius:18px;padding:24px 20px;border:1px solid rgba(240,165,0,.12);box-shadow:0 20px 60px rgba(0,0,0,.6)}
.alert{padding:12px 14px;border-radius:10px;margin-bottom:14px;font-size:.85em;font-weight:600;text-align:center}
.alert.waiting{background:rgba(240,165,0,.08);color:#f0a500;border:1px solid rgba(240,165,0,.2)}
.alert.success{background:rgba(34,197,94,.08);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
.alert.error{background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
.alert.info{background:rgba(59,130,246,.08);color:#3b82f6;border:1px solid rgba(59,130,246,.2)}
.code-display{display:none;text-align:center;margin-bottom:14px}
.code-display .label{font-size:.72em;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px}
.code-display .digits{font-size:2.2em;font-weight:900;letter-spacing:3px;color:#f0a500;font-family:monospace;background:rgba(240,165,0,.06);padding:14px;border-radius:12px;border:2px dashed rgba(240,165,0,.3);margin-bottom:10px;word-break:break-all}
.action-text{font-size:.82em;color:#f0a500;font-weight:600;animation:blink 1.2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.5}}
select,input{width:100%;padding:13px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#e8e8f0;font-size:.9em;transition:.2s}
select:focus,input:focus{outline:none;border-color:#f0a500;box-shadow:0 0 0 3px rgba(240,165,0,.1)}
select option{background:#141028;color:#e8e8f0}input::placeholder{color:#4b5563}
.btn{width:100%;padding:14px;border-radius:10px;border:none;background:linear-gradient(135deg,#f0a500,#e86a10);color:#fff;font-size:.95em;font-weight:700;cursor:pointer;transition:.3s}
.btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(240,165,0,.3)}
.btn:disabled{opacity:.5;cursor:not-allowed}.form-group{margin-bottom:10px}
.steps{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06)}
.steps-title{font-size:.75em;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px}
ol{list-style:none;counter-reset:step}ol li{counter-increment:step;position:relative;padding:7px 0 7px 32px;color:#9ca3af;font-size:.82em;line-height:1.4}
ol li::before{content:counter(step);position:absolute;left:0;top:8px;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#f0a500,#e86a10);color:#fff;font-size:.68em;font-weight:700;display:flex;align-items:center;justify-content:center}
ol li b{color:#e8e8f0}
.footer{text-align:center;margin-top:16px;color:#4b5563;font-size:.7em}
.footer a{color:#f0a500;text-decoration:none}
.back-btn{display:block;margin-top:12px;text-align:center;color:#6b7280;font-size:.8em;cursor:pointer;padding:8px}
.back-btn:hover{color:#f0a500}
.tip{background:rgba(240,165,0,.06);border:1px solid rgba(240,165,0,.12);border-radius:10px;padding:12px;margin-top:14px;font-size:.78em;color:#f0a500;text-align:center;line-height:1.4}
</style></head><body>
<div class="wrapper">
<div class="logo-section"><div class="logo-box">⚡</div><h1>Victory Hub</h1><p class="tagline">WhatsApp Bot • Pairing Code</p></div>
<div class="card">
<div id="alert" class="alert waiting">⏳ Antre nimewo w pou jwenn kòd pairing</div>
<div id="codeBox" class="code-display"><div class="label">Kòd Pairing Ou</div><div id="codeDigits" class="digits"></div><div class="action-text">👆 TAPE notifikasyon WhatsApp la!</div></div>
<div id="formArea">
<div class="form-group"><select id="cc"><option value="509">🇭🇹 +509 Haiti</option><option value="1">🇺🇸 +1 USA</option><option value="33">🇫🇷 +33 France</option></select></div>
<div class="form-group"><input id="ph" type="tel" placeholder="Nimewo (eg: 31234567)" required></div>
<button id="btn" class="btn" onclick="gen()">🔑 Jwenn Kòd Pairing</button>
<div id="backBtn" class="back-btn" style="display:none" onclick="reset()">← Nouvo kòd</div>
</div>
<div class="steps"><div class="steps-title">📋 Etap</div>
<ol><li>Klike <b>"Jwenn Kòd"</b></li><li>Tann 5-10 segonn</li><li><b>Tape notifikasyon WhatsApp</b> sou telefòn</li><li>Antre kòd la</li><li>✅ <b>Konekte!</b></li></ol></div>
<div class="tip">💡 <b>WhatsApp ap voye notifikasyon</b> sou telefòn ou:<br>"Enter code to link new device"</div>
</div>
<p class="footer">Victory Hub v1.0 • <a href="https://github.com/kingdevweb78/raganork-md">GitHub</a></p>
</div>
<script>
let pi=null;
async function gen(){
const cc=document.getElementById('cc').value;
const ph=document.getElementById('ph').value.replace(/\\D/g,'');
if(!ph){sa('❌ Antre nimewo w!','error');return}
const btn=document.getElementById('btn');
btn.disabled=true;btn.textContent='⏳ Ap konekte (5-10s)...';
sa('⏳ Ap konekte ak WhatsApp... Tann...','info');
try{
const r=await fetch('/pair?phone='+cc+ph);
const d=await r.json();
if(d.success){
document.getElementById('codeBox').style.display='block';
document.getElementById('codeDigits').textContent=(d.code||'').match(/.{3,4}/g)?.join('-')||d.code;
sa('✅ Kòd pare! <b>Tape notifikasyon WhatsApp!</b>','success');
btn.style.display='none';document.getElementById('backBtn').style.display='block';
startPoll();
}else{
sa('❌ '+d.error,'error');
btn.disabled=false;btn.textContent='🔑 Jwenn Kòd';
}
}catch(err){sa('❌ '+err.message,'error');btn.disabled=false;btn.textContent='🔑 Jwenn Kòd';}
}
function startPoll(){
let a=0;pi=setInterval(async()=>{a++;
try{const r=await fetch('/status');const d=await r.json();
if(d.connected){clearInterval(pi);sa('🎉 KONEKTE!<br><small>SESSION: RGNK~'+d.sessionId+'</small>','success');
document.getElementById('codeBox').style.display='none';}
else if(a>=360){clearInterval(pi);sa('⏰ Tan ekspire','error');}
}catch(e){}},2000);
}
function sa(m,t){document.getElementById('alert').innerHTML=m;document.getElementById('alert').className='alert '+t}
function reset(){if(pi)clearInterval(pi);document.getElementById('codeBox').style.display='none';document.getElementById('btn').style.display='block';document.getElementById('btn').disabled=false;document.getElementById('btn').textContent='🔑 Jwenn Kòd Pairing';document.getElementById('backBtn').style.display='none';sa('⏳ Antre nimewo w pou jwenn kòd','waiting')}
</script></body></html>`;

let sock=null;let currentCode=null;let connected=false;let sessionId=null;

async function generatePairingCode(phone){
  if(sock){try{sock.end()}catch(e){}sock=null}
  currentCode=null;connected=false;sessionId=null;
  
  try{
    const dir=path.join(__dirname,"auth_pair");
    if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
    const{state,saveCreds}=await useMultiFileAuthState(dir);
    const{version}=await fetchLatestBaileysVersion();
    
    console.log("Baileys version:",version);
    
    sock=makeWASocket({
      version,
      auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,logger)},
      printQRInTerminal:false,
      browser:Browsers.ubuntu("Chrome"),
      logger,
      markOnlineOnConnect:false,
      syncFullHistory:false,
    });

    sock.ev.on("connection.update",async(update)=>{
      const{connection,lastDisconnect}=update;
      console.log("[Baileys]",connection);
      if(connection==="open"){
        connected=true;
        if(sock?.authState?.creds?.me)sessionId=sock.authState.creds.me.id.split(":")[0];
        await saveCreds();
      }
    });
    sock.ev.on("creds.update",saveCreds);

    // Wait for socket to be ready for pairing
    await new Promise((resolve,reject)=>{
      let resolved=false;
      const timeout=setTimeout(()=>{if(!resolved){resolved=true;reject(new Error("Timeout (30s). Eseye ankò."))}},30000);
      
      sock.ev.on("connection.update",function handler(update){
        if(resolved)return;
        const{connection,qr}=update;
        console.log("[Pair] State:",connection,"QR:",!!qr);
        
        if(connection==="connecting"||!!qr||connection==="open"){
          resolved=true;
          clearTimeout(timeout);
          sock.ev.off("connection.update",handler);
          resolve();
        }
        if(connection==="close"){
          const sc=lastDisconnect?.error?.output?.statusCode;
          console.log("[Pair] Closed. Code:",sc);
          // Don't reject yet, let it retry
        }
      });
    });
    
    console.log("[Pair] Socket ready, requesting code for:",phone);
    currentCode=await sock.requestPairingCode(phone);
    console.log("[Pair] Code:",currentCode);
    return{success:true,code:currentCode};
  }catch(err){
    console.error("[Pair] Error:",err.message);
    if(sock){try{sock.end()}catch(e){}}
    return{success:false,error:err.message};
  }
}

function startPairingServer(){
  const server=http.createServer(async(req,res)=>{
    try{
      const u=new URL(req.url,"http://localhost:"+PORT);
      res.setHeader("Access-Control-Allow-Origin","*");
      if(u.pathname==="/"||u.pathname===""){
        res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(HTML);
      }else if(u.pathname==="/pair"&&req.method==="GET"){
        const phone=u.searchParams.get("phone");
        if(!phone){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({success:false,error:"Nimewo obligatwa"}));return}
        console.log("=== Pair request for:",phone,"===");
        const result=await generatePairingCode(phone);
        res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify(result));
      }else if(u.pathname==="/status"){
        res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({connected,sessionId,code:currentCode}));
      }else if(u.pathname==="/health"){
        res.writeHead(200,{"Content-Type":"text/plain"});res.end("OK");
      }else{
        res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(HTML);
      }
    }catch(err){
      console.error(err);
      res.writeHead(500,{"Content-Type":"text/html"});res.end(HTML);
    }
  });
  server.listen(PORT,()=>console.log("⚡ Pairing on port "+PORT));
  return server;
}

module.exports={startPairingServer};