import type { Dispatch, SetStateAction } from 'react'
import { Radio } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'

type LoginMode = 'signin' | 'signup'

interface LoginProps {
  mode: LoginMode
  setMode: Dispatch<SetStateAction<LoginMode>>
  email: string
  setEmail: Dispatch<SetStateAction<string>>
  password: string
  setPassword: Dispatch<SetStateAction<string>>
  loading: boolean
  error: string
  onSubmit: () => void
}

export function Login({mode,setMode,email,setEmail,password,setPassword,loading,error,onSubmit}: LoginProps){
  const isSignup=mode==='signup'
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
      <div style={{width:64,height:64,borderRadius:6,background:C.purpleBg,border:`2px solid ${C.purple}55`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
        <Radio size={30} color={C.purple}/>
      </div>
      <h2 style={{fontFamily:FONT_DISPLAY,fontSize:28,fontWeight:700,margin:'0 0 6px',color:C.txt1}}>
        {isSignup?'Create your account':'Welcome back'}
      </h2>
      <p style={{color:C.txt3,fontSize:14,marginBottom:24,fontWeight:600}}>
        {isSignup?'Sign up to start creating Pulses':'Sign in to see your Pulses'}
      </p>
      <div style={{width:'100%',maxWidth:340,display:'flex',flexDirection:'column',gap:12}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onSubmit()}
          placeholder="Email" type="email" autoComplete="email"
          style={{width:'100%',background:C.surface,border:`2px solid ${C.border}`,borderRadius:5,color:C.txt1,
            padding:'13px 16px',outline:'none',boxShadow:C.shadow,fontSize:15,fontWeight:600}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onSubmit()}
          placeholder="Password" type="password" autoComplete={isSignup?'new-password':'current-password'}
          style={{width:'100%',background:C.surface,border:`2px solid ${C.border}`,borderRadius:5,color:C.txt1,
            padding:'13px 16px',outline:'none',boxShadow:C.shadow,fontSize:15,fontWeight:600}}/>
      </div>
      {error&&<div style={{color:C.red,fontSize:13,marginTop:14,maxWidth:300,textAlign:'center',fontWeight:700}}>{error}</div>}
      <button onClick={()=>onSubmit()} disabled={loading}
        style={{marginTop:20,padding:'13px 40px',borderRadius:5,border:'none',background:C.purple,color:'#fff',
          fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:16,cursor:loading?'wait':'pointer',boxShadow:`0 4px 16px ${C.purpleBg}`}}>
        {loading?'Please wait…':(isSignup?'Sign up':'Sign in')}
      </button>
      <button onClick={()=>setMode(isSignup?'signin':'signup')}
        style={{marginTop:16,background:'none',border:'none',color:C.txt3,cursor:'pointer',fontSize:13.5,fontWeight:700}}>
        {isSignup?'Already have an account? Sign in':"Don't have an account? Sign up"}
      </button>
    </div>
  )
}
