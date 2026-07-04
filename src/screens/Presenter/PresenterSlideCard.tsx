import { useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, Users, QrCode, X, Maximize2, Minimize2 } from 'lucide-react'
import { C, FONT_DISPLAY, VERTICAL_ALIGN_CSS } from '../../theme.ts'
import { ModerationPanel } from '../../components/ModerationPanel.tsx'
import { JoinPanel } from '../../components/JoinPanel.tsx'
import { NavBtn } from '../../components/ui/NavBtn.tsx'
import { ChoiceResults } from '../../components/results/ChoiceResults.tsx'
import { WordCloudResults } from '../../components/results/WordCloudResults.tsx'
import { OpenResults } from '../../components/results/OpenResults.tsx'
import { RichContentView } from '../../components/RichContentView.tsx'
import type { Slide, Session, Question, ModerateAction } from '../../types.ts'

const iconBtnStyle: CSSProperties = {
  width:38,height:38,borderRadius:'50%',border:'none',background:C.surface,color:C.txt2,
  boxShadow:C.shadow,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,
}

interface PresenterSlideCardProps {
  slide: Slide
  slideIndex: number
  totalSlides: number
  list: (string | number)[]
  revealedSlides: Set<string>
  onReveal: (id: string) => void
  qnaList: Question[]
  session: Session | { title: string; qnaModeration: boolean }
  onModerate: (qId: string, action: ModerateAction) => void
  onToggleModeration: () => void
  showJoinPanel: boolean
  joinCode: string
  audienceCount: number
  copied: boolean
  onCopyJoinCode: () => void
  onCloseJoinPanel: () => void
  // Floating corner chrome (exit/fullscreen/live/audience/nav) — omit on the
  // Builder preview, which has no live session, fullscreen, or navigation.
  showChrome?: boolean
  onExit?: () => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  onShowJoinPanel?: () => void
  onPrev?: () => void
  prevDisabled?: boolean
  onNext?: () => void
  nextDisabled?: boolean
}

export function PresenterSlideCard({slide,slideIndex,totalSlides,list,revealedSlides,onReveal,qnaList,session,onModerate,onToggleModeration,
  showJoinPanel,joinCode,audienceCount,copied,onCopyJoinCode,onCloseJoinPanel,
  showChrome,onExit,isFullscreen,onToggleFullscreen,onShowJoinPanel,onPrev,prevDisabled,onNext,nextDisabled}: PresenterSlideCardProps){
  const [hovTopLeft,setHovTopLeft]=useState(false)
  const [hovBottomLeft,setHovBottomLeft]=useState(false)
  const pendingCount=qnaList.filter(q=>q.status==='pending').length
  const imageCol=slide.contentImage&&(
    <div style={{flex:'0 0 20%',minWidth:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <img src={slide.contentImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:5}}/>
    </div>
  )
  // The image column always bleeds flush to whichever card edge it sits
  // against — the 48px/56px inset only applies to whichever item (content or
  // the join panel) actually touches that edge instead.
  const imageBeforeContent=!!imageCol&&slide.layout==='left'
  const imageAfterContent=!!imageCol&&slide.layout!=='left'
  const contentIsLeftEdge=!imageBeforeContent
  const contentIsRightEdge=!imageAfterContent&&!showJoinPanel
  return(
    <div style={{position:'relative',background:C.surface,borderRadius:4,boxShadow:C.shadow,padding:'48px 0',
      width:'auto',maxWidth:'100%',height:'100%',aspectRatio:'16/9',overflowY:'auto',display:'flex',gap:24}}>
      {showChrome&&(
        <>
          <div onMouseEnter={()=>setHovTopLeft(true)} onMouseLeave={()=>setHovTopLeft(false)}
            style={{position:'absolute',top:0,left:0,width:140,height:100,zIndex:5,padding:16,display:'flex',alignItems:'flex-start'}}>
            <div style={{display:'flex',gap:8,opacity:hovTopLeft?1:0,pointerEvents:hovTopLeft?'auto':'none',transition:'opacity .15s ease'}}>
              <button onClick={onExit} title="End presentation" style={iconBtnStyle}><X size={16}/></button>
              <button onClick={onToggleFullscreen} title={isFullscreen?'Exit full screen':'Full screen'} style={iconBtnStyle}>
                {isFullscreen?<Minimize2 size={16}/>:<Maximize2 size={16}/>}
              </button>
            </div>
          </div>

          <div style={{position:'absolute',top:16,right:16,zIndex:5,display:'flex',alignItems:'center',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.red,fontWeight:800,letterSpacing:.5}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:C.red,display:'inline-block',animation:'pulseDot 1.5s infinite'}}/> LIVE
            </div>
            <div title="People currently in the room" style={{display:'flex',alignItems:'center',gap:5,fontSize:13,color:C.txt2,fontWeight:700}}><Users size={15}/>{audienceCount}</div>
            {!showJoinPanel&&(
              <button onClick={onShowJoinPanel} title="Show join panel" style={iconBtnStyle}>
                <QrCode size={14}/>
              </button>
            )}
          </div>

          <div onMouseEnter={()=>setHovBottomLeft(true)} onMouseLeave={()=>setHovBottomLeft(false)}
            style={{position:'absolute',bottom:0,left:0,width:140,height:100,zIndex:5,padding:16,display:'flex',alignItems:'flex-end'}}>
            <div style={{display:'flex',gap:12,opacity:hovBottomLeft?1:0,pointerEvents:hovBottomLeft?'auto':'none',transition:'opacity .15s ease'}}>
              <NavBtn onClick={onPrev!} disabled={prevDisabled}><ChevronLeft size={18}/></NavBtn>
              <NavBtn onClick={onNext!} disabled={nextDisabled}><ChevronRight size={18}/></NavBtn>
            </div>
          </div>
        </>
      )}

      {slide.layout==='left'&&imageCol}
      <div style={{flex:'1 1 0%',minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        paddingLeft:contentIsLeftEdge?56:0,paddingRight:contentIsRightEdge?56:0}}>
        {slide.type==='qa'?(
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16}}>
              <h2 style={{fontFamily:FONT_DISPLAY,fontSize:'clamp(22px,3.5vw,30px)',fontWeight:700,textAlign:'center',margin:0,color:C.txt1}}>
                {slide.question||'Ask a question'}
              </h2>
              {pendingCount>0&&<span style={{background:C.red,color:'#fff',fontSize:11,fontWeight:800,borderRadius:999,minWidth:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 5px'}}>{pendingCount}</span>}
            </div>
            <div style={{width:'100%'}}>
              <ModerationPanel session={session as Session} qnaList={qnaList} onModerate={onModerate} onToggleModeration={onToggleModeration}/>
            </div>
          </>
        ):slide.type==='plain'?(
          <>
            <div style={{fontSize:12,color:C.txt4,marginBottom:8,letterSpacing:1.5,fontWeight:700,flexShrink:0}}>SLIDE {slideIndex+1} OF {totalSlides}</div>
            <div style={{flex:1,minHeight:0,width:'100%',display:'flex',flexDirection:'column',
              justifyContent:VERTICAL_ALIGN_CSS[slide.verticalAlign||'middle']}}>
              <RichContentView content={slide.content}/>
            </div>
          </>
        ):(
          <>
            <div style={{fontSize:12,color:C.txt4,marginBottom:8,letterSpacing:1.5,fontWeight:700,flexShrink:0}}>SLIDE {slideIndex+1} OF {totalSlides}</div>
            <h2 style={{fontFamily:FONT_DISPLAY,fontSize:'clamp(24px,4vw,36px)',fontWeight:700,textAlign:'center',margin:'0 0 8px',color:C.txt1,flexShrink:0}}>{slide.question}</h2>
            <div style={{fontSize:12.5,color:C.txt3,fontWeight:700,marginBottom:22,flexShrink:0}}>{list.length} response{list.length!==1?'s':''} to this slide</div>
            <div style={{flex:1,minHeight:0,width:'100%',display:'flex',flexDirection:'column'}}>
              {(() => {
                const mode=slide.responseMode||'instant'
                if (mode==='private') return null
                if (mode==='onclick'&&!revealedSlides.has(slide.id)) {
                  return (
                    <button onClick={()=>onReveal(slide.id)}
                      style={{margin:'0 auto',display:'block',padding:'12px 28px',borderRadius:5,border:'none',
                        background:C.purple,color:'#fff',fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:15,
                        cursor:'pointer',boxShadow:`0 4px 20px ${C.purpleBg}`}}>
                      Reveal results
                    </button>
                  )
                }
                return (<>
                  {slide.type==='choice'   &&<ChoiceResults slide={slide} list={list}/>}
                  {slide.type==='wordcloud'&&<WordCloudResults list={list as string[]}/>}
                  {slide.type==='open'     &&<OpenResults list={list}/>}
                </>)
              })()}
            </div>
          </>
        )}
      </div>
      {slide.layout!=='left'&&imageCol}
      {showJoinPanel&&(
        <div style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',paddingRight:56}}>
          <JoinPanel code={joinCode} audienceCount={audienceCount} copied={copied}
            onCopy={onCopyJoinCode} onClose={onCloseJoinPanel}/>
        </div>
      )}
    </div>
  )
}
