import { Plus, Trash2 } from 'lucide-react'
import { C, FONT_DISPLAY, PALETTE_BARS } from '../../theme.ts'

interface EditableBarOptionsProps {
  slide: { options: string[] }
  list: (string | number)[]
  readOnly?: boolean
  onUpdateOption?: (oi: number, val: string) => void
  onRemoveOption?: (oi: number) => void
  onAddOption?: () => void
}

export function EditableBarOptions({slide,list,readOnly,onUpdateOption,onRemoveOption,onAddOption}: EditableBarOptionsProps){
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const max=Math.max(1,...counts), total=list.length
  return(
    <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',gap:12}}>
      {slide.options.map((opt,oi)=>{
        const color=PALETTE_BARS[oi%PALETTE_BARS.length]
        const c=counts[oi], pct=total?Math.round((c/total)*100):0
        return(
          <div key={oi} style={{flex:1,minHeight:48,display:'flex',gap:12,alignItems:'center'}}>
            <div style={{flex:1,height:'100%',position:'relative',borderRadius:4,background:`${color}16`,
              border:`2px solid ${color}45`,overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,width:`${(c/max)*100}%`,background:`${color}30`,
                transition:'width .6s cubic-bezier(.22,1,.36,1)'}}/>
              {!readOnly&&(
                <div style={{position:'relative',height:'100%',display:'flex',alignItems:'center',gap:10,padding:'0 16px'}}>
                  <input value={opt} onChange={e=>onUpdateOption?.(oi,e.target.value)} placeholder={`Option ${oi+1}`}
                    style={{flex:1,minWidth:0,background:'transparent',border:'none',outline:'none',color:C.txt1,
                      fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:16}}/>
                  <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:13,color:C.txt2,flexShrink:0}}>{c} · {pct}%</span>
                </div>
              )}
            </div>
            {!readOnly&&slide.options.length>2&&<button onClick={()=>onRemoveOption?.(oi)} title="Remove option"
              style={{background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:4,flexShrink:0}}><Trash2 size={14}/></button>}
          </div>
        )
      })}
      {!readOnly&&slide.options.length<6&&(
        <button onClick={onAddOption} style={{height:50,flexShrink:0,borderRadius:4,border:`2px dashed ${C.border}`,
          background:'transparent',color:C.txt3,display:'flex',alignItems:'center',justifyContent:'center',
          gap:7,cursor:'pointer',fontSize:14,fontWeight:700}}>
          <Plus size={14}/> Add option
        </button>
      )}
    </div>
  )
}
