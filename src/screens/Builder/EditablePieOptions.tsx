import { useEffect, useState } from 'react'
import { C, PALETTE_BARS } from '../../theme.ts'
import { EditableChartLegend } from './EditableChartLegend.tsx'

const R=90, CX=100, CY=100

interface EditablePieOptionsProps {
  slide: { options: string[] }
  list: (string | number)[]
  readOnly?: boolean
  onUpdateOption?: (oi: number, val: string) => void
  onRemoveOption?: (oi: number) => void
  onAddOption?: () => void
}

export function EditablePieOptions({slide,list,readOnly,onUpdateOption,onRemoveOption,onAddOption}: EditablePieOptionsProps){
  const [mounted,setMounted]=useState(false)
  useEffect(() => {
    const t=requestAnimationFrame(()=>setMounted(true))
    return ()=>cancelAnimationFrame(t)
  }, [])
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  let cumulative=0
  const wedges=total ? slide.options.map((_,i)=>{
    const c=counts[i], frac=c/total
    const startAngle=cumulative*2*Math.PI
    const endAngle=(cumulative+frac)*2*Math.PI
    cumulative+=frac
    const color=PALETTE_BARS[i%PALETTE_BARS.length]
    // Same 100%-wedge SVG footgun as PieResults.tsx — render a plain circle
    // instead of a degenerate full-sweep arc path.
    if (frac>=0.9999) return {i,color,full:true}
    const x1=CX+R*Math.cos(startAngle), y1=CY+R*Math.sin(startAngle)
    const x2=CX+R*Math.cos(endAngle),   y2=CY+R*Math.sin(endAngle)
    const largeArcFlag=(endAngle-startAngle)>Math.PI ? 1 : 0
    const path=`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    return {i,color,full:false,path}
  }) : []

  const chart=(
    <svg width={320} height={320} viewBox="0 0 200 200" style={{flexShrink:0}}>
      {total ? (
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {wedges.map(w=>{
            const style={opacity:mounted?1:0,transition:`opacity .5s ease ${w.i*90}ms`}
            return w.full
              ? <circle key={w.i} cx={CX} cy={CY} r={R} fill={w.color} style={style}/>
              : <path key={w.i} d={w.path} fill={w.color} style={style}/>
          })}
        </g>
      ) : (
        <circle cx={CX} cy={CY} r={R} fill={C.border}/>
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
