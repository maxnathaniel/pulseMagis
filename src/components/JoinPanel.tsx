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
  const joinUrl=`${window.location.origin}/?code=${code}`
  return(
    <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:6,boxShadow:C.shadow,
      padding:28,display:'flex',flexDirection:'column',alignItems:'center',gap:16,width:'100%',position:'relative'}}>
      <button onClick={onClose} title="Hide join panel"
        style={{position:'absolute',top:10,right:10,background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:6,lineHeight:0}}>
        <X size={16}/>
      </button>
      <div style={{background:'#fff',padding:14,borderRadius:5,border:`1.5px solid ${C.border}`}}>
        <QRCodeSVG value={joinUrl} size={220} fgColor={C.txt1} bgColor="#fff"/>
      </div>
      <div style={{fontSize:13,color:C.txt4,fontWeight:700,letterSpacing:.5}}>{window.location.host}</div>
      <div onClick={onCopy} title="Copy code" style={{display:'flex',alignItems:'center',gap:10,
        border:`2px dashed ${C.amberBorder}`,background:C.amberBg,borderRadius:5,padding:'11px 22px',cursor:'pointer'}}>
        <Ticket size={18} color={C.amber}/>
        <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,letterSpacing:5,fontSize:28,color:C.amber}}>{code}</span>
        {copied?<Check size={17} color={C.teal}/>:<Copy size={17} color={C.amber}/>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,fontSize:14,color:C.txt3,fontWeight:700}}>
        <Users size={15}/>
        {audienceCount>0 ? `${audienceCount} ${audienceCount===1?'person':'people'} joined` : 'Waiting for participants'}
      </div>
    </div>
  )
}
