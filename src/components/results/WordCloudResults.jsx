import React from 'react'
import { PALETTE_BARS, FONT_DISPLAY } from '../../theme.js'
import { EmptyState } from '../ui/EmptyState.jsx'

export function WordCloudResults({list}){
  if (!list.length) return <EmptyState text="Waiting for the first word to land…"/>
  const freq={}
  list.forEach(w=>{const k=w.toLowerCase();freq[k]=(freq[k]||0)+1})
  const entries=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,40)
  const max=Math.max(...entries.map(e=>e[1]))
  return(
    <div style={{display:'flex',flexWrap:'wrap',gap:'10px 16px',justifyContent:'center',padding:'10px 0'}}>
      {entries.map(([word,count],i)=>(
        <span key={word} style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14+(count/max)*28,color:PALETTE_BARS[i%PALETTE_BARS.length],animation:'fadeUp .4s ease',lineHeight:1}}>{word}</span>
      ))}
    </div>
  )
}
