import type { Dispatch, SetStateAction } from 'react'
import { Ticket } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'
import { TopBar } from '../../components/ui/TopBar.tsx'

interface JoinProps {
  joinCode: string
  setJoinCode: Dispatch<SetStateAction<string>>
  joinError: string
  joinLoading: boolean
  onSubmit: (codeOverride?: string) => void
  onBack: () => void
}

export function Join({joinCode,setJoinCode,joinError,joinLoading,onSubmit,onBack}: JoinProps){
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:'18px'}}>
      <TopBar onBack={onBack} label="Back"/>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:64,height:64,borderRadius:6,background:C.tealBg,border:`2px solid ${C.tealBorder}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
          <Ticket size={30} color={C.teal}/>
        </div>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:28,fontWeight:500,margin:'0 0 6px',color:C.txt1}}>Enter the code</h2>
        <p style={{color:C.txt3,fontSize:14,marginBottom:24,fontWeight:400}}>Find it on the presenter's screen</p>
        <input value={joinCode} onChange={e=>setJoinCode(e.target.value.replace(/\D/g,'').slice(0,6))} onKeyDown={e=>e.key==='Enter'&&onSubmit()}
          placeholder="000000" inputMode="numeric"
          style={{width:290,textAlign:'center',fontFamily:FONT_DISPLAY,fontSize:34,fontWeight:500,letterSpacing:7,background:C.surface,border:`2px solid ${C.border}`,borderRadius:5,color:C.txt1,padding:'14px 10px 14px 17px',outline:'none',boxShadow:C.shadow}}/>
        {joinError&&<div style={{color:C.red,fontSize:13,marginTop:14,maxWidth:260,textAlign:'center',fontWeight:500}}>{joinError}</div>}
        <button onClick={()=>onSubmit()} disabled={joinLoading}
          style={{marginTop:24,padding:'13px 40px',borderRadius:9999,border:'none',background:C.teal,color:'#fff',fontFamily:FONT_DISPLAY,fontWeight:500,fontSize:16,cursor:joinLoading?'wait':'pointer',boxShadow:`0 4px 16px ${C.tealBg}`}}>
          {joinLoading?'Joining…':'Join'}
        </button>
      </div>
    </div>
  )
}
