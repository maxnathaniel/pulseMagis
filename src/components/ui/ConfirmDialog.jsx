import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.js'
import { Modal } from './Modal.jsx'

export function ConfirmDialog({title,message,confirmLabel='Delete',cancelLabel='Cancel',danger=true,onConfirm,onCancel}){
  return(
    <Modal onClose={onCancel} maxWidth={380}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
        <div style={{width:44,height:44,borderRadius:'50%',background:danger?C.redBg:C.purpleBg,
          display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
          <AlertTriangle size={20} color={danger?C.red:C.purple}/>
        </div>
        <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:18,color:C.txt1,marginBottom:6}}>{title}</div>
        <div style={{color:C.txt3,fontSize:14,lineHeight:1.5,fontWeight:600,marginBottom:20}}>{message}</div>
        <div style={{display:'flex',gap:10,width:'100%'}}>
          <button onClick={onCancel} style={{flex:1,padding:'11px',borderRadius:5,border:`2px solid ${C.border}`,
            background:C.surface,color:C.txt2,fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,cursor:'pointer'}}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={{flex:1,padding:'11px',borderRadius:5,border:'none',
            background:danger?C.red:C.purple,color:'#fff',fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,cursor:'pointer'}}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
