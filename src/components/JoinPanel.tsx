import { QRCodeSVG } from 'qrcode.react'
import { Ticket, Copy, Check, Users, X } from 'lucide-react'
import { C, FONT_DISPLAY } from '../theme.ts'

interface JoinPanelProps {
  code: string
  audienceCount: number
  copied: boolean
  onCopy: () => void
  onClose: () => void
}

export function JoinPanel({code,audienceCount,copied,onCopy,onClose}: JoinPanelProps){
  // Not named `code` — Supabase's OAuth client scans the URL for a `code`
  // query param on every load to detect an OAuth callback, so reusing that
  // name here would make it swallow/misinterpret a scanned join link as a
  // (bogus) auth code instead of letting the app's own join-code handling see it.
  const joinUrl=`${window.location.origin}/?joinCode=${code}`
  return(
    <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:6,boxShadow:C.shadowHov,
      padding:'12px 27px 27px',display:'flex',flexDirection:'column',alignItems:'center',gap:15}}>
      <button onClick={onClose} title="Hide join panel"
        style={{alignSelf:'flex-end',background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:8,lineHeight:0}}>
        <X size={21}/>
      </button>
      <div style={{background:'#fff',padding:14,borderRadius:5,border:`1.5px solid ${C.border}`,marginTop:-15}}>
        <QRCodeSVG value={joinUrl} size={210} fgColor={C.txt1} bgColor="#fff"/>
      </div>
      <div style={{fontSize:16,color:C.txt4,fontWeight:700,letterSpacing:.5}}>{window.location.host}</div>
      <div onClick={onCopy} title="Copy code" style={{display:'flex',alignItems:'center',gap:11,
        border:`2px dashed ${C.amberBorder}`,background:C.amberBg,borderRadius:5,padding:'12px 21px',cursor:'pointer'}}>
        <Ticket size={21} color={C.amber}/>
        <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,letterSpacing:5,fontSize:30,color:C.amber}}>{code}</span>
        {copied?<Check size={20} color={C.teal}/>:<Copy size={20} color={C.amber}/>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:18,color:C.txt3,fontWeight:700}}>
        <Users size={20}/>
        {audienceCount>0 ? `${audienceCount} ${audienceCount===1?'person':'people'} joined` : 'Waiting for participants'}
      </div>
    </div>
  )
}
