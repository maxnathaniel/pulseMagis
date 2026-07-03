import React, { useState } from 'react'
import { Home as HomeIcon, Ticket, Plus, ChevronDown, LogOut } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.js'
import { NewPulseMenu } from './NewPulseMenu.jsx'

function NavItem({icon:Icon,label,active,onClick,accent}){
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

export function HomeSidebar({onCreateNew,onJoin,onLogout}){
  const [newPulseOpen,setNewPulseOpen]=useState(false)
  return(
    <div style={{width:240,flexShrink:0,borderRight:`1.5px solid ${C.border}`,padding:16,
      display:'flex',flexDirection:'column',gap:6,height:'100%'}}>
      <div style={{position:'relative',marginBottom:10}}>
        <button onClick={()=>setNewPulseOpen(o=>!o)}
          style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,
            padding:'12px',borderRadius:5,border:'none',background:C.purple,color:'#fff',cursor:'pointer',
            fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14.5,boxShadow:`0 4px 16px ${C.purpleBg}`}}>
          <Plus size={16}/> New Pulse <ChevronDown size={14} style={{marginLeft:2}}/>
        </button>
        <NewPulseMenu open={newPulseOpen} onClose={()=>setNewPulseOpen(false)}
          onPick={()=>{ setNewPulseOpen(false); onCreateNew() }}/>
      </div>

      <NavItem icon={HomeIcon} label="Home" active onClick={()=>{}}/>
      <NavItem icon={Ticket} label="Join a Pulse" accent={C.teal} onClick={onJoin}/>

      <div style={{marginTop:'auto',paddingTop:10,borderTop:`1.5px solid ${C.borderLight}`}}>
        <NavItem icon={LogOut} label="Log out" accent={C.red} onClick={onLogout}/>
      </div>
    </div>
  )
}
