import type { ReactNode } from 'react'
import { C } from '../../theme.ts'

export function SectionLabel({children}: {children: ReactNode}){
  return<div style={{fontSize:11.5,letterSpacing:1.5,color:C.txt4,fontWeight:800}}>{typeof children==='string'?children.toUpperCase():children}</div>
}
