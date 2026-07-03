import type { ReactNode } from 'react'

interface RoundBtnProps {
  children: ReactNode
  onClick: () => void
  color: string
  title?: string
}

export function RoundBtn({children,onClick,color,title}: RoundBtnProps){
  return(
    <button onClick={onClick} title={title}
      style={{width:30,height:30,borderRadius:'50%',border:`1.5px solid ${color}55`,background:`${color}14`,color,
        display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
      {children}
    </button>
  )
}
