import { Plus, Trash2 } from 'lucide-react'
import { C, FONT_DISPLAY, PALETTE_BARS } from '../../theme.ts'

interface EditableChartLegendProps {
  options: string[]
  counts: number[]
  total: number
  onUpdateOption: (oi: number, val: string) => void
  onRemoveOption: (oi: number) => void
  onAddOption: () => void
}

export function EditableChartLegend({options,counts,total,onUpdateOption,onRemoveOption,onAddOption}: EditableChartLegendProps){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {options.map((opt,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{width:10,height:10,borderRadius:'50%',background:PALETTE_BARS[i%PALETTE_BARS.length],flexShrink:0}}/>
          <input value={opt} onChange={e=>onUpdateOption(i,e.target.value)} placeholder={`Option ${i+1}`}
            style={{flex:1,minWidth:0,background:'transparent',border:'none',outline:'none',color:C.txt1,
              fontFamily:FONT_DISPLAY,fontWeight:500,fontSize:19,borderBottom:`1.5px solid ${C.border}`,padding:'2px 0'}}/>
          <span style={{fontSize:12,fontWeight:500,color:C.txt3,flexShrink:0}}>{counts[i]} · {total?Math.round(counts[i]/total*100):0}%</span>
          {options.length>2&&<button onClick={()=>onRemoveOption(i)} title="Remove option"
            style={{background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:2,flexShrink:0}}><Trash2 size={13}/></button>}
        </div>
      ))}
      {options.length<6&&(
        <button onClick={onAddOption} style={{marginTop:4,padding:'8px 0',borderRadius:9999,border:`2px dashed ${C.border}`,
          background:'transparent',color:C.txt3,display:'flex',alignItems:'center',justifyContent:'center',
          gap:6,cursor:'pointer',fontSize:12.5,fontWeight:500}}>
          <Plus size={12}/> Add option
        </button>
      )}
    </div>
  )
}
