import React, { useEffect } from 'react'
import { C } from '../../theme.js'

export function Modal({onClose,children,maxWidth=520}){
  useEffect(() => {
    const onKey = e => { if (e.key==='Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return(
    <div onClick={e=>{e.stopPropagation();onClose()}} style={{position:'fixed',inset:0,background:'rgba(20,10,40,0.45)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:6,maxWidth,
        width:'100%',maxHeight:'86vh',overflowY:'auto',boxShadow:C.shadowHov,padding:24,
        animation:'fadeUp .25s ease',position:'relative'}}>
        {children}
      </div>
    </div>
  )
}
