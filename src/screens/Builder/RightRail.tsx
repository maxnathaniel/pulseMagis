import type { CSSProperties } from 'react'
import { Settings2, MessageCircle, LayoutTemplate } from 'lucide-react'
import { C } from '../../theme.ts'

const railBtn = (active: boolean): CSSProperties => ({
  width:40,height:40,borderRadius:5,border:`1.5px solid ${active?C.purple:C.border}`,
  background:active?C.purpleBg:C.surface,color:active?C.purple:C.txt2,
  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:C.shadow,
})
const railBtnDisabled: CSSProperties = {
  width:40,height:40,borderRadius:5,border:`1.5px solid ${C.borderLight}`,
  background:C.surfaceAlt,color:C.txtDis,display:'flex',alignItems:'center',
  justifyContent:'center',cursor:'not-allowed',boxShadow:'none',
}

interface RightRailProps {
  editOpen: boolean
  onToggleEdit: () => void
}

export function RightRail({editOpen,onToggleEdit}: RightRailProps){
  return(
    <div style={{width:64,flexShrink:0,borderLeft:`1.5px solid ${C.border}`,
      display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'16px 12px'}}>
      <button onClick={onToggleEdit} title="Edit slide" style={railBtn(editOpen)}>
        <Settings2 size={18}/>
      </button>
      <button disabled title="Comments (coming soon)" style={railBtnDisabled}>
        <MessageCircle size={18}/>
      </button>
      <button disabled title="Templates (coming soon)" style={railBtnDisabled}>
        <LayoutTemplate size={18}/>
      </button>
    </div>
  )
}
