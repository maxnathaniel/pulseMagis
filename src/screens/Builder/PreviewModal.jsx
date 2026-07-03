import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Monitor, Smartphone } from 'lucide-react'
import { C } from '../../theme.js'
import { Modal } from '../../components/ui/Modal.jsx'
import { NavBtn } from '../../components/ui/NavBtn.jsx'
import { PresenterSlideCard } from '../Presenter/PresenterSlideCard.jsx'
import { AudienceSlideView } from '../Vote/AudienceSlideView.jsx'

export function PreviewModal({draft,onClose}){
  const [idx,setIdx]=useState(0)
  const [revealedSlides,setRevealedSlides]=useState(() => new Set())
  const [choiceInput,setChoiceInput]=useState(null)
  const [textInput,setTextInput]=useState('')
  const [voted,setVoted]=useState(false)
  const [qnaDraft,setQnaDraft]=useState('')
  const [qnaModeration,setQnaModeration]=useState(!!draft.qnaModeration)
  const slide=draft.slides[idx]

  useEffect(() => {
    setChoiceInput(null); setTextInput(''); setVoted(false); setQnaDraft('')
  }, [idx])

  if (!slide) return null
  const session={title:draft.title||'Untitled presentation',qnaModeration}

  return(
    <Modal onClose={onClose} maxWidth={920}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div style={{fontSize:12,color:C.txt4,fontWeight:700,letterSpacing:1}}>PREVIEW · {idx+1} / {draft.slides.length}</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:6}}>
          <X size={18}/>
        </button>
      </div>

      <div style={{display:'flex',gap:28,flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start'}}>
        <div style={{flex:'1 1 420px',minWidth:280,maxWidth:560}}>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center',marginBottom:12,color:C.txt3,fontWeight:700,fontSize:12,letterSpacing:1}}>
            <Monitor size={14}/> DESKTOP · PRESENTER SCREEN
          </div>
          <div style={{height:440,display:'flex',justifyContent:'center'}}>
            <PresenterSlideCard slide={slide} slideIndex={idx} totalSlides={draft.slides.length} list={[]}
              revealedSlides={revealedSlides} onReveal={id=>setRevealedSlides(prev=>new Set(prev).add(id))}
              qnaList={[]} session={session} onModerate={()=>{}} onToggleModeration={()=>setQnaModeration(v=>!v)}/>
          </div>
        </div>

        <div style={{flex:'0 0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center',marginBottom:12,color:C.txt3,fontWeight:700,fontSize:12,letterSpacing:1}}>
            <Smartphone size={14}/> MOBILE · AUDIENCE VIEW
          </div>
          <div style={{width:340,aspectRatio:'9/19.5',padding:'20px 16px',borderRadius:28,border:`8px solid ${C.txt1}`,background:C.surfaceAlt,boxShadow:C.shadowHov,display:'flex',flexDirection:'column'}}>
            <div style={{flex:1,overflowY:'auto'}}>
              <AudienceSlideView session={session} slide={slide} voted={voted}
                choiceInput={choiceInput} setChoiceInput={setChoiceInput}
                textInput={textInput} setTextInput={setTextInput}
                submitting={false} onSubmit={()=>setVoted(true)}
                qnaList={[]} participantId="preview"
                qnaDraft={qnaDraft} setQnaDraft={setQnaDraft} qnaSubmitting={false}
                onSubmitQuestion={()=>setQnaDraft('')}/>
            </div>
          </div>
        </div>
      </div>

      {draft.slides.length>1&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:26}}>
          <NavBtn onClick={()=>setIdx(i=>i-1)} disabled={idx===0}><ChevronLeft size={18}/></NavBtn>
          <NavBtn onClick={()=>setIdx(i=>i+1)} disabled={idx===draft.slides.length-1}><ChevronRight size={18}/></NavBtn>
        </div>
      )}
    </Modal>
  )
}
