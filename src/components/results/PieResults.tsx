import { C, PALETTE_BARS } from '../../theme.ts'
import { ChartLegend } from './ChartLegend.tsx'
import { EmptyState } from '../ui/EmptyState.tsx'
import type { ChoiceSlide } from '../../types.ts'

const R=90, CX=100, CY=100

interface PieResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
  hideEmptyLabel?: boolean
}

export function PieResults({slide,list,hideEmptyLabel}: PieResultsProps){
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  if (!total) {
    const emptyCircle=<svg width={320} height={320} viewBox="0 0 200 200" style={hideEmptyLabel?{flexShrink:0}:undefined}>
      <circle cx={CX} cy={CY} r={R} fill={C.border}/>
    </svg>
    // Private mode still needs the option legend on screen — just with every
    // count pinned at zero — so the chosen format reads correctly even
    // though no real proportions can be shown yet.
    if (hideEmptyLabel) {
      return(
        <div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',gap:20}}>
          {emptyCircle}
          <div style={{minWidth:0}}>
            <ChartLegend options={slide.options} counts={counts} total={total}/>
          </div>
        </div>
      )
    }
    return(
      <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
        {emptyCircle}
        <EmptyState text="No responses yet"/>
      </div>
    )
  }

  let cumulative=0
  const wedges=slide.options.map((_,i)=>{
    const c=counts[i], frac=c/total
    const startAngle=cumulative*2*Math.PI
    const endAngle=(cumulative+frac)*2*Math.PI
    cumulative+=frac
    const color=PALETTE_BARS[i%PALETTE_BARS.length]
    // A wedge that's ~100% of responses draws as a full-circle arc with
    // identical start/end points, which many SVG renderers draw as nothing —
    // render a plain circle instead. Checked by fraction, not options.length,
    // since one option can take 100% of the votes even with others present.
    if (frac>=0.9999) return {i,color,full:true}
    const x1=CX+R*Math.cos(startAngle), y1=CY+R*Math.sin(startAngle)
    const x2=CX+R*Math.cos(endAngle),   y2=CY+R*Math.sin(endAngle)
    const largeArcFlag=(endAngle-startAngle)>Math.PI ? 1 : 0
    const path=`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    return {i,color,full:false,path}
  })

  return(
    <div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',gap:20}}>
      <svg width={320} height={320} viewBox="0 0 200 200" style={{flexShrink:0}}>
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {wedges.map(w=>w.full
            ? <circle key={w.i} cx={CX} cy={CY} r={R} fill={w.color}/>
            : <path key={w.i} d={w.path} fill={w.color}/>)}
        </g>
      </svg>
      <div style={{minWidth:0}}>
        <ChartLegend options={slide.options} counts={counts} total={total}/>
      </div>
    </div>
  )
}
