import { useState } from 'react'
import { C, FONT_DISPLAY } from '../../theme.ts'

interface LoginProps {
  loading: boolean
  error: string
  onSubmit: () => void
}

export function Login({loading,error,onSubmit}: LoginProps){
  const [hov,setHov]=useState(false)
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
        <div style={{width:36,height:36,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <img src="/images/apple-touch-icon.png" alt="" width={80} height={80} style={{borderRadius:6}}/>
        </div>
      </div>

      <div style={{width:'100%',maxWidth:380,background:C.surface,borderRadius:10,border:`1.5px solid ${C.border}`,
        boxShadow:C.shadowHov,padding:'36px 32px'}}>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:24,fontWeight:700,margin:'0 0 6px',color:C.txt1,textAlign:'center'}}>
          Presenter sign-in
        </h2>

        {error&&<div style={{color:C.red,background:C.redBg,borderRadius:5,padding:'10px 14px',fontSize:13,
          marginBottom:18,textAlign:'center',fontWeight:700}}>{error}</div>}

        <button onClick={()=>onSubmit()} disabled={loading}
          onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
          style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'13px 20px',
            borderRadius:5,border:`1.5px solid ${hov?C.borderStrong:C.border}`,background:hov?C.surfaceHov:C.surface,
            color:C.txt1,fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:15,cursor:loading?'wait':'pointer',
            boxShadow:hov?C.shadowHov:C.shadow,transition:'all .15s ease'}}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.86 2.7-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          {loading?'Please wait…':'Sign in with Google'}
        </button>

        <p style={{color:C.txt4,fontSize:12,marginTop:22,marginBottom:0,textAlign:'center',fontWeight:600,lineHeight:1.5}}>
          Access is restricted to approved presenter accounts.<br/>Audience members don't need to sign in.
        </p>
      </div>
    </div>
  )
}
