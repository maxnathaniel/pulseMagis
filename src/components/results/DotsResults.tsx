import { C, PALETTE_BARS, FONT_DISPLAY } from '../../theme.ts'
import { HoneycombDots, DOTS_MAX_PER_OPTION } from '../ui/HoneycombDots.tsx'
import type { ChoiceSlide } from '../../types.ts'

interface DotsResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
}

export function DotsResults({slide,list}: DotsResultsProps){
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  return(
    <div style={{flex:1,minHeight:0,overflowY:'auto',display:'flex',flexDirection:'column',gap:12,justifyContent:'center'}}>
      {slide.options.map((opt,i)=>{
        const c=counts[i], pct=total?Math.round((c/total)*100):0
        const color=PALETTE_BARS[i%PALETTE_BARS.length]
        const overflow=c-DOTS_MAX_PER_OPTION
        return(
          <div key={i} style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
              <HoneycombDots count={c} color={color}/>
              {overflow>0&&(
                <span style={{fontSize:11,fontWeight:500,color:C.txt3}}>+{overflow}</span>
              )}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:0}}>
              <span style={{fontFamily:FONT_DISPLAY,fontWeight:500,fontSize:20,color:C.txt1}}>{opt}</span>
              <span style={{fontSize:12,fontWeight:500,color:C.txt3}}>{c} · {pct}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
