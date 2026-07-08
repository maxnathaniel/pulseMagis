import { Play, type LucideIcon } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'

interface PulseTypeMeta {
  key: string
  label: string
  icon: LucideIcon
  subtitle: string
}

const PULSE_TYPES: PulseTypeMeta[] = [
  { key:'presentation', label:'Presentation', icon:Play, subtitle:'Build slides, get a join code' },
]

interface NewPulseMenuProps {
  open: boolean
  onClose: () => void
  onPick: (key: string) => void
}

export function NewPulseMenu({open,onClose,onPick}: NewPulseMenuProps){
  if (!open) return null
  return(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'transparent',zIndex:40}}/>
      <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:8,background:C.surface,
        border:`1.5px solid ${C.border}`,borderRadius:6,boxShadow:C.shadowHov,padding:8,zIndex:41}}>
        {PULSE_TYPES.map(t=>{
          const Icon=t.icon
          return(
            <button key={t.key} onClick={()=>onPick(t.key)}
              style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:10,
                padding:'10px 10px',borderRadius:4,border:'none',background:'transparent',cursor:'pointer'}}
              onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHov}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{width:32,height:32,borderRadius:4,background:`${C.purple}18`,display:'flex',
                alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon size={16} color={C.purple}/>
              </div>
              <div>
                <div style={{fontFamily:FONT_DISPLAY,fontWeight:500,fontSize:14,color:C.txt1}}>{t.label}</div>
                <div style={{fontSize:12,color:C.txt3,fontWeight:400}}>{t.subtitle}</div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
