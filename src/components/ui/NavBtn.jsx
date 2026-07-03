import React from 'react'
import { C } from '../../theme.js'

export function NavBtn({onClick,disabled,children}){
  return(
    <button onClick={onClick} disabled={disabled}
      style={{width:44,height:44,borderRadius:'50%',border:`2px solid ${disabled?C.borderLight:C.border}`,
        background:disabled?C.surfaceAlt:C.surface,color:disabled?C.txtDis:C.txt1,
        cursor:disabled?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:disabled?'none':C.shadow}}>
      {children}
    </button>
  )
}
