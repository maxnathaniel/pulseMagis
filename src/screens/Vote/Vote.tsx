import type { Dispatch, SetStateAction } from 'react'
import { Radio, Clock } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'
import { TopBar } from '../../components/ui/TopBar.tsx'
import { AudienceSlideView } from './AudienceSlideView.tsx'
import type { Session, Slide, Question } from '../../types.ts'

interface VoteProps {
  session: Session
  slide: Slide
  voted: boolean
  choiceInput: number | null
  setChoiceInput: Dispatch<SetStateAction<number | null>>
  textInput: string
  setTextInput: Dispatch<SetStateAction<string>>
  submitting: boolean
  onSubmit: () => void
  onLeave: () => void
  qnaList: Question[]
  participantId: string
  qnaDraft: string
  setQnaDraft: Dispatch<SetStateAction<string>>
  qnaSubmitting: boolean
  onSubmitQuestion: () => void
}

export function Vote({session,slide,voted,choiceInput,setChoiceInput,textInput,setTextInput,submitting,onSubmit,onLeave,qnaList,participantId,qnaDraft,setQnaDraft,qnaSubmitting,onSubmitQuestion}: VoteProps){
  // "Ended" (was live, now stopped) and "not started yet" (never presented)
  // both currently show as is_live:false — hasPresented is what tells them
  // apart, so someone who scans a shared QR code before the presenter has
  // even clicked Present doesn't see a misleading "this has ended" message.
  const ended=session.isLive===false && session.hasPresented
  const notStarted=session.isLive===false && !session.hasPresented

  if (notStarted) {
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'18px',minHeight:0}}>
        <TopBar onBack={onLeave} label="Leave"/>
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:C.surfaceAlt,border:`2px solid ${C.border}`,
            display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
            <Clock size={26} color={C.txt4}/>
          </div>
          <div style={{fontFamily:FONT_DISPLAY,fontWeight:500,fontSize:20,color:C.txt1}}>This Pulse hasn't started yet</div>
          <div style={{color:C.txt3,fontSize:14,marginTop:6,fontWeight:400}}>Hang tight — this page will update automatically once the presenter starts.</div>
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
          <div style={{fontFamily:FONT_DISPLAY,fontWeight:500,fontSize:20,color:C.txt1}}>This Pulse has ended</div>
          <div style={{color:C.txt3,fontSize:14,marginTop:6,fontWeight:400}}>The presenter has ended this presentation. Thanks for participating!</div>
        </div>
      </div>
    )
  }
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:'18px',minHeight:0}}>
      <AudienceSlideView session={session} slide={slide} voted={voted}
        choiceInput={choiceInput} setChoiceInput={setChoiceInput}
        textInput={textInput} setTextInput={setTextInput}
        submitting={submitting} onSubmit={onSubmit}
        qnaList={qnaList} participantId={participantId}
        qnaDraft={qnaDraft} setQnaDraft={setQnaDraft} qnaSubmitting={qnaSubmitting}
        onSubmitQuestion={onSubmitQuestion}/>
    </div>
  )
}
