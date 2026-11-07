// Browser-side projected geometry, including conservative paint envelopes.
export function inspectInterface() {
  const panel=document.querySelector('#project-interface');
  const scene=panel.querySelector('.study-scene'), world=panel.querySelector('.study-world');
  const rect=el=>el.getBoundingClientRect().toJSON();
  const s=scene.getBoundingClientRect(), w=world.getBoundingClientRect();
  const ws=getComputedStyle(world), ss=getComputedStyle(scene);
  const W=parseFloat(ws.width), H=parseFloat(ws.height), unit=s.width/100;
  const matrix=new DOMMatrix(ws.transform), perspective=parseFloat(ss.perspective);
  const project=(x,y,z)=>{
    const p=matrix.transformPoint(new DOMPoint(x-W/2,y-H/2,z));
    const factor=1/(1-p.z/perspective);
    return {x:s.left+s.width/2+(W/2+p.x)*factor,y:s.top+s.height/2+(s.height*.13+H/2+p.y)*factor};
  };
  const planes=[...panel.querySelectorAll('.study-plane')].map(el=>{
    const style=getComputedStyle(el), m=new DOMMatrix(style.transform==='none'?undefined:style.transform);
    // CSS blur has no hard boundary. One blur radius (2 sigma) bounds
    // the 12%-alpha shadow to below one 8-bit alpha step at the tail.
    const frame=el.classList.contains('study-frame'), info=el.classList.contains('study-information');
    const pad=frame?3*unit:info?1:1;
    const bottom=frame?5.4*unit:info?.8*unit+1:1;
    const x=el.offsetLeft,y=el.offsetTop,ew=el.offsetWidth,eh=el.offsetHeight;
    const corners=[[-pad,-pad],[ew+pad,-pad],[ew+pad,eh+bottom],[-pad,eh+bottom]].map(([a,b])=>project(x+a,y+b,m.m43));
    const raw=[[0,0],[ew,0],[ew,eh],[0,eh]].map(([a,b])=>project(x+a,y+b,m.m43));
    const projected={left:Math.min(...raw.map(p=>p.x)),right:Math.max(...raw.map(p=>p.x)),top:Math.min(...raw.map(p=>p.y)),bottom:Math.max(...raw.map(p=>p.y))};
    return {class:el.className,rect:rect(el),projected,envelope:{left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))},transform:style.transform,transition:style.transitionDuration,animation:style.animationName,shadow:style.boxShadow};
  });
  return {scene:rect(scene),panel:rect(panel),copy:rect(panel.querySelector('.project-copy')),focus:rect(panel.querySelector('.project-permalink')),caption:rect(panel.querySelector('figcaption')),figure:rect(panel.querySelector('figure')),planes,tethers:[...panel.querySelectorAll('.study-tether')].map(rect),world:{rect:w,transform:ws.transform,transition:ws.transitionDuration,animation:ws.animationName},overflow:document.documentElement.scrollWidth>innerWidth,nested:[panel,scene,world,panel.querySelector('figure')].some(el=>/auto|scroll/.test(getComputedStyle(el).overflowY))};
}
