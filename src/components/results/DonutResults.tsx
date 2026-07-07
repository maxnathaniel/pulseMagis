import { useEffect, useState } from 'react'
import { C, PALETTE_BARS, FONT_DISPLAY } from '../../theme.ts'
import { ChartLegend } from './ChartLegend.tsx'
import type { ChoiceSlide } from '../../types.ts'

const R=70, CX=100, CY=100
const CIRCUMFERENCE=2*Math.PI*R

interface DonutResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
}

export function DonutResults({slide,list}: DonutResultsProps){
  // Starts each fresh mount with every ring segment collapsed to zero
  // length, then grows to its real share on the next frame — so a newly
  // presented or just-revealed slide sweeps the ring in instead of showing
  // it already complete.
  const [mounted,setMounted]=useState(false)
  useEffect(() => {
    const t=requestAnimationFrame(()=>setMounted(true))
    return ()=>cancelAnimationFrame(t)
  }, [])
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  if (!total) {
    // Zero responses still needs the option legend and center total on
    // screen — just with every count pinned at zero — so the chosen format
    // reads correctly whether that's because the poll is genuinely empty or
    // because responses are hidden (private mode always forces an empty
    // list here).
    return(
      <div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',gap:20}}>
        <svg width={320} height={320} viewBox="0 0 200 200" style={{flexShrink:0}}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.border} strokeWidth={28}/>
          <text x={CX} y={CY-4} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={28} fill={C.txt1}>{total}</text>
          <text x={CX} y={CY+18} textAnchor="middle" fontWeight={700} fontSize={12} fill={C.txt3}>response{total!==1?'s':''}</text>
        </svg>
        <div style={{minWidth:0}}>
          <ChartLegend options={slide.options} counts={counts} total={total}/>
        </div>
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
    <div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',gap:20}}>
      <svg width={320} height={320} viewBox="0 0 200 200" style={{flexShrink:0}}>
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {segments.map(seg=>(
            <circle key={seg.i} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color}
              strokeWidth={28} strokeDasharray={mounted?`${seg.dash} ${seg.gap}`:`0 ${CIRCUMFERENCE}`}
              strokeDashoffset={seg.offset} strokeLinecap="butt"
              style={{transition:`stroke-dasharray .8s cubic-bezier(.22,1,.36,1) ${seg.i*90}ms`}}/>
          ))}
        </g>
        <text x={CX} y={CY-4} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={28} fill={C.txt1}>{total}</text>
        <text x={CX} y={CY+18} textAnchor="middle" fontWeight={700} fontSize={12} fill={C.txt3}>response{total!==1?'s':''}</text>
      </svg>
      <div style={{minWidth:0}}>
        <ChartLegend options={slide.options} counts={counts} total={total}/>
      </div>
    </div>
  )
}
