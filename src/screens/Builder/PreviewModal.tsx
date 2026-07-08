import { useEffect, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, X, Monitor, Smartphone } from 'lucide-react'
import { C } from '../../theme.ts'
import { Modal } from '../../components/ui/Modal.tsx'
import { NavBtn } from '../../components/ui/NavBtn.tsx'
import { PresenterSlideCard } from '../Presenter/PresenterSlideCard.tsx'
import { AudienceSlideView } from '../Vote/AudienceSlideView.tsx'
import type { Draft, Slide } from '../../types.ts'

// PresenterSlideCard sizes its type via vw-relative clamp()s, which are
// meant to track the real full-screen presenter viewport — inside this
// modal's much narrower box those units instead read against the whole
// browser window, rendering text far too large for the box and forcing a
// scrollbar. Rendering the card at a realistic full-size reference canvas
// (so the same vw units resolve close to how they would on an actual
// presenter screen) and then shrinking the whole thing with transform:scale
// keeps every proportion — text, padding, charts — identical to the real
// slide, just smaller. Same technique as MiniSlidePreview's thumbnails.
const PRESENTER_CANVAS_W = 1280
const PRESENTER_CANVAS_H = 720

interface PreviewModalProps {
  draft: Draft
  startIndex?: number
  onClose: () => void
}

export function PreviewModal({draft,startIndex,onClose}: PreviewModalProps){
  const [idx,setIdx]=useState(startIndex||0)
  const [revealedSlides,setRevealedSlides]=useState<Set<string>>(() => new Set())
  const [choiceInput,setChoiceInput]=useState<number | null>(null)
  const [textInput,setTextInput]=useState('')
  const [voted,setVoted]=useState(false)
  const [qnaDraft,setQnaDraft]=useState('')
  const rawSlide=draft.slides[idx]

  useEffect(() => {
    setChoiceInput(null); setTextInput(''); setVoted(false); setQnaDraft('')
  }, [idx])

  if (!rawSlide) return null
  const session={title:draft.title||'Untitled presentation',qnaModeration:!!draft.qnaModeration}

  // Mirrors MiniSlidePreview's placeholder text and App.tsx's blank-option
  // filtering (applied server-side before a Pulse actually goes live) — so a
  // still-being-edited slide previews identically to its Home tile/thumbnail
  // instead of showing a blank title or empty option rows that will never
  // actually appear once presented.
  const question=rawSlide.question?.trim()||(rawSlide.type==='qa'?'Ask a question':'Untitled question')
  const slide: Slide = rawSlide.type==='choice'
    ? (() => {
        const validEntries=rawSlide.options
          .map((opt,i)=>({opt,i}))
          .filter(e=>e.opt&&e.opt.trim())
        return {...rawSlide, question,
          options:validEntries.map(e=>e.opt),
          optionImages:validEntries.map(e=>(rawSlide.optionImages||[])[e.i]??null)}
      })()
    : {...rawSlide, question}

  return(
    <Modal onClose={onClose} maxWidth={920}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div style={{fontSize:12,color:C.txt4,fontWeight:500,letterSpacing:1}}>PREVIEW · {idx+1} / {draft.slides.length}</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:6}}>
          <X size={18}/>
        </button>
      </div>

      <div style={{display:'flex',gap:28,flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start'}}>
        <div style={{flex:'1 1 420px',minWidth:280,maxWidth:560}}>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center',marginBottom:12,color:C.txt3,fontWeight:500,fontSize:12,letterSpacing:1}}>
            <Monitor size={14}/> DESKTOP · PRESENTER SCREEN
          </div>
          <div style={{width:'100%',aspectRatio:'16/9',overflow:'hidden',position:'relative',containerType:'inline-size'} as CSSProperties}>
            <div style={{position:'absolute',top:'50%',left:'50%',width:PRESENTER_CANVAS_W,height:PRESENTER_CANVAS_H,
              transform:`translate(-50%,-50%) scale(calc(100cqw / ${PRESENTER_CANVAS_W}px))`,transformOrigin:'center center',
              display:'flex',justifyContent:'center'}}>
              <PresenterSlideCard slide={slide} list={[]}
                revealedSlides={revealedSlides} onReveal={id=>setRevealedSlides(prev=>new Set(prev).add(id))}
                qnaList={[]} onModerate={()=>{}}
                showJoinPanel={false} joinCode="" audienceCount={0} copied={false}
                onCopyJoinCode={()=>{}} onCloseJoinPanel={()=>{}}/>
            </div>
          </div>
        </div>

        <div style={{flex:'0 0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center',marginBottom:12,color:C.txt3,fontWeight:500,fontSize:12,letterSpacing:1}}>
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
