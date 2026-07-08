import type { ReactNode } from 'react'
import { C } from '../../theme.ts'

interface NavBtnProps {
  onClick: () => void
  disabled?: boolean
  size?: number
  // Border-less look where the old border colour becomes the fill instead.
  flat?: boolean
  children: ReactNode
}

export function NavBtn({onClick,disabled,size=44,flat,children}: NavBtnProps){
  return(
    <button onClick={onClick} disabled={disabled}
      style={{width:size,height:size,borderRadius:'50%',
        border:flat?'none':`2px solid ${disabled?C.borderLight:C.border}`,
        background:flat?(disabled?C.borderLight:C.border):(disabled?C.surfaceAlt:C.surface),
        color:disabled?C.txtDis:C.txt1,
        cursor:disabled?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:disabled?'none':C.shadow}}>
      {children}
    </button>
  )
}
