const http=require("http");const{makeWASocket,useMultiFileAuthState}=require("baileys");const pino=require("pino");const fs=require("fs");const path=require("path");const PORT=3000;const logger=pino({level:"silent"});const HTML=`<!DOCTYPE html>
<html lang="ht">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Victory Hub — Pairing Code</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:linear-gradient(160deg,#0a0a14 0%,#141028 40%,#0d1117 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#e8e8f0;padding:15px}
.wrapper{max-width:440px;width:100%}
.logo-section{text-align:center;margin-bottom:24px}
.logo-box{width:80px;height:80px;margin:0 auto 12px;background:linear-gradient(135deg,#f0a500,#e86a10,#d4380d);border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:2.4em;box-shadow:0 8px 32px rgba(240,165,0,.25);animation:pulse 2.5s ease-in-out infinite}
@keyframes pulse{0%,100%{box-shadow:0 8px 32px rgba(240,165,0,.25)}50%{box-shadow:0 8px 48px rgba(240,165,0,.45)}}
.logo-section h1{font-size:1.6em;font-weight:800;background:linear-gradient(135deg,#f0a500,#e86a10,#f0a500);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.logo-section .tagline{font-size:.78em;color:#6b7280;margin-top:2px}
.card{background:rgba(20,20,40,.85);backdrop-filter:blur(24px);border-radius:20px;padding:28px 24px;border:1px solid rgba(240,165,0,.15);box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 1px rgba(240,165,0,.05)}
.alert{padding:12px 16px;border-radius:12px;margin-bottom:18px;font-size:.88em;font-weight:600;text-align:center}
.alert.waiting{background:rgba(240,165,0,.08);color:#f0a500;border:1px solid rgba(240,165,0,.2)}
.alert.success{background:rgba(34,197,94,.08);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
.alert.error{background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
.code-display{display:none;text-align:center;margin-bottom:18px}
.code-display .label{font-size:.75em;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px}
.code-display .digits{font-size:2.6em;font-weight:900;letter-spacing:4px;color:#f0a500;font-family:monospace;background:rgba(240,165,0,.06);padding:16px;border-radius:14px;border:2px dashed rgba(240,165,0,.3);margin-bottom:12px;word-break:break-all}
.code-display .action-text{font-size:.85em;color:#f0a500;font-weight:600;animation:blink 1.2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.5}}
select,input{width:100%;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#e8e8f0;font-size:.95em;transition:.2s}
select:focus,input:focus{outline:none;border-color:#f0a500;box-shadow:0 0 0 3px rgba(240,165,0,.1)}
select option{background:#141028;color:#e8e8f0}input::placeholder{color:#4b5563}
.btn{width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#f0a500,#e86a10);color:#fff;font-size:1em;font-weight:700;cursor:pointer;transition:.3s;letter-spacing:.5px}
.btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(240,165,0,.3)}
.btn:disabled{opacity:.5;cursor:not-allowed}.form-group{margin-bottom:12px}
.steps{margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.06)}
.steps .steps-title{font-size:.78em;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
ol{list-style:none;counter-reset:step}ol li{counter-increment:step;position:relative;padding:8px 0 8px 36px;color:#9ca3af;font-size:.85em;line-height:1.5}
ol li::before{content:counter(step);position:absolute;left:0;top:10px;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#f0a500,#e86a10);color:#fff;font-size:.72em;font-weight:700;display:flex;align-items:center;justify-content:center}
ol li b{color:#e8e8f0}
.footer{text-align:center;margin-top:20px;color:#4b5563;font-size:.73em}
.footer a{color:#f0a500;text-decoration:none}
.back-btn{display:block;margin-top:14px;text-align:center;color:#6b7280;font-size:.82em;cursor:pointer;padding:8px}
.back-btn:hover{color:#f0a500}
</style>
</head>
<body>
<div class="wrapper">
<div class="logo-section">
  <div class="logo-box">⚡</div>
  <h1>Victory Hub</h1>
  <p class="tagline">WhatsApp Bot • Konekte kounye a</p>
</div>
<div class="card">
  <div id="alert" class="alert waiting">⏳ Antre nimewo WhatsApp ou pou jwenn kòd pairing</div>
  <div id="codeBox" class="code-display">
    <div class="label">Kòd Pairing Ou</div>
    <div id="codeDigits" class="digits"></div>
    <div class="action-text">⚠️ Ale nan WhatsApp Kounye a!</div>
  </div>
  <div id="formArea">
    <div class="form-group"><select id="cc"><option value="509">🇭🇹 +509 (Haiti)</option><option value="1">🇺🇸 +1 (USA)</option><option value="33">🇫🇷 +33 (France)</option></select></div>
    <div class="form-group"><input id="ph" type="tel" placeholder="Nimewo WhatsApp (egzanp: 31234567)" required></div>
    <button id="btn" class="btn" onclick="generate()">🔑 Jwenn Kòd Pairing</button>
    <div id="backBtn" class="back-btn" style="display:none" onclick="reset()">← Tounen pou nouvo kòd</div>
  </div>
  <div class="steps">
    <div class="steps-title">📋 Etap pou konekte</div>
    <ol>
      <li><b>Lougri WhatsApp</b> sou telefòn ou</li>
      <li>Ale nan <b>Settings (⚙️) → Linked Devices</b></li>
      <li>Klike sou <b>"Link with phone number"</b></li>
      <li><b>Antre kòd pairing ki anwo a</b></li>
      <li><b>✅ Konekte!</b> Bot la ap aktif nan tout gwoup ou yo</li>
    </ol>
  </div>
</div>
<p class="footer">Victory Hub v1.0 • <a href="https://github.com/kingdevweb78/raganork-md">GitHub</a></p>
</div>
<script>
let pi=null;
async function generate(){
  const cc=document.getElementById('cc').value;
  const ph=document.getElementById('ph').value.replace(/\\D/g,'');
  if(!ph){showAlert('❌ Antre nimewo WhatsApp ou!','error');return}
  const btn=document.getElementById('btn');
  btn.disabled=true;btn.textContent='⏳ Ap jenere kòd...';
  showAlert('⏳ Ap jenere kòd pairing...','waiting');
  try{
    const r=await fetch('/pair?phone='+cc+ph);
    const d=await r.json();
    if(d.success){
      document.getElementById('codeBox').style.display='block';
      document.getElementById('codeDigits').textContent=d.code.match(/.{3,4}/g).join('-');
      showAlert('✅ Kòd pare! <b>Ale nan WhatsApp kounye a!</b>','success');
      btn.style.display='none';
      document.getElementById('backBtn').style.display='block';
      startPolling();
    }else{
      showAlert('❌ '+d.error,'error');
      btn.disabled=false;btn.textContent='🔑 Jwenn Kòd Pairing';
    }
  }catch(err){
    showAlert('❌ Erè: '+err.message,'error');
    btn.disabled=false;btn.textContent='🔑 Jwenn Kòd Pairing';
  }
}
function startPolling(){
  let a=0;
  pi=setInterval(async()=>{
    a++;
    try{
      const r=await fetch('/status');
      const d=await r.json();
      if(d.connected){
        clearInterval(pi);
        showAlert('🎉 Bot la KONEKTE!<br><small style="font-size:.75em">SESSION: RGNK~'+d.sessionId+'</small><br><small>Kopye sa epi ajoute nan Railway Variables</small>','success');
        document.getElementById('codeBox').style.display='none';
      }else if(a>=240){clearInterval(pi);showAlert('⏰ Tan ekspire. Klike "Tounen" pou yon nouvo kòd','error')}
    }catch(e){}
  },2000);
}
function showAlert(msg,type){document.getElementById('alert').innerHTML=msg;document.getElementById('alert').className='alert '+type}
function reset(){if(pi)clearInterval(pi);document.getElementById('codeBox').style.display='none';document.getElementById('btn').style.display='block';document.getElementById('btn').disabled=false;document.getElementById('btn').textContent='🔑 Jwenn Kòd Pairing';document.getElementById('backBtn').style.display='none';showAlert('⏳ Antre nimewo WhatsApp ou pou jwenn kòd pairing','waiting')}
</script>
</body>
</html>`;let sock=null;let currentCode=null;let connected=false;let sessionId=null;async function generatePairingCode(phoneNumber){try{const dir=path.join(__dirname,"auth_pair");if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});const{state,saveCreds}=await useMultiFileAuthState(dir);sock=makeWASocket({auth:state,printQRInTerminal:false,browser:["Victory Hub","Desktop","1.0.0"],logger});sock.ev.on("connection.update",async update=>{const{connection}=update;if(connection==="open"){connected=true;if(sock.authState&&sock.authState.creds&&sock.authState.creds.me)sessionId=sock.authState.creds.me.id.split(":")[0];await saveCreds()}});sock.ev.on("creds.update",saveCreds);await new Promise(r=>setTimeout(r,2000));if(!sock.authState.creds.registered){currentCode=await sock.requestPairingCode(phoneNumber);return{success:true,code:currentCode}}return{success:false,error:"Device already registered"}}catch(err){return{success:false,error:err.message}}}function startPairingServer(){const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,"http://localhost:"+PORT);res.setHeader("Access-Control-Allow-Origin","*");if(u.pathname==="/"||u.pathname===""){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(HTML)}else if(u.pathname==="/pair"&&req.method==="GET"){const phone=u.searchParams.get("phone");if(!phone){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({success:false,error:"Phone required"}));return}const result=await generatePairingCode(phone);res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify(result))}else if(u.pathname==="/status"){res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({connected,sessionId,code:currentCode}))}else if(u.pathname==="/health"){res.writeHead(200,{"Content-Type":"text/plain"});res.end("OK")}else{res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(HTML)}}catch(err){res.writeHead(500,{"Content-Type":"text/html"});res.end(HTML)}});server.listen(PORT,()=>console.log("⚡ Pairing Server on port "+PORT));return server}module.exports={startPairingServer};