import {describe,it,expect} from 'vitest'
import {createBubbleEmitter} from './orb-bubbles-engine'
describe('directional citrus bubbles',()=>{
 it('emits only on fast orb movement and keeps a bounded pool',()=>{
  const e=createBubbleEmitter(()=>.5)
  e.move(900,300,0,true);e.move(895,300,50,true);expect(e.particles).toHaveLength(0)
  e.move(815,290,80,true);expect(e.particles).toHaveLength(5)
  expect(e.particles.every(p=>p.vx<0&&p.vy<0)).toBe(true)
  for(let i=1;i<100;i++)e.move(815-i*80,290,80+i*80,true)
  expect(e.particles.length).toBeLessThanOrEqual(28)
  e.clear();e.move(900,300,10000,false);e.move(600,300,10050,false);expect(e.particles).toHaveLength(0)
 })
 it('dissolves on the headline and also expires without hitting text',()=>{
  for(const letters of [[],[{left:490,right:700,top:250,bottom:350}]]){
   const e=createBubbleEmitter(()=>.5)
   e.move(900,300,0,true);e.move(820,300,50,true);expect(e.particles).toHaveLength(5)
   for(let t=66;t<(letters.length?1000:3000);t+=16)e.tick(t,letters)
   expect(e.particles).toHaveLength(0)
  }
 })
 it('emits when leaving fast, but clearing removes the previous gesture',()=>{
  const e=createBubbleEmitter(()=>.5)
  e.move(900,300,0,true);e.move(700,300,50,false);expect(e.particles).toHaveLength(5)
  e.clear();e.move(500,300,100,true);expect(e.particles).toHaveLength(0)
 })
})
