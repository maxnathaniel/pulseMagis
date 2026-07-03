import React from 'react'
import { C } from '../../theme.js'

export function SectionLabel({children}){
  return<div style={{fontSize:11.5,letterSpacing:1.5,color:C.txt4,fontWeight:800}}>{typeof children==='string'?children.toUpperCase():children}</div>
}
