import { useEffect, useRef, useState } from 'react'
import { Clock, Radio, ShieldCheck } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'
import { TopBar } from '../../components/ui/TopBar.tsx'
import { ModerationPanel } from '../../components/ModerationPanel.tsx'
import { hashPin } from '../../lib/helpers.ts'
import type { Session, Question, ModerateAction } from '../../types.ts'

const ENDED_REDIRECT_DELAY_MS = 4000

interface ModerateProps {
  session: Session
  qnaList: Question[]
  onModerate: (qId: string, action: ModerateAction) => void
  onToggleModeration: () => void
  onLeave: () => void
}

export function Moderate({session,qnaList,onModerate,onToggleModeration,onLeave}: ModerateProps){
  const [unlocked,setUnlocked]=useState(false)
  const [pinInput,setPinInput]=useState('')
  const [checking,setChecking]=useState(false)
  const [error,setError]=useState('')

  // Mirrors Vote.tsx's ended/not-started distinction — both show as
  // is_live:false, hasPresented is what tells apart "never started" from
  // "already over".
  const ended=session.isLive===false && session.hasPresented
  const notStarted=session.isLive===false && !session.hasPresented

  const onLeaveRef=useRef(onLeave)
  useEffect(() => { onLeaveRef.current=onLeave }, [onLeave])
  useEffect(() => {
    if (!ended) return
    const timer=setTimeout(() => onLeaveRef.current(), ENDED_REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [ended])

  const submitPin=async()=>{
    setError('')
    if (!session.pinHash) { setError("Moderation isn't set up for this Pulse."); return }
    setChecking(true)
    const attempt=await hashPin(pinInput.trim())
    setChecking(false)
    if (attempt===session.pinHash) setUnlocked(true)
    else setError('Incorrect PIN — check with the presenter and try again.')
  }

  if (notStarted) {
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'18px',minHeight:0}}>
        <TopBar onBack={onLeave} label="Leave"/>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:C.surfaceAlt,border:`2px solid ${C.border}`,
            display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
            <Clock size={26} color={C.txt4}/>
          </div>
          <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:20,color:C.txt1}}>This Pulse hasn't started yet</div>
          <div style={{color:C.txt3,fontSize:14,marginTop:6,fontWeight:600}}>Hang tight — this page will update automatically once the presenter starts.</div>
        </div>
      </div>
    )
  }

  if (ended) {
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'18px',minHeight:0}}>
        <TopBar onBack={onLeave} label="Leave"/>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:C.surfaceAlt,border:`2px solid ${C.border}`,
            display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
            <Radio size={26} color={C.txt4}/>
          </div>
          <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:20,color:C.txt1}}>This Pulse has ended</div>
          <div style={{color:C.txt3,fontSize:14,marginTop:6,fontWeight:600}}>The presenter has ended this presentation. Thanks for moderating!</div>
        </div>
      </div>
    )
  }

  if (!unlocked) {
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'18px'}}>
        <TopBar onBack={onLeave} label="Leave"/>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:64,height:64,borderRadius:6,background:C.tealBg,border:`2px solid ${C.tealBorder}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
            <ShieldCheck size={30} color={C.teal}/>
          </div>
          <h2 style={{fontFamily:FONT_DISPLAY,fontSize:28,fontWeight:700,margin:'0 0 6px',color:C.txt1}}>Enter the moderator PIN</h2>
          <p style={{color:C.txt3,fontSize:14,marginBottom:24,fontWeight:600}}>Ask the presenter if you don't have it</p>
          <input value={pinInput} onChange={e=>setPinInput(e.target.value.slice(0,20))} onKeyDown={e=>e.key==='Enter'&&submitPin()}
            placeholder="PIN" type="password" autoFocus
            style={{width:290,textAlign:'center',fontFamily:FONT_DISPLAY,fontSize:34,fontWeight:700,letterSpacing:7,background:C.surface,border:`2px solid ${C.border}`,borderRadius:5,color:C.txt1,padding:'14px 10px',outline:'none',boxShadow:C.shadow}}/>
          {error&&<div style={{color:C.red,fontSize:13,marginTop:14,maxWidth:260,textAlign:'center',fontWeight:700}}>{error}</div>}
          <button onClick={submitPin} disabled={checking||!pinInput.trim()}
            style={{marginTop:24,padding:'13px 40px',borderRadius:5,border:'none',background:C.teal,color:'#fff',fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:16,cursor:checking?'wait':'pointer',boxShadow:`0 4px 16px ${C.tealBg}`}}>
            {checking?'Checking…':'Unlock'}
          </button>
        </div>
      </div>
    )
  }

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:'18px',minHeight:0}}>
      <TopBar onBack={onLeave} label="Leave"/>
      <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',maxWidth:560,width:'100%',margin:'0 auto'}}>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:'clamp(20px,3vw,26px)',fontWeight:700,margin:'6px 0 12px',color:C.txt1}}>{session.title}</h2>
        <ModerationPanel session={session} qnaList={qnaList} onModerate={onModerate} onToggleModeration={onToggleModeration}/>
      </div>
    </div>
  )
}
