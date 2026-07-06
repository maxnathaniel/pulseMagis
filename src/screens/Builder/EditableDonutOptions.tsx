import { useEffect, useState } from 'react'
import { C, PALETTE_BARS } from '../../theme.ts'
import { EditableChartLegend } from './EditableChartLegend.tsx'

const R=70, CX=100, CY=100
const CIRCUMFERENCE=2*Math.PI*R

interface EditableDonutOptionsProps {
  slide: { options: string[] }
  list: (string | number)[]
  readOnly?: boolean
  onUpdateOption?: (oi: number, val: string) => void
  onRemoveOption?: (oi: number) => void
  onAddOption?: () => void
}

export function EditableDonutOptions({slide,list,readOnly,onUpdateOption,onRemoveOption,onAddOption}: EditableDonutOptionsProps){
  const [mounted,setMounted]=useState(false)
  useEffect(() => {
    const t=requestAnimationFrame(()=>setMounted(true))
    return ()=>cancelAnimationFrame(t)
  }, [])
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  let cumulative=0
  const segments=total ? slide.options.map((_,i)=>{
    const c=counts[i], frac=c/total
    const dash=frac*CIRCUMFERENCE, gap=CIRCUMFERENCE-dash
    const offset=-cumulative*CIRCUMFERENCE
    cumulative+=frac
    return {i,dash,gap,offset,color:PALETTE_BARS[i%PALETTE_BARS.length]}
  }) : []

  const chart=(
    <svg width={320} height={320} viewBox="0 0 200 200" style={{flexShrink:0}}>
      {total ? (
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {segments.map(seg=>(
            <circle key={seg.i} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color}
              strokeWidth={28} strokeDasharray={mounted?`${seg.dash} ${seg.gap}`:`0 ${CIRCUMFERENCE}`}
              strokeDashoffset={seg.offset} strokeLinecap="butt"
              style={{transition:`stroke-dasharray .8s cubic-bezier(.22,1,.36,1) ${seg.i*90}ms`}}/>
          ))}
        </g>
      ) : (
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.border} strokeWidth={28}/>
      )}
    </svg>
  )

  if (readOnly) return <div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',justifyContent:'center'}}>{chart}</div>

  return(
    <div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',gap:32}}>
      {chart}
      <div style={{flex:1,minWidth:0}}>
        <EditableChartLegend options={slide.options} counts={counts} total={total}
          onUpdateOption={onUpdateOption!} onRemoveOption={onRemoveOption!} onAddOption={onAddOption!}/>
      </div>
    </div>
  )
}
