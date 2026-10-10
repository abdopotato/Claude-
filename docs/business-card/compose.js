const { chromium } = require('playwright'); const fs=require('fs');
const cfg=JSON.parse(process.argv[2]||'{}');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.setContent('<html></html>');
const card='data:image/jpeg;base64,'+fs.readFileSync('card-front.jpg').toString('base64');
const ref='data:image/jpeg;base64,'+fs.readFileSync('roll-ref.jpg').toString('base64');
const out=await p.evaluate(async([card,ref,cfg])=>{
 const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=s;});
 const [ci,ri]=await Promise.all([load(card),load(ref)]);
 const BG=[0x11,0x26,0x1e], GOLD=[0xC6,0xA6,0x60];
 const c=document.createElement('canvas');c.width=ci.width;c.height=ci.height;const x=c.getContext('2d');x.drawImage(ci,0,0);
 // 1) grab the wordmark (no .ca, no Arabic) and the accent line before clearing
 const wm={x:296,y:322,w:1045-296,h:404-322}; const wmData=x.getImageData(wm.x,wm.y,wm.w,wm.h);
 const ln={x:452,y:496,w:356,h:24}; const lnData=x.getImageData(ln.x,ln.y,ln.w,ln.h);
 // 2) remove masjid icon, wordmark, .ca, Arabic and the old accent line spot
 x.fillStyle='rgb('+BG+')';x.fillRect(120,300,1030,230);
 // 3) roll: exact drawing, brown -> gold, white -> transparent
 const rb={x:103,y:227,w:1056,h:415};
 const rc=document.createElement('canvas');rc.width=rb.w;rc.height=rb.h;const rx=rc.getContext('2d');rx.drawImage(ri,-rb.x,-rb.y);
 const rd=rx.getImageData(0,0,rb.w,rb.h);const brownAvg=(119+74+54)/3;
 for(let i=0;i<rd.data.length;i+=4){const avg=(rd.data[i]+rd.data[i+1]+rd.data[i+2])/3;let a=(255-avg)/(255-brownAvg);a=Math.max(0,Math.min(1,a));
  rd.data[i]=GOLD[0];rd.data[i+1]=GOLD[1];rd.data[i+2]=GOLD[2];rd.data[i+3]=Math.round(a*255);}
 rx.putImageData(rd,0,0);
 const s=cfg.rollW/rb.w, rw=cfg.rollW, rh=rb.h*s;
 const groupH=rh+cfg.gap+ln.h, top=415-groupH/2, left=630-rw/2;
 x.drawImage(rc,left,top,rw,rh);
 // 4) wordmark onto the carpet, in the card's green so it reads on gold
 const wc=document.createElement('canvas');wc.width=wm.w;wc.height=wm.h;const wx=wc.getContext('2d');
 const wd=wx.createImageData(wm.w,wm.h);
 for(let i=0;i<wd.data.length;i+=4){const bb=wmData.data[i+2];let a=(bb-30)/(230-30);a=Math.max(0,Math.min(1,a));
  wd.data[i]=BG[0];wd.data[i+1]=BG[1];wd.data[i+2]=BG[2];wd.data[i+3]=Math.round(a*255);}
 wx.putImageData(wd,0,0);
 const ws=cfg.textW/wm.w; const cx=left+(cfg.panelX-rb.x)*s, cy=top+(cfg.panelY-rb.y)*s;
 x.drawImage(wc,cx-cfg.textW/2,cy-wm.h*ws/2,cfg.textW,wm.h*ws);
 // 5) accent line, unchanged, centred under the roll
 x.putImageData(lnData,ln.x,Math.round(top+rh+cfg.gap));
 return c.toDataURL('image/png');
},[card,ref,cfg]);
fs.writeFileSync(cfg.out||'card-front-roll.png',Buffer.from(out.split(',')[1],'base64'));await b.close();})();
