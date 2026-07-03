import React, { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Share2, Copy, Check, Download, X } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.js'
import { Modal } from './Modal.jsx'

export function ShareDialog({code,onClose}){
  const [copied,setCopied]=useState(false)
  const canvasRef=useRef(null)
  const link=`${window.location.origin}/?code=${code}`

  const handleCopy=()=>{
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(()=>setCopied(false),2000)
  }

  const handleDownload=()=>{
    const url=canvasRef.current.toDataURL('image/png')
    const a=document.createElement('a')
    a.href=url
    a.download=`pulse-${code}-qr.png`
    a.click()
  }

  return(
    <Modal onClose={onClose} maxWidth={400}>
      <button onClick={onClose} title="Close"
        style={{position:'absolute',top:14,right:14,background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:6,lineHeight:0}}>
        <X size={16}/>
      </button>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:16}}>
        <div style={{width:44,height:44,borderRadius:'50%',background:C.purpleBg,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Share2 size={20} color={C.purple}/>
        </div>
        <div>
          <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:18,color:C.txt1,marginBottom:4}}>
            Share with Participants
          </div>
          <div style={{color:C.txt3,fontSize:13.5,fontWeight:600}}>
            Anyone with this link or QR code can join and respond.
          </div>
        </div>

        <div style={{width:'100%',display:'flex',alignItems:'center',gap:8}}>
          <div style={{flex:1,padding:'11px 12px',borderRadius:5,border:`1.5px solid ${C.border}`,
            background:C.surfaceAlt,color:C.txt2,fontSize:13,fontWeight:600,textAlign:'left',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {link}
          </div>
          <button onClick={handleCopy} title="Copy link"
            style={{flexShrink:0,width:40,height:40,borderRadius:5,border:'none',
              background:copied?C.teal:C.purple,color:'#fff',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
            {copied?<Check size={17}/>:<Copy size={17}/>}
          </button>
        </div>

        <div style={{background:'#fff',padding:14,borderRadius:5,border:`1.5px solid ${C.border}`}}>
          <QRCodeCanvas ref={canvasRef} value={link} size={180} fgColor={C.txt1} bgColor="#fff"/>
        </div>

        <button onClick={handleDownload}
          style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:5,
            border:`2px solid ${C.border}`,background:C.surface,color:C.txt2,
            fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:13.5,cursor:'pointer'}}>
          <Download size={15}/> Download QR code
        </button>
      </div>
    </Modal>
  )
}
