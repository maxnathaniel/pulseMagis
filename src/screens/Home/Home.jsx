import React, { useState } from 'react'
import { C, FONT_DISPLAY } from '../../theme.js'
import { PulseTile } from './PulseTile.jsx'
import { HomeSidebar } from './HomeSidebar.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'

const formatDate = (createdAt) => new Date(createdAt).toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'})

const getInitials = (email) => {
  if (!email) return '?'
  const local=email.split('@')[0]
  const parts=local.split(/[._-]+/).filter(Boolean)
  return parts.length>=2 ? (parts[0][0]+parts[1][0]).toUpperCase() : local.slice(0,2).toUpperCase()
}

export function Home({pulses,pulsesLoading,onCreateNew,onJoin,onResume,onDeletePulse,onRenamePulse,onLogout,userEmail}){
  const [pendingDelete,setPendingDelete]=useState(null)
  return(
    <div style={{flex:1,display:'flex',minHeight:0}}>
      <HomeSidebar onCreateNew={onCreateNew} onJoin={onJoin} onLogout={onLogout}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
        <div style={{flexShrink:0,height:64,background:C.surface,borderBottom:`1.5px solid ${C.border}`,
          display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 32px'}}>
          <div title={userEmail||''} style={{width:38,height:38,borderRadius:'50%',background:C.purple,
            color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,flexShrink:0}}>
            {getInitials(userEmail)}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'32px 40px'}}>
          <h1 style={{fontFamily:FONT_DISPLAY,fontSize:26,fontWeight:700,margin:'0 0 20px',color:C.txt1}}>
            Your Pulses
          </h1>
          {pulsesLoading
            ? <EmptyState text="Loading…"/>
            : pulses.length===0
              ? <EmptyState text="No Pulses yet — create one to get started."/>
              : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',gap:18}}>
                  {pulses.map(p=>(
                    <PulseTile key={p.code} code={p.code} firstSlide={p.firstSlide} title={p.title||'Untitled presentation'}
                      dateLabel={formatDate(p.created_at)}
                      onClick={()=>onResume(p.code)}
                      onDelete={()=>setPendingDelete(p)}
                      onRename={newTitle=>onRenamePulse(p.code,newTitle)}/>
                  ))}
                </div>
          }
        </div>
      </div>
      {pendingDelete&&<ConfirmDialog
        title="Delete this Pulse?"
        message={`"${pendingDelete.title||'Untitled presentation'}" and all of its slides and responses will be permanently deleted.`}
        confirmLabel="Delete" onConfirm={()=>{ onDeletePulse(pendingDelete.code); setPendingDelete(null) }}
        onCancel={()=>setPendingDelete(null)}/>}
    </div>
  )
}
