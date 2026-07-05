import type { CSSProperties } from 'react'
import { Pencil, MessageCircle, LayoutTemplate } from 'lucide-react'
import { C } from '../../theme.ts'

type RailPos = 'top' | 'middle' | 'bottom'
const railRadius = (pos: RailPos): CSSProperties => pos==='top'
  ? {borderRadius:'5px 5px 0 0'}
  : pos==='bottom' ? {borderRadius:'0 0 5px 5px'} : {borderRadius:0}

const railBtn = (active: boolean, pos: RailPos): CSSProperties => ({
  width:40,height:40,border:`1.5px solid ${active?C.purple:C.border}`,
  marginTop:pos==='top'?0:-1.5,
  background:active?C.purpleBg:C.surface,color:active?C.purple:C.txt2,
  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:C.shadow,
  position:'relative',...railRadius(pos),
})
const railBtnDisabled = (pos: RailPos): CSSProperties => ({
  width:40,height:40,border:`1.5px solid ${C.borderLight}`,
  marginTop:pos==='top'?0:-1.5,
  background:C.surfaceAlt,color:C.txtDis,display:'flex',alignItems:'center',
  justifyContent:'center',cursor:'not-allowed',boxShadow:'none',...railRadius(pos),
})

interface RightRailProps {
  editOpen: boolean
  onToggleEdit: () => void
}

export function RightRail({editOpen,onToggleEdit}: RightRailProps){
  return(
    <div style={{width:64,flexShrink:0,borderLeft:`1.5px solid ${C.border}`,
      display:'flex',flexDirection:'column',alignItems:'center',padding:'16px 12px'}}>
      <button onClick={onToggleEdit} title="Edit slide" style={railBtn(editOpen,'top')}>
        <Pencil size={18}/>
      </button>
      <button disabled title="Comments (coming soon)" style={railBtnDisabled('middle')}>
        <MessageCircle size={18}/>
      </button>
      <button disabled title="Templates (coming soon)" style={railBtnDisabled('bottom')}>
        <LayoutTemplate size={18}/>
      </button>
    </div>
  )
}
