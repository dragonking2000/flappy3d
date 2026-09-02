const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const hero = document.querySelector('#hero');
const hud = document.querySelector('#hud');
const gameOver = document.querySelector('#game-over');
const scoreEl = document.querySelector('#score');
const coinsEl = document.querySelector('#coins');

let W, H, dpr, state = 'menu', time = 0, score = 0, coins = 0, speed = 4;
let bird = { x: .58, y: .48, vy: 0, tilt: 0 };
let obstacles = [], particles = [], clouds = [];

function resize(){ dpr=Math.min(devicePixelRatio,2); W=innerWidth; H=innerHeight; canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
addEventListener('resize',resize); resize();

for(let i=0;i<18;i++) clouds.push({x:Math.random()*1.4-.2,y:Math.random()*.7,s:.5+Math.random()*1.5,z:Math.random()});

function rr(x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
function cloud(x,y,s,a=.55){ ctx.globalAlpha=a; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,24*s,0,7);ctx.arc(x+28*s,y-10*s,34*s,0,7);ctx.arc(x+64*s,y,25*s,0,7);ctx.fill();ctx.globalAlpha=1; }
function drawBackground(){
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#42bdf5');g.addColorStop(.55,'#9be2fb');g.addColorStop(1,'#eef9d5');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const sun=ctx.createRadialGradient(W*.78,H*.19,5,W*.78,H*.19,W*.3);sun.addColorStop(0,'rgba(255,250,185,.85)');sun.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sun;ctx.fillRect(0,0,W,H*.8);
  clouds.forEach(c=>{let x=((c.x-time*.000012*(1+c.z))%1.5)*W;cloud(x,c.y*H,c.s*(.6+c.z),.3+c.z*.35)});
  // distant floating islands
  for(let i=0;i<7;i++){let x=((i*.23-time*.000006)%1.5)*W;let y=H*(.62+(i%3)*.07);ctx.fillStyle='#73b970';ctx.beginPath();ctx.ellipse(x,y,90,18,0,0,7);ctx.fill();ctx.fillStyle='#8b765d';ctx.beginPath();ctx.moveTo(x-70,y);ctx.lineTo(x,y+80);ctx.lineTo(x+70,y);ctx.fill();}
  const fog=ctx.createLinearGradient(0,H*.6,0,H);fog.addColorStop(0,'rgba(235,250,245,0)');fog.addColorStop(1,'rgba(230,246,224,.9)');ctx.fillStyle=fog;ctx.fillRect(0,H*.55,W,H*.45);
}

function addObstacle(x=1.2){ const gap=.29, center=.32+Math.random()*.32; obstacles.push({x,center,gap,passed:false,coin:true}); }
function tower(x,top,bottom){
  const px=x*W, width=Math.max(62,W*.065), brick='#e77a58', dark='#b74f43';
  const drawPart=(y,h,flip)=>{ctx.fillStyle='rgba(37,65,66,.18)';rr(px-width/2+8,y+10,width,h,8);ctx.fillStyle=brick;rr(px-width/2,y,width,h,7);ctx.fillStyle=dark;for(let j=0;j<h/34;j++){ctx.fillRect(px-width/2,y+j*34,width,3);for(let k=0;k<3;k++)ctx.fillRect(px-width/2+k*width/3+(j%2)*10,y+j*34,2,31)} let edge=flip?y+h-22:y;ctx.fillStyle='#f4a267';rr(px-width*.63,edge,width*1.26,24,5);ctx.fillStyle='#fcba77';ctx.fillRect(px-width*.57,edge+3,width*1.14,5);};
  if(top>0)drawPart(0,top,true); if(bottom<H)drawPart(bottom,H-bottom,false);
}
function drawCoin(x,y){ctx.save();ctx.translate(x,y);ctx.rotate(time*.003);ctx.fillStyle='#d99300';ctx.beginPath();ctx.ellipse(3,3,13,17,0,0,7);ctx.fill();ctx.fillStyle='#ffd52c';ctx.beginPath();ctx.ellipse(0,0,11,16,0,0,7);ctx.fill();ctx.fillStyle='#fff08a';ctx.fillRect(-3,-10,3,20);ctx.restore();}
function drawBird(){
  const x=bird.x*W,y=bird.y*H,s=Math.max(.72,Math.min(1.12,W/1200));ctx.save();ctx.translate(x,y);ctx.rotate(bird.tilt);
  // shadow and wing
  ctx.fillStyle='rgba(0,40,65,.2)';ctx.beginPath();ctx.ellipse(4,25,43*s,12*s,0,0,7);ctx.fill();
  ctx.fillStyle='#0878a6';ctx.beginPath();ctx.ellipse(-23*s,8*s,25*s,13*s,-.45,0,7);ctx.fill();
  ctx.fillStyle='#20b4d2';ctx.beginPath();ctx.ellipse(0,0,34*s,29*s,0,0,7);ctx.fill();
  ctx.fillStyle='#ffcf2c';ctx.beginPath();ctx.ellipse(3*s,9*s,25*s,18*s,0,0,7);ctx.fill();
  ctx.fillStyle='#ec593f';ctx.beginPath();ctx.moveTo(25*s,-4*s);ctx.lineTo(48*s,5*s);ctx.lineTo(25*s,13*s);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(15*s,-10*s,10*s,0,7);ctx.fill();ctx.fillStyle='#102a3b';ctx.beginPath();ctx.arc(19*s,-11*s,4*s,0,7);ctx.fill();
  ctx.fillStyle='#e83f4a';ctx.beginPath();ctx.arc(-10*s,-26*s,9*s,0,7);ctx.arc(0,-30*s,8*s,0,7);ctx.arc(9*s,-25*s,7*s,0,7);ctx.fill();ctx.restore();
}
function flap(){ if(state==='menu'||state==='over') return; bird.vy=-.0085; for(let i=0;i<6;i++)particles.push({x:bird.x*W-25,y:bird.y*H,vx:-2-Math.random()*2,vy:(Math.random()-.5)*2,a:1}); }
function start(){state='playing';score=coins=0;speed=4;bird={x:.43,y:.48,vy:0,tilt:0};obstacles=[];addObstacle(1.15);addObstacle(1.65);hero.classList.add('hidden');gameOver.classList.add('hidden');hud.classList.remove('hidden');scoreEl.textContent='0';coinsEl.textContent='0';}
function end(){state='over';hud.classList.add('hidden');gameOver.classList.remove('hidden');document.querySelector('#final-score').textContent=score;document.querySelector('#final-coins').textContent=coins;}
function update(){ if(state!=='playing')return; bird.vy+=.00048;bird.y+=bird.vy;bird.tilt=Math.max(-.4,Math.min(1,bird.vy*65)); speed=Math.min(8,4+score*.08);
  obstacles.forEach(o=>{o.x-=speed/W;let top=(o.center-o.gap/2)*H,bottom=(o.center+o.gap/2)*H;if(!o.passed&&o.x<bird.x){o.passed=true;score++;scoreEl.textContent=score;}if(o.coin&&Math.abs(o.x-bird.x)<.035&&Math.abs(bird.y-o.center)<.075){o.coin=false;coins++;coinsEl.textContent=coins;}if(Math.abs(o.x-bird.x)<.052&&(bird.y*H<top+18||bird.y*H>bottom-18))end();});
  if(obstacles[0]?.x<-.2)obstacles.shift();if(obstacles.at(-1)?.x<.78)addObstacle(obstacles.at(-1).x+.5);if(bird.y<.02||bird.y>.98)end();document.querySelector('#progress').style.width=`${Math.min(100,score*4)}%`;
}
function render(t){time=t;update();drawBackground();obstacles.forEach(o=>{let top=(o.center-o.gap/2)*H,bottom=(o.center+o.gap/2)*H;tower(o.x,top,bottom);if(o.coin)drawCoin(o.x*W,o.center*H)});particles=particles.filter(p=>p.a>.02);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.a*=.93;ctx.globalAlpha=p.a;ctx.fillStyle='white';ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill();ctx.globalAlpha=1});drawBird();requestAnimationFrame(render)}requestAnimationFrame(render);
document.querySelector('#start').onclick=start;document.querySelector('#restart').onclick=start;addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(state==='menu')start();else if(state==='over')start();else flap()}});canvas.addEventListener('pointerdown',flap);
document.querySelector('#fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
document.querySelector('#sound').onclick=e=>{e.currentTarget.textContent=e.currentTarget.textContent==='♪'?'×':'♪'};
document.querySelector('[data-action="play"]').onclick=()=>state==='playing'?flap():start();
const about=document.querySelector('#about-panel');document.querySelector('[data-action="about"]').onclick=()=>about.classList.remove('hidden');document.querySelector('#close-about').onclick=()=>about.classList.add('hidden');
