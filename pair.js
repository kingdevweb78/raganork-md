const http=require("http");
const{makeWASocket,useMultiFileAuthState,Browsers,fetchLatestBaileysVersion}=require("baileys");
const pino=require("pino");const fs=require("fs");const path=require("path");
const PORT=3000;const logger=pino({level:"error"});

const HTML=`<!DOCTYPE html><html lang="ht"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Victory Hub</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#0a0a14;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#e8e8f0;padding:15px}
.w{max-width:420px;width:100%}
.logo{text-align:center;margin-bottom:18px}
.lb{width:64px;height:64px;margin:0 auto 8px;background:linear-gradient(135deg,#f0a500,#e86a10);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:1.8em;box-shadow:0 6px 24px rgba(240,165,0,.25);animation:p 2.5s infinite}
@keyframes p{0%,100%{box-shadow:0 6px 24px rgba(240,165,0,.25)}50%{box-shadow:0 6px 40px rgba(240,165,0,.5)}}
.logo h1{font-size:1.3em;font-weight:800;background:linear-gradient(135deg,#f0a500,#e86a10,#f0a500);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.logo span{font-size:.7em;color:#6b7280}
.c{background:rgba(20,20,40,.85);border-radius:16px;padding:22px 18px;border:1px solid rgba(240,165,0,.1)}
.al{padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:.82em;font-weight:600;text-align:center}
.al.w{background:rgba(240,165,0,.08);color:#f0a500;border:1px solid rgba(240,165,0,.2)}
.al.s{background:rgba(34,197,94,.08);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
.al.e{background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
.al.i{background:rgba(59,130,246,.08);color:#3b82f6;border:1px solid rgba(59,130,246,.2)}
.cd{display:none;text-align:center;margin-bottom:12px}
.cd .lb{font-size:.7em;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px}
.cd .dg{font-size:2em;font-weight:900;letter-spacing:3px;color:#f0a500;font-family:monospace;background:rgba(240,165,0,.06);padding:12px;border-radius:10px;border:2px dashed rgba(240,165,0,.3);margin-bottom:8px}
.cd .at{font-size:.8em;color:#f0a500;font-weight:600;animation:b 1.2s infinite}
@keyframes b{0%,100%{opacity:1}50%{opacity:.5}}
.fg{margin-bottom:8px}
select,input{width:100%;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#e8e8f0;font-size:.88em}
select:focus,input:focus{outline:none;border-color:#f0a500}
select option{background:#141028;color:#e8e8f0}
input::placeholder{color:#4b5563}
.btn{width:100%;padding:13px;border-radius:8px;border:none;background:linear-gradient(135deg,#f0a500,#e86a10);color:#fff;font-size:.92em;font-weight:700;cursor:pointer}
.btn:disabled{opacity:.5}
.st{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.05)}
.st h4{font-size:.72em;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
ol{list-style:none;counter-reset:s}ol li{counter-increment:s;padding:6px 0 6px 28px;color:#9ca3af;font-size:.78em;position:relative}
ol li::before{content:counter(s);position:absolute;left:0;top:7px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#f0a500,#e86a10);color:#fff;font-size:.65em;font-weight:700;display:flex;align-items:center;justify-content:center}
ol li b{color:#e8e8f0}
.ft{text-align:center;margin-top:14px;color:#4b5563;font-size:.68em}
.bk{display:block;margin-top:10px;text-align:center;color:#6b7280;font-size:.76em;cursor:pointer;padding:6px}
.tp{background:rgba(240,165,0,.05);border:1px solid rgba(240,165,0,.1);border-radius:8px;padding:10px;margin-top:12px;font-size:.75em;color:#f0a500;text-align:center}
</style></head><body><div class="w">
<div class="logo"><div class="lb">⚡</div><h1>Victory Hub</h1><span>WhatsApp Pairing Code</span></div>
<div class="c">
<div id="al" class="al w">⏳ Antre nimewo w pou jwenn kòd</div>
<div id="cb" class="cd"><div class="lb">Kòd Ou</div><div id="cd" class="dg"></div><div class="at">👆 Tape notifikasyon WhatsApp!</div></div>
<div id="fm">
<div class="fg"><select id="cc"><option value="509">🇭🇹 +509 Haiti</option><option value="1">🇺🇸 +1 USA</option></select></div>
<div class="fg"><input id="ph" type="tel" placeholder="Nimewo (eg: 31234567)" required></div>
<button id="btn" class="btn" onclick="go()">🔑 Jwenn Kòd</button>
<div id="bk" class="bk" style="display:none" onclick="rs()">← Nouvo kòd</div>
</div>
<div class="st"><h4>📋 Etap</h4><ol>
<li>Klike <b>"Jwenn Kòd"</b></li><li>Tann 5-10 segonn</li>
<li><b>Tape notifikasyon WhatsApp</b></li><li>Antre kòd la</li><li>✅ <b>Konekte!</b></li></ol></div>
<div class="tp">💡 WhatsApp ap voye notifikasyon: <b>"Enter code to link new device"</b></div>
</div>
<div class="ft">Victory Hub v1.0</div>
</div>
<script>
let pi=null;
async function go(){
const cc=document.getElementById('cc').value;
const ph=document.getElementById('ph').value.replace(/\\D/g,'');
if(!ph){al('❌ Antre nimewo w!','e');return}
const btn=document.getElementById('btn');
btn.disabled=true;btn.textContent='⏳ Ap konekte... (5-15s)';
al('⏳ Ap konekte ak WhatsApp... Tann...','i');
try{
const r=await fetch('/pair?phone='+cc+ph);
const d=await r.json();
if(d.success){
document.getElementById('cb').style.display='block';
document.getElementById('cd').textContent=(d.code||'').match(/.{3,4}/g)?.join('-')||d.code;
al('✅ Kòd pare! <b>Tape notifikasyon WhatsApp!</b>','s');
btn.style.display='none';document.getElementById('bk').style.display='block';
sp();
}else{
al('❌ '+d.error,'e');btn.disabled=false;btn.textContent='🔑 Jwenn Kòd';}
}catch(err){al('❌ '+err.message,'e');btn.disabled=false;btn.textContent='🔑 Jwenn Kòd';}
}
function sp(){let a=0;pi=setInterval(async()=>{a++;try{const r=await fetch('/status');const d=await r.json();if(d.connected){clearInterval(pi);al('🎉 KONEKTE!<br><small>SESSION: RGNK~'+d.sessionId+'</small>','s');document.getElementById('cb').style.display='none'}else if(a>=360){clearInterval(pi);al('⏰ Tan ekspire','e')}}catch(e){}},2000)}
function al(m,t){document.getElementById('al').innerHTML=m;document.getElementById('al').className='al '+t}
function rs(){if(pi)clearInterval(pi);document.getElementById('cb').style.display='none';document.getElementById('btn').style.display='block';document.getElementById('btn').disabled=false;document.getElementById('btn').textContent='🔑 Jwenn Kòd';document.getElementById('bk').style.display='none';al('⏳ Antre nimewo w pou jwenn kòd','w')}
</script></body></html>`;

let sock=null,code=null,connected=false,sid=null;

async function genPairCode(phone){
  if(sock){try{sock.end()}catch(e){}sock=null}
  code=null;connected=false;sid=null;
  
  const dir=path.join(__dirname,"auth_pair");
  if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
  const{state,saveCreds}=await useMultiFileAuthState(dir);
  const{version}=await fetchLatestBaileysVersion();
  
  console.log("Creating socket v"+version);
  
  sock=makeWASocket({
    version,
    auth:state,
    printQRInTerminal:false,
    browser:Browsers.ubuntu("Chrome"),
    logger,
    connectTimeoutMs:60000,
    defaultQueryTimeoutMs:60000,
  });

  sock.ev.on("connection.update",async u=>{
    const{connection}=u;
    console.log(new Date().toISOString(),"Baileys:",connection);
    if(connection==="open"){
      connected=true;
      if(sock?.authState?.creds?.me)sid=sock.authState.creds.me.id.split(":")[0];
      await saveCreds();
    }
  });
  sock.ev.on("creds.update",saveCreds);

  // Wait for socket to connect (up to 45s)
  console.log("Waiting for socket...");
  await new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(new Error("Timeout koneksyon. Eseye ankò.")),45000);
    sock.ev.on("connection.update",function h(u){
      const{connection,qr}=u;
      if(connection==="connecting"||!!qr||connection==="open"){
        clearTimeout(t);sock.ev.off("connection.update",h);
        console.log("Socket ready at:",connection);resolve();
      }
    });
  });
  
  console.log("requestPairingCode for:",phone);
  code=await sock.requestPairingCode(phone);
  console.log("Code:",code);
  return{success:true,code};
}

function startPairingServer(){
  http.createServer(async(req,res)=>{
    try{
      const u=new URL(req.url,"http://localhost:"+PORT);
      res.setHeader("Access-Control-Allow-Origin","*");
      if(u.pathname==="/"||u.pathname===""){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(HTML)}
      else if(u.pathname==="/pair"&&req.method==="GET"){
        const ph=u.searchParams.get("phone");
        if(!ph){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({success:false,error:"Nimewo obligatwa"}));return}
        try{const r=await genPairCode(ph);res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify(r))}
        catch(e){console.error(e);res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({success:false,error:e.message}))}
      }else if(u.pathname==="/status"){res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({connected,sessionId:sid,code}))}
      else if(u.pathname==="/health"){res.writeHead(200,{"Content-Type":"text/plain"});res.end("OK")}
      else{res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(HTML)}
    }catch(e){res.writeHead(500,{"Content-Type":"text/html"});res.end(HTML)}
  }).listen(PORT,()=>console.log("⚡ Pairing on "+PORT));
}

module.exports={startPairingServer};