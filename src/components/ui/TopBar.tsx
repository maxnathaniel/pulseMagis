import { ArrowLeft } from 'lucide-react'
import { C } from '../../theme.ts'

interface TopBarProps {
  onBack: () => void
  label: string
}

export function TopBar({onBack,label}: TopBarProps){
  return(
    <div style={{display:'flex',alignItems:'center'}}>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:C.txt3,cursor:'pointer',fontSize:14,fontWeight:700,padding:'4px 0'}}>
        <ArrowLeft size={16}/>{label}
      </button>
    </div>
  )
}
