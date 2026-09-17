import test from 'node:test'
import assert from 'node:assert/strict'
import {createEmitter} from './bubbles.mjs'
test('fast movement sends a bounded burst in gesture direction, slow and outside movements do not',()=>{
 const e=createEmitter(()=>.5)
 e.move(900,300,0,true);e.move(895,300,50,true)
 assert.equal(e.particles.length,0)
 e.move(815,290,80,true)
 assert.equal(e.particles.length,5)
 assert.ok(e.particles.every(p=>p.vx<0&&p.vy<0))
 for(let i=1;i<100;i++)e.move(815-i*80,290,80+i*80,true)
 assert.ok(e.particles.length<=28)
 e.clear();e.move(900,300,10000,false);e.move(600,300,10050,false)
 assert.equal(e.particles.length,0)
})
test('bubbles reach headline, dissolve there and release their storage',()=>{
 const e=createEmitter(()=>.5)
 e.move(900,300,0,true);e.move(820,300,50,true)
 assert.equal(e.particles.length,5)
 for(let t=66;t<1000;t+=16)e.tick(t,[{left:490,right:700,top:250,bottom:350}])
 assert.equal(e.particles.length,0,'headline contact shortens lifetime')
})
test('leaving the orb quickly still emits, clearing disables lingering movement',()=>{
 const e=createEmitter(()=>.5)
 e.move(900,300,0,true);e.move(700,300,50,false)
 assert.equal(e.particles.length,5)
 e.clear();assert.equal(e.particles.length,0)
 e.move(500,300,100,true);assert.equal(e.particles.length,0)
})
