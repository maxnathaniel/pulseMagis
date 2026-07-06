import { C } from '../../theme.ts'
import { EmptyState } from '../ui/EmptyState.tsx'

export function OpenResults({list,hideEmptyLabel}: {list: (string | number)[]; hideEmptyLabel?: boolean}){
  if (!list.length) return hideEmptyLabel ? null : <EmptyState text="Waiting for the first response…"/>
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:260,overflowY:'auto'}}>
      {[...list].reverse().map((r,i)=>(
        <div key={i} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:4,padding:'10px 14px',fontSize:14,fontWeight:600,color:C.txt1,animation:`fadeUp .3s ease ${Math.min(i,20)*40}ms both`,boxShadow:C.shadow}}>{r}</div>
      ))}
    </div>
  )
}
