import { useState, useEffect } from 'react'
import { PresenterSlideCard } from './PresenterSlideCard.tsx'
import type { Session, Question, ResponsesBySlide, ModerateAction } from '../../types.ts'

interface PresenterProps {
  session: Session
  slideIndex: number
  responses: ResponsesBySlide
  goToSlide: (idx: number) => void
  copyCode: () => void
  copied: boolean
  onExit: () => void
  exiting?: boolean
  qnaList: Question[]
  onModerate: (qId: string, action: ModerateAction) => void
  audienceCount: number
}

export function Presenter({session,slideIndex,responses,goToSlide,copyCode,copied,onExit,exiting,qnaList,onModerate,audienceCount}: PresenterProps){
  const [showJoinPanel,setShowJoinPanel]=useState(true)
  const [revealedSlides,setRevealedSlides]=useState<Set<string>>(() => new Set())
  const [isFullscreen,setIsFullscreen]=useState(false)
  const slide=session.slides[slideIndex]
  const list=responses[slide.id]||[]

  useEffect(() => {
    const handler=() => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen=() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen()
  }
  const handleExit=() => {
    if (exiting) return
    if (document.fullscreenElement) document.exitFullscreen()
    onExit()
  }

  useEffect(() => {
    const handler=(e: KeyboardEvent) => {
      const target=e.target as HTMLElement | null
      if (target&&(target.tagName==='INPUT'||target.tagName==='TEXTAREA'||target.isContentEditable)) return
      if (e.key==='ArrowLeft') goToSlide(slideIndex-1)
      else if (e.key==='ArrowRight') goToSlide(slideIndex+1)
      else if (e.key==='Escape'&&!document.fullscreenElement) handleExit()
      // Escape while fullscreen is left to the browser's native fullscreen
      // exit (which our fullscreenchange listener already picks up) — the
      // keydown still fires with fullscreenElement set at this point, so the
      // guard above skips ending the presentation on that same keypress.
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [slideIndex, session.slides.length])

  return(
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:0,background:'#000'}}>
      <PresenterSlideCard slide={slide} list={list}
        revealedSlides={revealedSlides} onReveal={id=>setRevealedSlides(prev=>new Set(prev).add(id))}
        qnaList={qnaList} onModerate={onModerate}
        showJoinPanel={showJoinPanel} joinCode={session.code} audienceCount={audienceCount} copied={copied}
        onCopyJoinCode={copyCode} onCloseJoinPanel={()=>setShowJoinPanel(false)}
        showChrome onExit={handleExit} exiting={exiting} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen}
        onShowJoinPanel={()=>setShowJoinPanel(true)}
        onPrev={()=>goToSlide(slideIndex-1)} prevDisabled={slideIndex===0}
        onNext={()=>goToSlide(slideIndex+1)} nextDisabled={slideIndex===session.slides.length-1}/>
    </div>
  )
}
