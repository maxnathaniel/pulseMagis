import React from 'react'
import { C } from '../../theme.js'

export function EmptyState({text}){
  return<div style={{textAlign:'center',color:C.txt4,fontSize:14,padding:'24px 0',fontWeight:600}}>{text}</div>
}
