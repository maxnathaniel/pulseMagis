import { useEffect, useState } from 'react'
import { C, PALETTE_BARS, FONT_DISPLAY } from '../../theme.ts'
import type { ChoiceSlide } from '../../types.ts'

interface BarResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
}

export function BarResults({slide,list}: BarResultsProps){
  // Starts every fresh mount (a newly presented or just-revealed slide) at
  // 0 height, then grows to the real value on the next frame so the bars
  // always visibly rise into place instead of appearing already full.
  const [mounted,setMounted]=useState(false)
  useEffect(() => {
    const t=requestAnimationFrame(()=>setMounted(true))
    return ()=>cancelAnimationFrame(t)
  }, [])
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const max=Math.max(1,...counts),total=list.length
  return(
    <div style={{flex:1,minHeight:0,display:'flex',alignItems:'flex-end',gap:16}}>
      {slide.options.map((opt,i)=>{
        const c=counts[i],pct=total?Math.round((c/total)*100):0
        const img=(slide.optionImages||[])[i]||null
        const color=PALETTE_BARS[i%PALETTE_BARS.length]
        const isLeading=c>0&&c===max
        return(
          <div key={i} style={{flex:1,minWidth:0,height:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,color:C.txt2,flexShrink:0}}>{c} · {pct}%</span>
            <div style={{flex:1,width:'100%',borderRadius:4,background:`${color}16`,display:'flex',alignItems:'flex-end'}}>
              <div style={{width:'100%',height:mounted?`${(c/max)*100}%`:'0%',background:`${color}30`,borderRadius:4,
                border:c>0?`2px solid ${isLeading?color:`${color}45`}`:'none',boxSizing:'border-box',
                transition:`height .6s cubic-bezier(.22,1,.36,1) ${i*70}ms`}}/>
            </div>
            {img&&(
              <div style={{width:44,height:44,borderRadius:'50%',flexShrink:0,border:`2.5px solid ${color}`,overflow:'hidden'}}>
                <img src={img} alt={opt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </div>
            )}
            <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:16,color:C.txt1,textAlign:'center'}}>{opt}</span>
          </div>
        )
      })}
    </div>
  )
}
