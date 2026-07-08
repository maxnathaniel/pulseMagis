import type { LucideIcon } from 'lucide-react'
import { C } from '../../theme.ts'

interface ToggleChipProps {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}

export function ToggleChip({icon:Icon,label,active,onClick}: ToggleChipProps){
  return(
    <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 14px',borderRadius:999,
      border:`2px solid ${active?C.tealBorder:C.border}`,background:active?C.tealBg:C.surface,
      color:active?C.teal:C.txt3,fontSize:13,fontWeight:500,cursor:'pointer',boxShadow:C.shadow}}>
      <Icon size={13}/>{label}
    </button>
  )
}
