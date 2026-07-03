import type { Dispatch, SetStateAction } from 'react'
import { Check } from 'lucide-react'
import { C, FONT_DISPLAY, FONT_BODY, PALETTE_BARS } from '../../theme.ts'
import { AudienceQna } from './AudienceQna.tsx'
import { RichContentView } from '../../components/RichContentView.tsx'
import type { Session, Slide, Question } from '../../types.ts'

interface AudienceSlideViewProps {
  session: Session | { title: string; qnaModeration: boolean }
  slide: Slide
  voted: boolean
  choiceInput: number | null
  setChoiceInput: Dispatch<SetStateAction<number | null>>
  textInput: string
  setTextInput: Dispatch<SetStateAction<string>>
  submitting: boolean
  onSubmit: () => void
  qnaList: Question[]
  participantId: string
  qnaDraft: string
  setQnaDraft: Dispatch<SetStateAction<string>>
  qnaSubmitting: boolean
  onSubmitQuestion: () => void
}

export function AudienceSlideView({session,slide,voted,choiceInput,setChoiceInput,textInput,setTextInput,submitting,onSubmit,qnaList,participantId,qnaDraft,setQnaDraft,qnaSubmitting,onSubmitQuestion}: AudienceSlideViewProps){
  return(
    <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:480,margin:'0 auto',width:'100%'}}>
      <div style={{fontSize:12,color:C.txt4,letterSpacing:1.5,textAlign:'center',marginBottom:8,fontWeight:700}}>{session.title.toUpperCase()}</div>
      {slide.contentImage&&(
        <img src={slide.contentImage} alt="" style={{width:'100%',borderRadius:6,marginBottom:16,display:'block'}}/>
      )}
      {slide.type!=='plain'&&(
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:26,fontWeight:700,textAlign:'center',margin:'0 0 26px',color:C.txt1}}>
          {slide.question || (slide.type==='qa' ? 'Ask a question' : '')}
        </h2>
      )}
      {slide.type==='qa'?(
        <AudienceQna session={session} qnaList={qnaList} participantId={participantId} qnaDraft={qnaDraft} setQnaDraft={setQnaDraft} qnaSubmitting={qnaSubmitting} onSubmitQuestion={onSubmitQuestion}/>
      ):slide.type==='plain'?(
        <RichContentView content={slide.content}/>
      ):voted?(
        <div style={{textAlign:'center',padding:'30px 10px'}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:C.tealBg,border:`2px solid ${C.tealBorder}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',animation:'pop .4s ease'}}>
            <Check size={28} color={C.teal}/>
          </div>
          <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:19,color:C.txt1}}>Response submitted!</div>
          <div style={{color:C.txt3,fontSize:14,marginTop:6,fontWeight:600}}>Check the presentation screen for live results.</div>
        </div>
      ):(
        <>
          {slide.type==='choice'&&(()=>{
            const hasImages=(slide.optionImages||[]).some(Boolean)
            return hasImages?(
              <div style={{display:'flex',flexWrap:'wrap',gap:12,justifyContent:'center'}}>
                {slide.options.map((opt,i)=>{
                  const img=(slide.optionImages||[])[i],color=PALETTE_BARS[i%PALETTE_BARS.length],selected=choiceInput===i
                  return(
                    <button key={i} onClick={()=>setChoiceInput(i)}
                      style={{flex:'1 1 110px',maxWidth:145,padding:'14px 8px',borderRadius:5,
                        border:`2px solid ${selected?color:C.border}`,
                        background:selected?`${color}12`:C.surface,color:C.txt1,cursor:'pointer',textAlign:'center',
                        boxShadow:selected?`0 4px 16px ${color}30`:C.shadow,
                        transform:selected?'scale(1.03)':'scale(1)',transition:'all .15s ease'}}>
                      <div style={{width:58,height:58,borderRadius:'50%',margin:'0 auto 10px',border:`2.5px solid ${selected?color:C.border}`,overflow:'hidden',background:img?'transparent':`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {img?<img src={img} alt={opt} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            :<span style={{fontFamily:FONT_DISPLAY,fontSize:22,fontWeight:700,color}}>{opt.charAt(0).toUpperCase()}</span>}
                      </div>
                      <div style={{fontSize:13,fontWeight:700,fontFamily:FONT_DISPLAY,color:selected?color:C.txt1}}>{opt}</div>
                    </button>
                  )
                })}
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {slide.options.map((opt,i)=>{
                  const color=PALETTE_BARS[i%PALETTE_BARS.length],selected=choiceInput===i
                  return(
                    <button key={i} onClick={()=>setChoiceInput(i)}
                      style={{textAlign:'left',padding:'14px 16px',borderRadius:4,
                        border:`2px solid ${selected?color:C.border}`,
                        background:selected?`${color}10`:C.surface,
                        color:selected?color:C.txt1,fontSize:15,fontWeight:700,cursor:'pointer',
                        boxShadow:selected?`0 3px 12px ${color}28`:C.shadow,
                        transform:selected?'scale(1.01)':'scale(1)',transition:'all .15s ease'}}>
                      {opt}
                    </button>
                  )
                })}
              </div>
            )
          })()}
          {slide.type==='wordcloud'&&(
            <input value={textInput} onChange={e=>setTextInput(e.target.value.slice(0,30))} placeholder="One word or short phrase"
              style={{width:'100%',padding:'14px 16px',borderRadius:4,border:`2px solid ${C.border}`,background:C.surface,color:C.txt1,fontSize:15,fontWeight:700,outline:'none',boxShadow:C.shadow}}/>
          )}
          {slide.type==='open'&&(
            <textarea value={textInput} onChange={e=>setTextInput(e.target.value.slice(0,140))} placeholder="Type your response…" rows={4}
              style={{width:'100%',padding:'14px 16px',borderRadius:4,border:`2px solid ${C.border}`,background:C.surface,color:C.txt1,fontSize:15,fontWeight:700,outline:'none',resize:'none',fontFamily:FONT_BODY,boxShadow:C.shadow}}/>
          )}
          {(() => {
            const disabled=submitting||(slide.type==='choice'?choiceInput===null:!textInput.trim())
            return(
              <button onClick={onSubmit} disabled={disabled}
                style={{marginTop:20,padding:'14px',borderRadius:5,border:'none',
                  background:disabled?C.disabledBtn:C.purple,color:disabled?C.txtDis:'#fff',
                  fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:16,cursor:disabled?'not-allowed':'pointer',
                  boxShadow:disabled?'none':`0 4px 20px ${C.purpleBg}`,transition:'all .2s ease'}}>
                {submitting?'Submitting…':'Submit'}
              </button>
            )
          })()}
        </>
      )}
    </div>
  )
}
