/* lab3 生成质量量化工具（verify_tightness.js）
 *
 * 用法：
 *   node verify_tightness.js          对比「工作区当前版本」与「git 最近提交版本」的三项贴合度
 *   node verify_tightness.js --scan   扫描 TUNE 配置组合，找最优权重与配额
 *
 * 原理：lab3.html 的三段脚本全部包在 IIFE 内，外部拿不到 state / generateOffline，
 *      所以在 IIFE 内注入 window.__L3 导出接口，再用 vm 跑真实页面逻辑。
 *      node 里 script.onload 不会触发，必须手工调 fullActivate() 才会装配全量语料。
 *
 * 三项指标（只统计「语料重装」路径）：
 *   主题字命中率   —— 句中直接出现用户输入的主题实义字的比例
 *   主题意象命中率 —— 句中命中主题所对应意象的比例
 *   情感命中率     —— 句含情感 tint 字或被语料标注为该情绪的比例
 */
const fs=require('fs'),vm=require('vm'),cp=require('child_process'),path=require('path');
const REPO=path.resolve(__dirname,'..');

const ctx2d=new Proxy({},{get:(t,k)=>{
  if(k==='canvas')return {width:800,height:600};
  if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});
  if(k==='measureText')return ()=>({width:10});
  if(k==='getImageData')return ()=>({data:[]});
  return ()=>{};
}});

function makeEnv(){
  const els={};
  function mkEl(id){
    const target={id:id||'',value:'',textContent:'',innerHTML:'',style:{},className:'',
      checked:false,selectedIndex:0,options:[],length:0,children:[],childNodes:[],dataset:{},
      offsetWidth:800,offsetHeight:600,scrollHeight:2000,scrollTop:0,scrollWidth:1200,
      tagName:'DIV',nodeType:1,firstChild:null,lastChild:null,parentNode:null};
    return new Proxy(target,{
      get(t,k){
        if(k in t) return t[k];
        if(k==='getContext') return ()=>ctx2d;
        if(k==='getBoundingClientRect') return ()=>({top:0,left:0,width:800,height:600,right:800,bottom:600});
        if(k==='querySelectorAll') return ()=>[];
        if(k==='querySelector') return ()=>null;
        if(k==='closest') return ()=>null;
        if(k==='getElementsByTagName') return ()=>[];
        if(k==='getAttribute') return ()=>null;
        if(k==='setAttribute'||k==='removeAttribute') return ()=>{};
        if(k==='hasAttribute') return ()=>false;
        if(k==='appendChild') return (c)=>{ t.children.push(c); return c; };
        if(k==='removeChild'||k==='insertBefore'||k==='replaceChild') return ()=>{};
        if(k==='addEventListener'||k==='removeEventListener') return ()=>{};
        if(k==='focus'||k==='blur'||k==='click'||k==='scrollIntoView') return ()=>{};
        if(k==='classList') return {add(){},remove(){},contains(){return false;},toggle(){}};
        if(typeof k==='symbol') return undefined;
        return function(){ return mkEl(); };
      },
      set(t,k,v){ t[k]=v; return true; }
    });
  }
  const getEl=id=>{ if(!els[id]) els[id]=mkEl(id); return els[id]; };
  const document={getElementById:getEl, createElement:()=>mkEl(), createElementNS:()=>mkEl(),
    head:mkEl('head'), body:mkEl('body'), documentElement:mkEl('html'),
    querySelectorAll:()=>[], querySelector:()=>null, addEventListener(){},
    getElementsByTagName:()=>[], createTextNode:()=>mkEl(), title:'t',
    fonts:{ready:Promise.resolve()}, createEvent:()=>({initEvent(){}})};
  const sandbox={};
  sandbox.window=sandbox; sandbox.document=document; sandbox.console=console;
  sandbox.location={pathname:'/lab3.html',hash:'',href:'http://x/lab3.html',search:''};
  sandbox.history={pushState(){},replaceState(){}};
  sandbox.navigator={userAgent:'node',clipboard:{writeText(){}},language:'zh-CN'};
  sandbox.localStorage={_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=v;},removeItem(k){delete this._d[k];}};
  sandbox.addEventListener=()=>{}; sandbox.removeEventListener=()=>{};
  sandbox.requestAnimationFrame=()=>0; sandbox.cancelAnimationFrame=()=>{};
  sandbox.setTimeout=()=>0; sandbox.clearTimeout=()=>{};
  sandbox.setInterval=()=>0; sandbox.clearInterval=()=>{};
  sandbox.requestIdleCallback=()=>0; sandbox.cancelIdleCallback=()=>{};
  sandbox.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  sandbox.fetch=()=>Promise.resolve({ok:false,json:()=>({})});
  sandbox.innerWidth=1200; sandbox.innerHeight=800; sandbox.scrollY=0; sandbox.devicePixelRatio=1;
  sandbox.alert=()=>{}; sandbox.confirm=()=>true; sandbox.prompt=()=>null;
  sandbox.getComputedStyle=()=>({getPropertyValue:()=>''});
  sandbox.MutationObserver=class{observe(){} disconnect(){}};
  sandbox.IntersectionObserver=class{observe(){} disconnect(){}};
  sandbox.ResizeObserver=class{observe(){} disconnect(){}};
  sandbox.Image=class{constructor(){this.width=0;this.height=0;}set src(v){}};
  sandbox.performance={now:()=>Date.now()};
  sandbox.crypto={randomUUID:()=>'uuid-'+Math.random()};
  return {sandbox,els};
}

/* 在 IIFE 内注入导出接口 */
function injectApi(html){
  const api="window.__L3={state:state,generateOffline:generateOffline,factoryPoem:factoryPoem,plKeys:plKeys,IMG:IMG,THEME:THEME,PL:PL,MOOD:MOOD,FORMS:FORMS};\n"
    +"if(typeof emoIndex==='function')window.__L3.emoIndex=emoIndex;\n"
    +"if(typeof themeChars==='function')window.__L3.themeChars=themeChars;\n"
    +"if(typeof themeImgs==='function')window.__L3.themeImgs=themeImgs;\n"
    +"if(typeof inferSubject==='function')window.__L3.inferSubject=inferSubject;\n"
    +"if(typeof TUNE!=='undefined')window.__L3.TUNE=TUNE;\n";
  const marker='\nbuildSelects();\n})();';
  if(html.indexOf(marker)<0) throw new Error('注入锚点未找到：lab3.html 的 IIFE 结构可能变了');
  return html.replace(marker,'\n'+api+'buildSelects();\n})();');
}

function boot(html){
  const {sandbox,els}=makeEnv();
  const ctx=vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(REPO+'/poem_lib.js','utf8'),ctx);
  sandbox.PL=sandbox.PL;
  for(const f of fs.readdirSync(REPO+'/poem_full')) vm.runInContext(fs.readFileSync(REPO+'/poem_full/'+f,'utf8'),ctx);
  const blocks=[...injectApi(html).matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  blocks.forEach(b=>{ try{ vm.runInContext(b,ctx); }catch(e){ console.log('  脚本块异常:',e.message); } });
  try{ vm.runInContext('if(window.PL_FULL&&window.PL_META&&typeof fullActivate==="function")fullActivate();',ctx); }
  catch(e){ console.log('  fullActivate 异常:',e.message); }
  if(!ctx.__L3) throw new Error('未能注入 __L3 接口');
  return {ctx,els};
}

const STOP='的了着过是在也都就还又和与及或于为之其所以但而况亦将且则乃此很太被把对从向让给并且如若因'.split('');
function themeCharSet(theme){
  const o={},t=(theme||'').replace(/[\s,，。、；;：:!！?？~、]+/g,'');
  for(const c of t) if(STOP.indexOf(c)<0) o[c]=1;
  return o;
}
function themeImgSet(L,theme){
  const out=[],seen={};
  for(const ch of (theme||'')){
    const got=L.THEME[ch];
    if(got) got.forEach(k=>{if(!seen[k]){seen[k]=1;out.push(k);}});
    for(const k in L.IMG){ if(L.IMG[k].n===ch&&!seen[k]){seen[k]=1;out.push(k);} }
  }
  return out;
}
function metrics(B,theme,mood,form,nonce){
  const {ctx,els}=B, L=ctx.__L3;
  L.state.mood=mood; L.state.form=form; L.state.nonce=nonce; L.state.style='ink';
  const tel=els['theme']||(els['theme']=ctx.document.getElementById('theme')); tel.value=theme;
  const t0=Date.now();
  L.generateOffline();
  const dt=Date.now()-t0;
  const p=L.state.poem;
  if(!p||!p.lines||!p.lines.length) return null;
  const PL=L.PL, chars=themeCharSet(theme), want=themeImgSet(L,theme), tint=PL.moodTint[mood]||'';
  const emo={}; if(L.emoIndex){ const ix=L.emoIndex(mood); for(const k in ix) emo[k]=1; }
  let th=0,ig=0,em=0;
  for(const line of p.lines){
    let a=0; for(const c of line) if(chars[c]) a++;
    if(a) th++;
    const ks=L.plKeys(line);
    for(const k in ks){ if(want.indexOf(k)>=0){ ig++; break; } }
    let b=0; for(const c of line) if(tint.indexOf(c)>=0) b++;
    if(b||emo[line]) em++;
  }
  const kind=p.curated?'curated':(p.factory?'factory':'other');
  return {title:p.title,lines:p.lines,text:p.lines.join(' / '),kind,dt,
    themeRate:th/p.lines.length, imgRate:ig/p.lines.length, emoRate:em/p.lines.length};
}

/* 可映射主题：主题字能落到意象表，主题意象命中率对它才有意义 */
const THEMES=['秋夜江边','孤舟蓑笠翁','月下独酌','雪落寒江','思乡','春雨'];
/* 不可映射主题：主题字落不到意象表（如「霜天」「故人西辞」），只能靠主题字贴合 */
const THEMES_UNMAPPED=['霜天','故人西辞'];
const MOODS=['jing','bei','xi','zhuang','you'];
const FORMS=['wujue','qijue','qilv','wulv'];

function runAll(B,themes,forms,nonceMax){
  let s={t:0,i:0,e:0},n=0,fail=0,time=0,byTheme={};
  for(const th of themes) for(const mo of MOODS) for(let k=0;k<nonceMax;k++){
    const r=metrics(B,th,mo,forms[k%forms.length],k);
    if(!r){fail++;continue;}
    byTheme[th]=byTheme[th]||{}; byTheme[th][mo]=r;
    if(r.kind!=='factory') continue;
    s.t+=r.themeRate; s.i+=r.imgRate; s.e+=r.emoRate; n++; time+=r.dt;
  }
  return {s,n,fail,time,byTheme};
}
const pct=(x,n)=>n?(x/n*100).toFixed(1)+'%':'—';

if(process.argv.includes('--scan')){
  const CONFIGS=[
    {name:'当前默认',        strict:1, imgW:6, emoW:24, emoWPlain:2, tintW:6, themeW:4.2, themeBonus:6, seasonPenalty:20, qCross:48, qMain:56},
    {name:'非严格对照',      strict:0, imgW:6, emoW:24, emoWPlain:2, tintW:6, themeW:4.2, themeBonus:6, seasonPenalty:20, qCross:48, qMain:56},
    {name:'轻主题字',        strict:1, imgW:6, emoW:24, emoWPlain:2, tintW:6, themeW:2.6, themeBonus:3, seasonPenalty:20, qCross:48, qMain:56},
    {name:'强主题字',        strict:1, imgW:6, emoW:24,emoWPlain:2, tintW:6, themeW:5.4, themeBonus:8, seasonPenalty:20, qCross:48, qMain:56},
    {name:'强情感',          strict:1, imgW:6, emoW:34, emoWPlain:2, tintW:8, themeW:4.2, themeBonus:6, seasonPenalty:20, qCross:56, qMain:60},
    {name:'无季节约束',      strict:1, imgW:6, emoW:24, emoWPlain:2, tintW:6, themeW:4.2, themeBonus:6, seasonPenalty:0,  qCross:48, qMain:56}
  ];
  console.log('配置'.padEnd(22)+'主题字   主题意象  情感     失败  耗时');
  console.log('-'.repeat(68));
  const html=fs.readFileSync(REPO+'/lab3.html','utf8');
  for(const cfg of CONFIGS){
    const B=boot(html);
    if(B.ctx.__L3.TUNE) Object.assign(B.ctx.__L3.TUNE,cfg);
    const r=runAll(B,THEMES,FORMS,14);
    const u=runAll(B,THEMES_UNMAPPED,FORMS,7);
    console.log(cfg.name.padEnd(22)+pct(r.s.t,r.n).padEnd(8)+pct(r.s.i,r.n).padEnd(10)+pct(r.s.e,r.n).padEnd(9)+String(r.fail).padEnd(6)+(r.n?(r.time/r.n).toFixed(0):'0')+'ms');
    console.log('  └ 不可映射主题: 主题字 '+pct(u.s.t,u.n)+'  情感 '+pct(u.s.e,u.n)+'  失败 '+u.fail);
  }
  console.log('\nn=每配置语料重装样本数（'+THEMES.length+'主题×'+MOODS.length+'情感×14次）');
} else {
  const cur=fs.readFileSync(REPO+'/lab3.html','utf8');
  let old;
  try{ old=cp.execSync('git -C "'+REPO+'" show HEAD:lab3.html',{maxBuffer:1<<28}).toString(); }
  catch(e){ old=cur; console.log('（取不到 HEAD 版本，改与自身对比）'); }
  console.log('=========== 当前工作区 vs git 最近提交 ===========\n');
  for(const [label,html] of [['当前',cur],['提交',old]]){
    const B=boot(html);
    const r=runAll(B,THEMES,['wujue','qijue','qilv'],14);
    console.log('['+label+'] 语料重装  主题字 '+pct(r.s.t,r.n)+'  主题意象 '+pct(r.s.i,r.n)+'  情感 '+pct(r.s.e,r.n)+'  失败 '+r.fail);
    const u=runAll(B,THEMES_UNMAPPED,['wujue','qijue','qilv'],7);
    console.log('      不可映射主题  主题字 '+pct(u.s.t,u.n)+'  情感 '+pct(u.s.e,u.n)+'  失败 '+u.fail);
  }
  const B=boot(cur);
  let total=0,ok=0,bad=[];
  for(const fid of Object.keys(B.ctx.__L3.FORMS)) for(const th of ['秋夜江边','孤舟蓑笠翁','思乡','霜天']) for(const mo of ['jing','bei']){
    total++;
    B.ctx.__L3.state.mood=mo; B.ctx.__L3.state.form=fid; B.ctx.__L3.state.nonce=1;
    B.els['theme']=B.els['theme']||B.ctx.document.getElementById('theme'); B.els['theme'].value=th;
    try{
      B.ctx.__L3.generateOffline();
      const p=B.ctx.__L3.state.poem;
      if(p&&p.lines&&p.lines.length) ok++; else bad.push(fid+'/'+th);
    }catch(e){ bad.push(fid+'/'+th+':'+e.message); }
  }
  console.log('\n全诗体回归: '+ok+'/'+total+' 通过'+(bad.length?'  失败: '+bad.slice(0,10).join(', '):''));
  console.log('\n样例（主题「秋夜江边」· 七言）：');
  const R=runAll(boot(cur),['秋夜江边'],['qijue'],14);
  for(const mo of MOODS){
    const r=R.byTheme['秋夜江边'][mo];
    if(r) console.log('  ['+mo+'] '+r.title+'：'+r.lines.join(' / '));
  }
}
