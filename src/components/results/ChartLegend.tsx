import { C, PALETTE_BARS } from '../../theme.ts'

interface ChartLegendProps {
  options: string[]
  counts: number[]
  total: number
}

export function ChartLegend({options,counts,total}: ChartLegendProps){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {options.map((opt,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{width:10,height:10,borderRadius:'50%',background:PALETTE_BARS[i%PALETTE_BARS.length],flexShrink:0}}/>
          <span style={{flex:1,fontSize:13,fontWeight:700,color:C.txt1}}>{opt}</span>
          <span style={{fontSize:12,fontWeight:700,color:C.txt3}}>{counts[i]} · {total?Math.round(counts[i]/total*100):0}%</span>
        </div>
      ))}
    </div>
  )
}
