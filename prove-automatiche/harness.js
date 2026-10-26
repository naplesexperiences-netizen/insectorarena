// Stub DOM minimale per far girare la logica di gioco in node
const noop = () => {};
function el(){
  const e = {
    innerHTML:"", textContent:"", className:"", offsetWidth:0, disabled:false,
    dataset:{}, style:{ setProperty:noop, removeProperty:noop },
    classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false },
    appendChild:noop, remove:noop, scrollTop:0, scrollHeight:0,
    setAttribute:noop, getAttribute:()=>null, removeAttribute:noop, focus:noop, hidden:false,
    querySelector:()=>el(), querySelectorAll:()=>[],
    addEventListener:noop, removeEventListener:noop, dispatchEvent:noop,
    getBoundingClientRect:()=>({ x:0, y:0, width:0, height:0, top:0, left:0, right:0, bottom:0 }),
    closest:()=>null, contains:()=>false, insertAdjacentHTML:noop, scrollIntoView:noop,
    scrollWidth:0, clientWidth:0, clientHeight:0, offsetHeight:0, value:"", checked:false,
    onclick:null, set onmouseenter(v){}, set onfocus(v){}
  };
  return e;
}
global.document = { querySelector:()=>el(), querySelectorAll:()=>[], createElement:()=>el(),
  getElementById:()=>el(), addEventListener:noop, removeEventListener:noop, body:el(), activeElement:null };
global.window = { scrollTo:noop, innerWidth:1280, innerHeight:800,
  addEventListener:noop, removeEventListener:noop, matchMedia:()=>({ matches:false,
    addEventListener:noop, addListener:noop }) };
global.innerWidth = 1280; global.innerHeight = 800;
global.getComputedStyle = () => ({ getPropertyValue:()=>"" });
global.localStorage = { getItem:()=>null, setItem:noop, removeItem:noop, clear:noop };
global.requestAnimationFrame = noop;
global.setTimeout = noop;
global.addEventListener = noop;
global.removeEventListener = noop;
global.navigator = { sendBeacon: noop, userAgent: "node", language: "it" };
global.matchMedia = () => ({ matches:false, addEventListener:noop, addListener:noop });
global.fetch = () => Promise.resolve({ ok:true });
global.AudioContext = function(){ return { state:"suspended", resume:noop, close:noop }; };
