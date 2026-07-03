import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { C } from '../../theme.js'

export function TopBar({onBack,label}){
  return(
    <div style={{display:'flex',alignItems:'center'}}>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:C.txt3,cursor:'pointer',fontSize:14,fontWeight:700,padding:'4px 0'}}>
        <ArrowLeft size={16}/>{label}
      </button>
    </div>
  )
}
