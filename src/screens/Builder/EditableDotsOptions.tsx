import { Plus, Trash2 } from 'lucide-react'
import { C, PALETTE_BARS, FONT_DISPLAY } from '../../theme.ts'
import { HoneycombDots, DOTS_MAX_PER_OPTION } from '../../components/ui/HoneycombDots.tsx'

interface EditableDotsOptionsProps {
  slide: { options: string[] }
  list: (string | number)[]
  readOnly?: boolean
  onUpdateOption?: (oi: number, val: string) => void
  onRemoveOption?: (oi: number) => void
  onAddOption?: () => void
}

export function EditableDotsOptions({slide,list,readOnly,onUpdateOption,onRemoveOption,onAddOption}: EditableDotsOptionsProps){
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const total=list.length

  return(
    <div style={{flex:1,minHeight:0,overflowY:'auto',display:'flex',flexDirection:'column',gap:12,
      justifyContent:'center'}}>
      {slide.options.map((opt,i)=>{
        const c=counts[i], pct=total?Math.round((c/total)*100):0
        const color=PALETTE_BARS[i%PALETTE_BARS.length]
        const overflow=c-DOTS_MAX_PER_OPTION
        return(
          <div key={i}>
            {!readOnly&&(
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
                <input value={opt} onChange={e=>onUpdateOption?.(i,e.target.value)} placeholder={`Option ${i+1}`}
                  style={{flex:1,minWidth:0,background:'transparent',border:'none',outline:'none',color:C.txt1,
                    fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:20,borderBottom:`1.5px solid ${C.border}`,padding:'2px 0'}}/>
                {slide.options.length>2&&<button onClick={()=>onRemoveOption?.(i)} title="Remove option"
                  style={{background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:2,flexShrink:0}}><Trash2 size={13}/></button>}
              </div>
            )}
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                <HoneycombDots count={c} color={color}/>
                {overflow>0&&(
                  <span style={{fontSize:11,fontWeight:700,color:C.txt3}}>+{overflow}</span>
                )}
              </div>
              {!readOnly&&<span style={{fontSize:12,fontWeight:700,color:C.txt3}}>{c} · {pct}%</span>}
            </div>
          </div>
        )
      })}
      {!readOnly&&slide.options.length<6&&(
        <button onClick={onAddOption} style={{padding:'10px 0',borderRadius:4,border:`2px dashed ${C.border}`,
          background:'transparent',color:C.txt3,display:'flex',alignItems:'center',justifyContent:'center',
          gap:7,cursor:'pointer',fontSize:13,fontWeight:700}}>
          <Plus size={13}/> Add option
        </button>
      )}
    </div>
  )
}
