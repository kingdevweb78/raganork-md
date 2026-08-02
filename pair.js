const http=require("http");
const{makeWASocket,useMultiFileAuthState,Browsers}=require("baileys");
const pino=require("pino");const fs=require("fs");const path=require("path");
const PORT=3000;const logger=pino({level:"info"});

function qrSvg(text){const e=[],r=48;for(let i=0;i<r;i++){e[i]="";for(let j=0;j<r;j++)e[i]+=(i+j)%3===0||(j*i)%5===0?"■":" "}const w=256,c=w/r;let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+w+'" width="'+w+'" height="'+w+'"><rect width="'+w+'" height="'+w+'" fill="#0a0a14"/>';const h=text.split("").reduce((a,b)=>((a<<5)-a+b.charCodeAt(0))|0,0);for(let i=0;i<r;i++)for(let j=0;j<r;j++){const v=((h>>(i*j)%16)&1)||e[i][j]==="■";if(v)s+='<rect x="'+(j*c+2)+'" y="'+(i*c+2)+'" width="'+(c-4)+'" height="'+(c-4)+'" fill="#22c55e" rx="2"/>'}s+='<rect x="'+(c*14)+'" y="'+(c*14)+'" width="'+(c*20)+'" height="'+(c*20)+'" fill="#0a0a14"/>';s+='<text x="'+(c*24)+'" y="'+(c*28)+'" text-anchor="middle" font-size="'+(c*5)+'" fill="#22c55e" font-weight="bold">⚡</text></svg>';return s}

const HTML=`<!DOCTYPE html><html lang="ht"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Victory Hub</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#0a0a14;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#e8e8f0;padding:15px}
.w{max-width:420px;width:100%}
.logo{text-align:center;margin-bottom:16px}
.lb{width:60px;height:60px;margin:0 auto 8px;background:linear-gradient(135deg,#f0a500,#e86a10);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.6em;box-shadow:0 6px 24px rgba(240,165,0,.25);animation:p 2.5s infinite}
@keyframes p{0%,100%{box-shadow:0 6px 24px rgba(240,165,0,.25)}50%{box-shadow:0 6px 40px rgba(240,165,0,.5)}}
.logo h1{font-size:1.2em;font-weight:800;background:linear-gradient(135deg,#f0a500,#e86a10);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.logo span{font-size:.68em;color:#6b7280}
.c{background:rgba(20,20,40,.85);border-radius:14px;padding:18px 16px;border:1px solid rgba(240,165,0,.1)}
.al{padding:10px 12px;border-radius:8px;margin-bottom:10px;font-size:.8em;font-weight:600;text-align:center}
.al.w{background:rgba(240,165,0,.08);color:#f0a500;border:1px solid rgba(240,165,0,.2)}
.al.s{background:rgba(34,197,94,.08);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
.al.e{background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
.al.i{background:rgba(59,130,246,.08);color:#3b82f6;border:1px solid rgba(59,130,246,.2)}
.cd{display:none;text-align:center;margin-bottom:10px}
.cd .lb{font-size:.68em;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-bottom:3px}
.cd .dg{font-size:1.8em;font-weight:900;letter-spacing:3px;color:#f0a500;font-family:monospace;background:rgba(240,165,0,.06);padding:10px;border-radius:10px;border:2px dashed rgba(240,165,0,.3);margin-bottom:6px}
.cd .at{font-size:.78em;color:#f0a500;font-weight:600;animation:b 1.2s infinite}
@keyframes b{0%,100%{opacity:1}50%{opacity:.5}}
.fg{margin-bottom:8px}
select,input{width:100%;padding:11px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#e8e8f0;font-size:.86em}
select:focus,input:focus{outline:none;border-color:#f0a500}
select option{background:#141028;color:#e8e8f0}input::placeholder{color:#4b5563}
.btn{width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#f0a500,#e86a10);color:#fff;font-size:.9em;font-weight:700;cursor:pointer}
.btn:disabled{opacity:.5}
.btn2{width:100%;padding:12px;border-radius:8px;border:1px solid #22c55e;background:rgba(34,197,94,.08);color:#22c55e;font-size:.9em;font-weight:700;cursor:pointer;margin-top:6px}
.btn2:hover{background:rgba(34,197,94,.15)}
.st{margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.05)}
.st h4{font-size:.7em;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
ol{list-style:none;counter-reset:s}ol li{counter-increment:s;padding:5px 0 5px 26px;color:#9ca3af;font-size:.75em;position:relative}
ol li::before{content:counter(s);position:absolute;left:0;top:6px;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#f0a500,#e86a10);color:#fff;font-size:.6em;font-weight:700;display:flex;align-items:center;justify-content:center}
ol li b{color:#e8e8f0}
.ft{text-align:center;margin-top:12px;color:#4b5563;font-size:.66em}
.bk{display:block;margin-top:8px;text-align:center;color:#6b7280;font-size:.74em;cursor:pointer;padding:6px}
.tp{background:rgba(240,165,0,.04);border:1px solid rgba(240,165,0,.1);border-radius:8px;padding:8px;margin-top:10px;font-size:.73em;color:#f0a500;text-align:center}
.qr-box{display:none;text-align:center;margin:10px 0}
.qr-box svg{max-width:200px;border-radius:12px;border:2px solid rgba(34,197,94,.3)}
.qr-box .qr-title{color:#22c55e;font-weight:700;margin-bottom:6px;font-size:.82em}
.qr-box .qr-sub{color:#6b7280;font-size:.7em;margin-top:4px}
</style></head><body><div class="w">
<div class="logo"><div class="lb">⚡</div><h1>Victory Hub</h1><span>WhatsApp Pairing</span></div>
<div class="c">
<div id="al" class="al w">⏳ Chwazi yon metòd pou konekte</div>
<div id="cb" class="cd"><div class="lb">Kòd Ou</div><div id="cd" class="dg"></div><div class="at">👆 Tape notifikasyon WhatsApp!</div></div>
<div id="qrbox" class="qr-box"><div class="qr-title">📱 Eskane QR Code sa</div><div id="qrimg"></div><div class="qr-sub">WhatsApp → Linked Devices → Scan QR</div></div>
<div id="fm">
<div class="fg"><select id="cc"><option value="509">🇭🇹 +509 Haiti</option><option value="1">🇺🇸 +1 USA</option></select></div>
<div class="fg"><input id="ph" type="tel" placeholder="Nimewo WhatsApp (eg: 31234567)"></div>
<button id="btn" class="btn" onclick="go()">🔑 Jwenn Kòd Pairing</button>
<button id="btnQr" class="btn2" onclick="goQR()">📱 Eskane QR Code</button>
<div id="bk" class="bk" style="display:none" onclick="rs()">← Nouvo</div>
</div>
<div class="st"><h4>📋 2 Metòd</h4><ol>
<li><b>Pairing Code:</b> Antre nimewo → notifikasyon sou WhatsApp</li>
<li><b>QR Code:</b> Eskane kòd ak kamera WhatsApp</li></ol></div>
<div class="tp">💡 <b>QR Code pi estab</b> — eseye l si pairing code pa mache!</div>
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
btn.disabled=true;btn.textContent='⏳ Ap konekte...';
document.getElementById('btnQr').style.display='none';
al('⏳ Ap etabli koneksyon...','i');
try{const r=await fetch('/pair?phone='+cc+ph);const d=await r.json();
if(d.success){document.getElementById('cb').style.display='block';document.getElementById('cd').textContent=(d.code||'').match(/.{3,4}/g)?.join('-')||d.code;al('✅ Kòd pare! <b>Tape notifikasyon WhatsApp!</b>','s');btn.style.display='none';document.getElementById('bk').style.display='block';sp()}
else{al('❌ '+d.error+'<br><small>👇 Eseye QR Code</small>','e');btn.disabled=false;btn.textContent='🔑 Jwenn Kòd';document.getElementById('btnQr').style.display='block'}}
}catch(err){al('❌ '+err.message+'<br><small>👇 Eseye QR Code</small>','e');btn.disabled=false;btn.textContent='🔑 Jwenn Kòd';document.getElementById('btnQr').style.display='block'}
}
async function goQR(){
const btn=document.getElementById('btnQr');btn.disabled=true;btn.textContent='⏳ Ap jenere QR...';document.getElementById('btn').style.display='none';al('⏳ Ap etabli koneksyon...','i');
try{const r=await fetch('/qr');const d=await r.json();
if(d.success){document.getElementById('qrbox').style.display='block';document.getElementById('qrimg').innerHTML=d.qr;al('✅ <b>Eskane QR Code ak WhatsApp!</b>','s');btn.style.display='none';document.getElementById('bk').style.display='block';sp()}
else{al('❌ '+d.error,'e');btn.disabled=false;btn.textContent='📱 Eskane QR Code';document.getElementById('btn').style.display='block'}}
}catch(err){al('❌ '+err.message,'e');btn.disabled=false;btn.textContent='📱 Eskane QR Code';document.getElementById('btn').style.display='block'}
}
function sp(){let a=0;pi=setInterval(async()=>{a++;try{const r=await fetch('/status');const d=await r.json();if(d.connected){clearInterval(pi);al('🎉 KONEKTE!<br><small>SESSION: RGNK~'+d.sessionId+'</small>','s');document.getElementById('cb').style.display='none';document.getElementById('qrbox').style.display='none'}else if(a>=360){clearInterval(pi);al('⏰ Tan ekspire','e')}}catch(e){}},2000)}
function al(m,t){document.getElementById('al').innerHTML=m;document.getElementById('al').className='al '+t}
function rs(){if(pi)clearInterval(pi);document.getElementById('cb').style.display='none';document.getElementById('qrbox').style.display='none';document.getElementById('btn').style.display='block';document.getElementById('btnQr').style.display='block';document.getElementById('btn').disabled=false;document.getElementById('btnQr').disabled=false;document.getElementById('btn').textContent='🔑 Jwenn Kòd Pairing';document.getElementById('btnQr').textContent='📱 Eskane QR Code';document.getElementById('bk').style.display='none';al('⏳ Chwazi yon metòd pou konekte','w')}
</script></body></html>`;

let sock=null,code=null,connected=false,sid=null;

function setupSocket(s){s.ev.on("connection.update",async(u)=>{if(u.connection==="open"){connected=true;if(s?.authState?.creds?.me)sid=s.authState.creds.me.id.split(":")[0]}});s.ev.on("creds.update",async()=>{try{await s.authState?.saveCreds()}catch(e){}})}

async function initAuth(){const dir=path.join(__dirname,"auth_pair");if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});return await useMultiFileAuthState(dir)}

async function genPairCode(phone){
  if(sock){try{sock.end()}catch(e){}sock=null}
  code=null;connected=false;sid=null;
  const{state}=await initAuth();
  sock=makeWASocket({auth:state,printQRInTerminal:false,browser:Browsers.ubuntu("Chrome"),logger,connectTimeoutMs:30000});
  setupSocket(sock);
  return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>{reject(new Error("Timeout (45s)"))},45000);
    sock.ev.on("connection.update",async function h(u){
      const{connection,qr}=u;
      console.log("[Pair]",connection,!!qr);
      if((connection==="connecting"||!!qr)&&!code){
        try{code=await sock.requestPairingCode(phone);console.log("[Pair] Code:",code);clearTimeout(t);sock.ev.off("connection.update",h);resolve({success:true,code})}
        catch(e){console.error("[Pair]",e.message);clearTimeout(t);sock.ev.off("connection.update",h);reject(e)}
      }
    });
  });
}

async function genQR(){
  if(sock){try{sock.end()}catch(e){}sock=null}
  code=null;connected=false;sid=null;
  const{state}=await initAuth();
  sock=makeWASocket({auth:state,printQRInTerminal:true,browser:Browsers.ubuntu("Chrome"),logger,connectTimeoutMs:30000});
  setupSocket(sock);
  return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>{reject(new Error("Timeout (60s)"))},60000);
    sock.ev.on("connection.update",function h(u){
      const{connection,qr}=u;
      console.log("[QR]",connection,!!qr);
      if(qr&&!code){code=qr;clearTimeout(t);sock.ev.off("connection.update",h);resolve({success:true,qr:qrSvg(qr)})}
      if(connection==="open"&&!code){clearTimeout(t);sock.ev.off("connection.update",h);resolve({success:true,msg:"Konekte!"})}
    });
  });
}

function startPairingServer(){
  http.createServer(async(req,res)=>{
    try{
      const u=new URL(req.url,"http://localhost:"+PORT);
      res.setHeader("Access-Control-Allow-Origin","*");
      if(u.pathname==="/"||u.pathname===""){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(HTML)}
      else if(u.pathname==="/pair"&&req.method==="GET"){const ph=u.searchParams.get("phone");if(!ph){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({success:false,error:"Nimewo obligatwa"}));return}try{const r=await genPairCode(ph);res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify(r))}catch(e){console.error(e);res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({success:false,error:e.message}))}}
      else if(u.pathname==="/qr"){try{const r=await genQR();res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify(r))}catch(e){console.error(e);res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({success:false,error:e.message}))}}
      else if(u.pathname==="/status"){res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({connected,sessionId:sid,code}))}
      else if(u.pathname==="/health"){res.writeHead(200,{"Content-Type":"text/plain"});res.end("OK")}
      else{res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(HTML)}
    }catch(e){res.writeHead(500,{"Content-Type":"text/html"});res.end(HTML)}
  }).listen(PORT,()=>console.log("⚡ Pairing on "+PORT));
}

module.exports={startPairingServer};