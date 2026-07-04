import { useState } from 'react'
import { Home as HomeIcon, Ticket, LogOut, type LucideIcon } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'

interface NavItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
  accent?: string
}

function NavItem({icon:Icon,label,active,onClick,accent}: NavItemProps){
  const [hov,setHov]=useState(false)
  const on=active||hov
  return(
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:5,
        border:'none',background:on?(accent?`${accent}18`:C.surfaceHov):'transparent',
        color:on?(accent||C.purple):C.txt2,cursor:'pointer',fontFamily:FONT_DISPLAY,fontWeight:700,
        fontSize:14,textAlign:'left',transition:'all .15s ease'}}>
      <Icon size={17}/>{label}
    </button>
  )
}

interface HomeSidebarProps {
  onJoin: () => void
  onLogout: () => void
}

export function HomeSidebar({onJoin,onLogout}: HomeSidebarProps){
  return(
    <div style={{width:188,flexShrink:0,borderRight:`1.5px solid ${C.border}`,padding:16,
      display:'flex',flexDirection:'column',alignItems:'center',gap:6,height:'100%'}}>
      <img src="/images/favicon-96x96.png" alt="" width={48} height={48} style={{marginBottom:14}}/>
      <NavItem icon={HomeIcon} label="Home" active onClick={()=>{}}/>
      <NavItem icon={Ticket} label="Join a Pulse" accent={C.teal} onClick={onJoin}/>

      <div style={{width:'100%',marginTop:'auto',paddingTop:10,borderTop:`1.5px solid ${C.borderLight}`}}>
        <NavItem icon={LogOut} label="Log out" accent={C.red} onClick={onLogout}/>
      </div>
    </div>
  )
}
