import { useEffect, useState } from 'react'
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
  const [mounted,setMounted]=useState(false)
  useEffect(() => {
    const t=requestAnimationFrame(()=>setMounted(true))
    return ()=>cancelAnimationFrame(t)
  }, [])
  const counts=slide.options.map((_,i)=>list.filter(v=>v===i).length)
  const max=Math.max(1,...counts), total=list.length
  return(
    <div style={{flex:1,minHeight:0,display:'flex',alignItems:'flex-end',gap:16}}>
      {slide.options.map((opt,oi)=>{
        const color=PALETTE_BARS[oi%PALETTE_BARS.length]
        const c=counts[oi], pct=total?Math.round((c/total)*100):0
        return(
          <div key={oi} style={{flex:1,minWidth:0,height:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            {/* Kept mounted (not removed) in readOnly mode so the bar-track
              below still gets the same squeezed-space height as the real
              editor — only its visibility is toggled, not its layout. */}
            <div style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexShrink:0,
              visibility:readOnly?'hidden':'visible'}}>
              <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:13,color:C.txt2}}>{c} · {pct}%</span>
              {slide.options.length>2&&<button onClick={()=>onRemoveOption?.(oi)} title="Remove option"
                style={{background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:2,flexShrink:0}}><Trash2 size={13}/></button>}
            </div>
            <div style={{flex:1,width:'100%',borderRadius:4,background:`${color}16`,display:'flex',alignItems:'flex-end'}}>
              <div style={{width:'100%',height:mounted?`${(c/max)*100}%`:'0%',background:`${color}30`,borderRadius:4,
                border:c>0?`2px solid ${color}45`:'none',boxSizing:'border-box',
                transition:`height .6s cubic-bezier(.22,1,.36,1) ${oi*70}ms`}}/>
            </div>
            <input value={opt} onChange={e=>onUpdateOption?.(oi,e.target.value)} placeholder={`Option ${oi+1}`}
              readOnly={readOnly} tabIndex={readOnly?-1:undefined}
              style={{width:'100%',flexShrink:0,background:'transparent',border:'none',outline:'none',color:C.txt1,textAlign:'center',
                fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:21,visibility:readOnly?'hidden':'visible'}}/>
          </div>
        )
      })}
      {!readOnly&&slide.options.length<6&&(
        <button onClick={onAddOption} style={{flex:1,minWidth:0,height:'100%',borderRadius:4,border:`2px dashed ${C.border}`,
          background:'transparent',color:C.txt3,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          gap:7,cursor:'pointer',fontSize:14,fontWeight:700}}>
          <Plus size={14}/> Add option
        </button>
      )}
    </div>
  )
}
