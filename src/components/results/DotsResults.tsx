import { C, PALETTE_BARS, FONT_DISPLAY } from '../../theme.ts'
import { EmptyState } from '../ui/EmptyState.tsx'
import { HoneycombDots, DOTS_MAX_PER_OPTION } from '../ui/HoneycombDots.tsx'
import type { ChoiceSlide } from '../../types.ts'

interface DotsResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
  hideEmptyLabel?: boolean
}

export function DotsResults({slide,list,hideEmptyLabel}: DotsResultsProps){
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  if (!total) return hideEmptyLabel ? null : <EmptyState text="No responses yet"/>

  return(
    <div style={{flex:1,minHeight:0,overflowY:'auto',display:'flex',flexDirection:'column',gap:20}}>
      {slide.options.map((opt,i)=>{
        const c=counts[i], pct=Math.round((c/total)*100)
        const color=PALETTE_BARS[i%PALETTE_BARS.length]
        const overflow=c-DOTS_MAX_PER_OPTION
        return(
          <div key={i}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
              <span style={{flex:1,fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,color:C.txt1}}>{opt}</span>
              <span style={{fontSize:12,fontWeight:700,color:C.txt3}}>{c} · {pct}%</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <HoneycombDots count={c} color={color}/>
              {overflow>0&&(
                <span style={{fontSize:11,fontWeight:700,color:C.txt3}}>+{overflow}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
