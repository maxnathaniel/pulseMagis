import { C, PALETTE_BARS, FONT_DISPLAY } from '../../theme.ts'
import { ChartLegend } from './ChartLegend.tsx'
import { EmptyState } from '../ui/EmptyState.tsx'
import type { ChoiceSlide } from '../../types.ts'

const R=70, CX=100, CY=100
const CIRCUMFERENCE=2*Math.PI*R

interface DonutResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
}

export function DonutResults({slide,list}: DonutResultsProps){
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  if (!total) {
    return(
      <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
        <svg width={320} height={320} viewBox="0 0 200 200">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.border} strokeWidth={28}/>
        </svg>
        <EmptyState text="No responses yet"/>
      </div>
    )
  }

  let cumulative=0
  const segments=slide.options.map((opt,i)=>{
    const c=counts[i], frac=c/total
    const dash=frac*CIRCUMFERENCE, gap=CIRCUMFERENCE-dash
    const offset=-cumulative*CIRCUMFERENCE
    cumulative+=frac
    return {opt,i,c,dash,gap,offset,color:PALETTE_BARS[i%PALETTE_BARS.length]}
  })

  return(
    <div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',gap:32}}>
      <svg width={320} height={320} viewBox="0 0 200 200" style={{flexShrink:0}}>
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {segments.map(seg=>(
            <circle key={seg.i} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color}
              strokeWidth={28} strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={seg.offset} strokeLinecap="butt"/>
          ))}
        </g>
        <text x={CX} y={CY-4} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={28} fill={C.txt1}>{total}</text>
        <text x={CX} y={CY+18} textAnchor="middle" fontWeight={700} fontSize={12} fill={C.txt3}>response{total!==1?'s':''}</text>
      </svg>
      <div style={{flex:1,minWidth:0}}>
        <ChartLegend options={slide.options} counts={counts} total={total}/>
      </div>
    </div>
  )
}
