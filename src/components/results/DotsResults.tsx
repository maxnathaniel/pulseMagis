import { C, PALETTE_BARS, FONT_DISPLAY } from '../../theme.ts'
import { EmptyState } from '../ui/EmptyState.tsx'
import type { ChoiceSlide } from '../../types.ts'

const DOTS_MAX_PER_OPTION=60

interface DotsResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
}

export function DotsResults({slide,list}: DotsResultsProps){
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  if (!total) return <EmptyState text="No responses yet"/>

  return(
    <div style={{flex:1,minHeight:0,overflowY:'auto',display:'flex',flexDirection:'column',gap:20}}>
      {slide.options.map((opt,i)=>{
        const c=counts[i], pct=Math.round((c/total)*100)
        const color=PALETTE_BARS[i%PALETTE_BARS.length]
        const shown=Math.min(c,DOTS_MAX_PER_OPTION)
        const overflow=c-shown
        return(
          <div key={i}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
              <span style={{flex:1,fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,color:C.txt1}}>{opt}</span>
              <span style={{fontSize:12,fontWeight:700,color:C.txt3}}>{c} · {pct}%</span>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,maxWidth:260}}>
              {Array.from({length:shown}).map((_,d)=>(
                <span key={d} style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
              ))}
              {overflow>0&&(
                <span style={{fontSize:11,fontWeight:700,color:C.txt3,alignSelf:'center',marginLeft:4}}>+{overflow}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
