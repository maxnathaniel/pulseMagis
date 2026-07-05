import { ArrowLeft, Eye, Play } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'

export type BuilderView = 'create' | 'results'

interface ViewTabProps {
  label: string
  active: boolean
  onClick: () => void
}

function ViewTab({label,active,onClick}: ViewTabProps){
  return(
    <button onClick={onClick} style={{padding:'7px 18px',borderRadius:4,border:'none',
      background:active?C.purple:'transparent',color:active?'#fff':C.txt2,
      fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:13.5,cursor:'pointer',transition:'all .15s ease'}}>
      {label}
    </button>
  )
}

interface BuilderTopBarProps {
  title: string
  onTitleChange: (title: string) => void
  onBack: () => void
  onPreview: () => void
  onPresent: () => void
  view: BuilderView
  onViewChange: (view: BuilderView) => void
}

export function BuilderTopBar({title,onTitleChange,onBack,onPreview,onPresent,view,onViewChange}: BuilderTopBarProps){
  return(
    <div style={{borderBottom:`1.5px solid ${C.border}`,padding:'14px 24px',display:'grid',
      gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:16,background:C.surface}}>
      <div style={{display:'flex',alignItems:'center',gap:14,minWidth:0}}>
        <button onClick={onBack} title="Back to home" style={{display:'flex',alignItems:'center',
          gap:6,background:'none',border:'none',color:C.txt3,cursor:'pointer',padding:6,flexShrink:0}}>
          <ArrowLeft size={18}/>
        </button>
        <input value={title} onChange={e=>onTitleChange(e.target.value)} placeholder="Presentation title…"
          style={{flex:1,minWidth:80,background:'transparent',border:'none',color:C.txt1,
            fontFamily:FONT_DISPLAY,fontSize:20,fontWeight:700,padding:'4px 2px',outline:'none'}}/>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:2,background:C.surfaceAlt,borderRadius:5,padding:3,flexShrink:0}}>
        <ViewTab label="Create" active={view==='create'} onClick={()=>onViewChange('create')}/>
        <ViewTab label="Results" active={view==='results'} onClick={()=>onViewChange('results')}/>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10,justifySelf:'end'}}>
        <button onClick={onPreview} style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',
          borderRadius:4,border:`2px solid ${C.border}`,background:C.surface,color:C.txt2,
          fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,cursor:'pointer'}}>
          <Eye size={16}/> Preview
        </button>
        <button onClick={onPresent} disabled={view==='results'} title={view==='results'?'Switch to Create to start presenting':undefined}
          style={{display:'flex',alignItems:'center',gap:7,
          padding:'10px 20px',borderRadius:4,border:'none',
          background:view==='results'?C.disabledBtn:C.purple,color:view==='results'?C.txtDis:'#fff',
          fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,cursor:view==='results'?'not-allowed':'pointer',
          boxShadow:view==='results'?'none':`0 4px 16px ${C.purpleBg}`,transition:'all .2s ease'}}>
          <Play size={16}/> Start Presentation
        </button>
      </div>
    </div>
  )
}
