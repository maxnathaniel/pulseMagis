import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Users, QrCode } from 'lucide-react'
import { C } from '../../theme.js'
import { TopBar } from '../../components/ui/TopBar.jsx'
import { NavBtn } from '../../components/ui/NavBtn.jsx'
import { JoinPanel } from '../../components/JoinPanel.jsx'
import { PresenterSlideCard } from './PresenterSlideCard.jsx'

export function Presenter({session,slideIndex,responses,goToSlide,copyCode,copied,onExit,qnaList,onModerate,onToggleModeration,audienceCount}){
  const [showJoinPanel,setShowJoinPanel]=useState(true)
  const [revealedSlides,setRevealedSlides]=useState(() => new Set())
  const slide=session.slides[slideIndex]
  const list=responses[slide.id]||[]
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:'18px 18px 26px',minHeight:0}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <TopBar onBack={onExit} label="End presentation"/>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.red,fontWeight:800,letterSpacing:.5}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:C.red,display:'inline-block',animation:'pulseDot 1.5s infinite'}}/> LIVE
          </div>
          <div title="People currently in the room" style={{display:'flex',alignItems:'center',gap:5,fontSize:13,color:C.txt2,fontWeight:700}}><Users size={15}/>{audienceCount}</div>
          {!showJoinPanel&&(
            <button onClick={()=>setShowJoinPanel(true)} title="Show join panel"
              style={{display:'flex',alignItems:'center',gap:6,padding:'7px 12px',borderRadius:5,
                border:`1.5px solid ${C.border}`,background:C.surface,color:C.txt2,cursor:'pointer',
                fontSize:12.5,fontWeight:700}}>
              <QrCode size={14}/> Join panel
            </button>
          )}
        </div>
      </div>
      <div style={{flex:1,display:'flex',gap:20,marginTop:16,minHeight:0}}>
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px 0',minHeight:0}}>
            <PresenterSlideCard slide={slide} slideIndex={slideIndex} totalSlides={session.slides.length} list={list}
              revealedSlides={revealedSlides} onReveal={id=>setRevealedSlides(prev=>new Set(prev).add(id))}
              qnaList={qnaList} session={session} onModerate={onModerate} onToggleModeration={onToggleModeration}/>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16}}>
            <NavBtn onClick={()=>goToSlide(slideIndex-1)} disabled={slideIndex===0}><ChevronLeft size={18}/></NavBtn>
            <div style={{fontSize:13,color:C.txt3,fontWeight:700}}>{slideIndex+1} / {session.slides.length}</div>
            <NavBtn onClick={()=>goToSlide(slideIndex+1)} disabled={slideIndex===session.slides.length-1}><ChevronRight size={18}/></NavBtn>
          </div>
        </div>
        {showJoinPanel&&(
          <div style={{width:360,flexShrink:0,display:'flex',alignItems:'center'}}>
            <JoinPanel code={session.code} audienceCount={audienceCount} copied={copied} onCopy={copyCode}
              onClose={()=>setShowJoinPanel(false)}/>
          </div>
        )}
      </div>
    </div>
  )
}
