import { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { C, FONT_DISPLAY } from '../theme.ts'
import { NavBtn } from './ui/NavBtn.tsx'
import { sortVisibleQuestions } from '../lib/helpers.ts'
import type { Question, ModerateAction } from '../types.ts'

interface QaSpotlightProps {
  qnaList: Question[]
  onModerate: (qId: string, action: ModerateAction) => void
}

// Shows one approved question at a time (Mentimeter-style), instead of the
// full scrollable list — the presenter cycles through with Up/Down and
// marks the current one answered with Enter.
export function QaSpotlight({qnaList,onModerate}: QaSpotlightProps){
  const visible=sortVisibleQuestions(qnaList)
  // Tracked by id, not position — the list re-sorts live as votes/answers
  // come in, so a positional index would silently jump to a different
  // question out from under the presenter. Falls back to index 0 if the
  // tracked id isn't found (first mount, or it was deleted).
  const [currentId,setCurrentId]=useState<string | null>(null)
  const idx=Math.max(0,visible.findIndex(q=>q.id===currentId))
  const current=visible[idx]

  const go=(delta: number) => {
    const next=Math.min(Math.max(idx+delta,0),visible.length-1)
    setCurrentId(visible[next]?.id ?? null)
  }

  // Separate from Presenter.tsx's ArrowLeft/Right/Escape slide-nav handler —
  // different keys, so both listeners coexist without conflict.
  useEffect(() => {
    const handler=(e: KeyboardEvent) => {
      const target=e.target as HTMLElement | null
      if (target&&(target.tagName==='INPUT'||target.tagName==='TEXTAREA'||target.isContentEditable)) return
      if (e.key==='ArrowDown') { e.preventDefault(); go(1) }
      else if (e.key==='ArrowUp') { e.preventDefault(); go(-1) }
      else if (e.key==='Enter'&&current) {
        e.preventDefault()
        // Marking answered sorts this question past the remaining unanswered
        // ones (see sortVisibleQuestions), which would otherwise strand the
        // presenter on a card that just jumped to the bottom of the list —
        // so jump to whatever now sits at this position instead.
        if (!current.answered) setCurrentId((visible[idx+1] ?? visible[idx-1] ?? null)?.id ?? null)
        onModerate(current.id,'answered')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx, visible.length, qnaList, current, onModerate])

  // Same intentional silent-empty behavior as the old audienceView list:
  // nothing on the projector until the first question is approved.
  if (visible.length===0) return null

  return (
    <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:40}}>
      <NavBtn onClick={()=>go(-1)} disabled={idx===0} size={32} flat><ChevronUp size={14}/></NavBtn>
      <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:20,paddingLeft:'16%'}}>
        <div style={{fontSize:13,fontWeight:500,color:C.txt3}}>
          {visible.filter(q=>q.answered).length}/{visible.length} answered
        </div>
        {current.answered&&(
          <span style={{padding:'4px 12px',borderRadius:999,background:C.tealBg,color:C.teal,fontSize:12,fontWeight:600,letterSpacing:.5}}>
            ANSWERED
          </span>
        )}
        <p style={{fontFamily:FONT_DISPLAY,fontWeight:400,textAlign:'left',color:C.txt1,
          fontSize:'clamp(28px,5vw,56px)',lineHeight:1.25,margin:0,maxWidth:'90%'}}>
          {current.text}
        </p>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
        <div style={{fontSize:13,fontWeight:500,color:C.txt3}}>{idx+1} / {visible.length}</div>
        <NavBtn onClick={()=>go(1)} disabled={idx===visible.length-1} size={32} flat><ChevronDown size={14}/></NavBtn>
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'14px 14px',borderRadius:999,background:C.surfaceAlt,color:C.txt3,fontSize:13,fontWeight:400}}>
          Press
          <span style={{padding:'2px 8px',borderRadius:6,background:C.txt1,color:'#fff',fontSize:11,fontWeight:600,letterSpacing:.5}}>ENTER</span>
          to mark as {current.answered?'unanswered':'answered'}
        </div>
      </div>
    </div>
  )
}
