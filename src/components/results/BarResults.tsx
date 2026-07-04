import { C, PALETTE_BARS, FONT_DISPLAY } from '../../theme.ts'
import type { ChoiceSlide } from '../../types.ts'

interface BarResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
}

export function BarResults({slide,list}: BarResultsProps){
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const max=Math.max(1,...counts),total=list.length
  return(
    <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',gap:12}}>
      {slide.options.map((opt,i)=>{
        const c=counts[i],pct=total?Math.round((c/total)*100):0
        const img=(slide.optionImages||[])[i]||null
        const color=PALETTE_BARS[i%PALETTE_BARS.length]
        const isLeading=c>0&&c===max
        return(
          <div key={i} style={{flex:1,minHeight:48,display:'flex',gap:12,alignItems:'center'}}>
            {img&&(
              <div style={{width:44,height:44,borderRadius:'50%',flexShrink:0,border:`2.5px solid ${color}`,overflow:'hidden'}}>
                <img src={img} alt={opt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </div>
            )}
            <div style={{flex:1,height:'100%',position:'relative',borderRadius:4,background:`${color}16`,
              border:`2px solid ${isLeading?color:`${color}45`}`,overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,width:`${(c/max)*100}%`,background:`${color}30`,
                transition:'width .6s cubic-bezier(.22,1,.36,1)'}}/>
              <div style={{position:'relative',height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px'}}>
                <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:16,color:C.txt1}}>{opt}</span>
                <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,color:C.txt2,flexShrink:0}}>{c} · {pct}%</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
