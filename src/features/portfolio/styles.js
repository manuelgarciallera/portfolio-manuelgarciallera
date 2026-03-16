export const PORTFOLIO_CSS = `
.p *{box-sizing:border-box;margin:0;padding:0;}
.p{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif;}
.p ::-webkit-scrollbar{width:4px;}
.p ::-webkit-scrollbar-thumb{background:rgba(128,128,128,.2);border-radius:2px;}

/* Gradients */
/* Dark bg: white -> teal light */
.acc-dk{background:linear-gradient(90deg,#d7efe9 0%,#cbe8e2 18%,#87b5bd 57%,#4b6d85 100%);background-repeat:no-repeat;background-size:100% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;-webkit-box-decoration-break:clone;box-decoration-break:clone;}
/* Light bg: near-black -> teal dark (readable, professional) */
.acc-lt{background:linear-gradient(90deg,#d3ebe6 0%,#bfe2dc 18%,#7eaeb8 57%,#456985 100%);background-repeat:no-repeat;background-size:100% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;-webkit-box-decoration-break:clone;box-decoration-break:clone;}

/* Scroll reveals */
.rv{opacity:0;transform:translateY(80px);transition:opacity 1.4s cubic-bezier(.16,1,.3,1),transform 1.4s cubic-bezier(.16,1,.3,1);will-change:transform,opacity;}
.rv.in{opacity:1;transform:translateY(0);}
.rv2{opacity:0;transform:translateY(52px);transition:opacity 1.1s cubic-bezier(.16,1,.3,1),transform 1.1s cubic-bezier(.16,1,.3,1);}
.rv2.in{opacity:1;transform:translateY(0);}
.rs{opacity:0;transform:scale(.93) translateY(36px);transition:opacity 1.25s cubic-bezier(.16,1,.3,1),transform 1.25s cubic-bezier(.16,1,.3,1);}
.rs.in{opacity:1;transform:scale(1) translateY(0);}
.rl{opacity:0;transform:translateX(-56px);transition:opacity 1.2s cubic-bezier(.16,1,.3,1),transform 1.2s cubic-bezier(.16,1,.3,1);}
.rl.in{opacity:1;transform:translateX(0);}
.rr{opacity:0;transform:translateX(56px);transition:opacity 1.2s cubic-bezier(.16,1,.3,1),transform 1.2s cubic-bezier(.16,1,.3,1);}
.rr.in{opacity:1;transform:translateX(0);}
/* Clip reveal: title emerges upward */
.clip-rv{clip-path:inset(0 0 110% 0);transition:clip-path 1.15s cubic-bezier(.16,1,.3,1);}
.clip-rv.in{clip-path:inset(0 0 0% 0);}

/* Title reveal (down/up) */
.ttl-rv{
  opacity:0;
  transform:translate3d(0,42px,0) scale(.988);
  filter:blur(7px);
  transition:opacity .72s cubic-bezier(.22,.61,.36,1),transform .82s cubic-bezier(.22,.61,.36,1),filter .82s cubic-bezier(.22,.61,.36,1);
  will-change:transform,opacity,filter;
}
.ttl-rv[data-reveal-dir="up"]{transform:translate3d(0,-34px,0) scale(.988);}
.ttl-rv[data-reveal-dir="down"]{transform:translate3d(0,42px,0) scale(.988);}
.ttl-rv.in{opacity:1;transform:translate3d(0,0,0) scale(1);filter:blur(0);}

/* Navbar: Apple-like behavior */
.nl{
  text-decoration:none;font-size:13.5px;font-weight:400;letter-spacing:-.01em;
  display:flex;align-items:center;height:100%;position:relative;
  padding:0;margin-right:24px;cursor:pointer;
  /* Quick hover */
  transition:color .1s ease;
}
.nl .nl-bar{
  position:absolute;bottom:0;left:0;right:0;height:2.5px;border-radius:1px;
  transform:scaleX(0);transition:transform .2s cubic-bezier(.16,1,.3,1);transform-origin:left;
}
.nl.active .nl-bar{transform:scaleX(1);}

/* Dark mode nav */
.nl-dk{color:#6e6e73;}
.nl-dk.active{color:#fff!important;font-weight:600;}
.nl-dk:not(.active):hover{color:rgba(255,255,255,.85)!important;}

/* Light mode nav: active = dark, hover = dark blue */
.nl-lt{color:#6e6e73;}
.nl-lt.active{color:#1d1d1f!important;font-weight:600;}
.nl-lt:not(.active):hover{color:#0d2a4a!important;}

/* Buttons: clean pills */
.btn-blue{
  background:#0071e3;color:#fff;border:none;padding:13px 28px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;letter-spacing:-.015em;
  transition:background .15s,transform .15s,box-shadow .15s;
}
.btn-blue:hover{background:#0077ed;transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,113,227,.32);}
.btn-blue:active{transform:translateY(0);}

.btn-dk{
  background:#2c2c2e;color:#f5f5f7;border:none;padding:13px 28px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;letter-spacing:-.015em;
  transition:background .15s,transform .15s,box-shadow .15s;
}
.btn-dk:hover{background:#3a3a3c;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.28);}

.btn-lt{
  background:#e8e8ed;color:#1d1d1f;border:none;padding:13px 28px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;letter-spacing:-.015em;
  transition:background .15s,transform .15s;
}
.btn-lt:hover{background:#d2d2d7;transform:translateY(-2px);}

/* Ghost buttons: visible on any background */
.btn-ghost-dk{
  background:transparent;color:#f5f5f7;
  border:1.5px solid rgba(255,255,255,.32);
  padding:12px 27px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:400;cursor:pointer;letter-spacing:-.015em;
  transition:border-color .15s,background .15s,transform .15s;
}
.btn-ghost-dk:hover{border-color:rgba(255,255,255,.58);background:rgba(255,255,255,.08);transform:translateY(-2px);}

.btn-ghost-lt{
  background:transparent;color:#1d1d1f;
  border:1.5px solid rgba(0,0,0,.25);
  padding:12px 27px;border-radius:980px;
  font-family:inherit;font-size:15px;font-weight:400;cursor:pointer;letter-spacing:-.015em;
  transition:border-color .15s,background .15s,transform .15s;
}
.btn-ghost-lt:hover{border-color:rgba(0,0,0,.45);background:rgba(0,0,0,.05);transform:translateY(-2px);}

/* Social buttons: always visible pill with icon */
.btn-social{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,.1);color:#f5f5f7;
  border:1.5px solid rgba(255,255,255,.2);
  padding:10px 20px;border-radius:980px;
  font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;letter-spacing:-.01em;
  transition:background .15s,border-color .15s,transform .15s;
}
.btn-social:hover{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.4);transform:translateY(-2px);}
.btn-social-lt{
  background:rgba(0,0,0,.06);color:#1d1d1f;
  border-color:rgba(0,0,0,.2);
}
.btn-social-lt:hover{background:rgba(0,0,0,.1);border-color:rgba(0,0,0,.35);}

/* Tabs */
.tab-row{display:flex;border-bottom:1.5px solid rgba(255,255,255,.08);}
.tab-row-lt{border-bottom-color:rgba(0,0,0,.1);}
.tab-btn{background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:14px;
  font-weight:400;letter-spacing:-.01em;padding:13px 0;margin-right:28px;position:relative;transition:color .1s;}
.tab-btn::after{content:'';position:absolute;bottom:-1.5px;left:0;right:0;height:2.5px;border-radius:1px;transform:scaleX(0);transition:transform .25s cubic-bezier(.16,1,.3,1);}
.tab-dk-a{color:#fff!important;font-weight:500;}
.tab-dk-a::after{transform:scaleX(1)!important;background:#fff!important;}
.tab-lt-a{color:#1d1d1f!important;font-weight:500;}
.tab-lt-a::after{transform:scaleX(1)!important;background:#1d1d1f!important;}

/* Cards */
.card-dk{background:#1c1c1e;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:transform .55s cubic-bezier(.16,1,.3,1),box-shadow .55s;}
.card-dk:hover{transform:translateY(-10px);box-shadow:0 34px 68px rgba(0,0,0,.6);}
.card-lt{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.07),0 0 0 1px rgba(0,0,0,.04);cursor:pointer;transition:transform .55s cubic-bezier(.16,1,.3,1),box-shadow .55s;}
.card-lt:hover{transform:translateY(-10px);box-shadow:0 28px 56px rgba(0,0,0,.13),0 0 0 1px rgba(0,0,0,.04);}

/* Comparison */
.comp-knob{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 18px rgba(0,0,0,.38);}

.sec-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;}
.sec-canvas-interactive{position:absolute;inset:0;width:100%;height:100%;pointer-events:auto;z-index:0;}

@keyframes ppulse{0%,100%{opacity:.5;transform:scale(1);}50%{opacity:1;transform:scale(1.12);}}
@keyframes pscroll{0%,100%{transform:translateY(0);}60%{transform:translateY(10px);}}
@keyframes pfade{from{opacity:0;transform:translateY(-12px);}to{opacity:1;transform:translateY(0);}}
@keyframes heroProgFill{from{width:0%;}to{width:100%;}}
@keyframes nearPop{
  0%{opacity:0;transform:translateY(0) scaleX(.36) scaleY(.22);filter:blur(6px);border-radius:999px;}
  64%{opacity:1;transform:translateY(0) scaleX(1.04) scaleY(1.03);filter:blur(0);border-radius:22px;}
  100%{opacity:1;transform:translateY(0) scaleX(1) scaleY(1);filter:blur(0);border-radius:18px;}
}
@keyframes nearBubbleOpen{
  0%{transform:scaleX(.92) scaleY(.78);filter:blur(2px);}
  62%{transform:scaleX(1.02) scaleY(1.035);filter:blur(0);}
  100%{transform:scaleX(1) scaleY(1);filter:blur(0);}
}
@keyframes nearTextRise{
  0%{opacity:0;transform:translateY(9px) scale(.985);}
  100%{opacity:1;transform:translateY(0) scale(1);}
}
@keyframes nearMediaIn{from{opacity:.2;transform:scale(1.08) rotate(-1.1deg);}to{opacity:1;transform:scale(1) rotate(0deg);}}
@keyframes nearChipPulse{0%{transform:scale(1);}52%{transform:scale(1.055);}100%{transform:scale(1);}}
@media(prefers-reduced-motion:reduce){.ttl-rv{opacity:1!important;transform:none!important;filter:none!important;transition:none!important;}}
@media(max-width:700px){.hide-m{display:none!important;}}
`;
