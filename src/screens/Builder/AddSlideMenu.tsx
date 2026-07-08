import { C, FONT_DISPLAY, SLIDE_TYPES } from '../../theme.ts'
import type { SlideType } from '../../types.ts'

interface AddSlideMenuProps {
  open: boolean
  onClose: () => void
  onPick: (type: SlideType) => void
  hasQa: boolean
}

export function AddSlideMenu({open,onClose,onPick,hasQa}: AddSlideMenuProps){
  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'transparent',zIndex:40}}/>
      <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:8,background:C.surface,
        border:`1.5px solid ${C.border}`,borderRadius:4,boxShadow:C.shadowHov,padding:6,zIndex:41}}>
        <div style={{position:'absolute',top:-6,left:'50%',marginLeft:-6,width:11,height:11,
          background:C.surface,borderLeft:`1.5px solid ${C.border}`,borderTop:`1.5px solid ${C.border}`,
          transform:'rotate(45deg)'}}/>
        {SLIDE_TYPES.map(t=>{
          const Icon=t.icon
          const disabled=t.key==='qa'&&hasQa
          return (
            <button key={t.key} disabled={disabled} onClick={()=>!disabled&&onPick(t.key)}
              style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:9,
                padding:'8px 9px',borderRadius:4,border:'none',background:'transparent',
                cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1}}
              onMouseEnter={e=>{ if (!disabled) e.currentTarget.style.background=C.surfaceHov }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}>
              <Icon size={15} color={C.purple}/>
              <span style={{fontFamily:FONT_DISPLAY,fontWeight:500,fontSize:13,color:C.txt1}}>
                {t.label}{disabled?' (added)':''}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
