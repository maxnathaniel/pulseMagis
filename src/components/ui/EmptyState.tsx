import { C } from '../../theme.ts'

export function EmptyState({text}: {text: string}){
  return<div style={{textAlign:'center',color:C.txt4,fontSize:14,padding:'24px 0',fontWeight:600}}>{text}</div>
}
