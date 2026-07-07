import { useEffect, useState, type CSSProperties } from 'react'
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

export function PresenterSlideCard({slide,list,revealedSlides,onReveal,qnaList,session,onModerate,onToggleModeration,
  showJoinPanel,joinCode,audienceCount,copied,onCopyJoinCode,onCloseJoinPanel,
  showChrome,onExit,isFullscreen,onToggleFullscreen,onShowJoinPanel,onPrev,prevDisabled,onNext,nextDisabled}: PresenterSlideCardProps){
  const [hovTopLeft,setHovTopLeft]=useState(false)
  const [hovBottomLeft,setHovBottomLeft]=useState(false)
  // The panel column stays permanently mounted and is animated via a
  // max-width/opacity transition (rather than unmounting) so the adjacent
  // slide content — which is flex:1 — reflows on the same timeline instead
  // of snapping the instant the panel appears/disappears.
  const [panelOpen,setPanelOpen]=useState(false)
  // Distinguishes "hasn't entered yet" from "closed after having been open" —
  // the resting offset differs (off to the left before the first entrance,
  // off to the right after closing), so a single open/closed boolean can't
  // drive both directions on its own.
  const [panelHasOpened,setPanelHasOpened]=useState(false)
  useEffect(() => {
    if (showJoinPanel) {
      // Delayed so the entrance is a visible slide rather than something
      // that's already resolved by the time the presenter view settles.
      const t=setTimeout(()=>{ setPanelOpen(true); setPanelHasOpened(true) }, 300)
      return ()=>clearTimeout(t)
    }
    setPanelOpen(false)
  }, [showJoinPanel])
  const imageCol=slide.contentImage&&(
    <div style={{flex:'0 0 25%',minWidth:0,overflow:'hidden',borderRadius:5}}>
      <img src={slide.contentImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
    </div>
  )
  // The image column always bleeds flush to whichever card edge it sits
  // against — the 48px/56px inset only applies to whichever item (content or
  // the join panel) actually touches that edge instead.
  const imageBeforeContent=!!imageCol&&slide.layout==='left'
  const imageAfterContent=!!imageCol&&slide.layout!=='left'
  const contentIsLeftEdge=!imageBeforeContent
  const contentIsRightEdge=!imageAfterContent&&!panelOpen
  return(
    <div style={{position:'relative',background:C.surface,borderRadius:4,boxShadow:C.shadow,padding:'48px 0',
      width:'auto',maxWidth:'100%',height:'100%',aspectRatio:'16/9',overflowY:'auto',display:'flex'}}>
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

      <div style={{flex:'1 1 0%',minWidth:0,display:'flex',gap:24}}>
      {slide.layout==='left'&&imageCol}
      <div style={{flex:'1 1 0%',minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        paddingLeft:contentIsLeftEdge?56:0,paddingRight:contentIsRightEdge?56:0,
        transition:'padding 1.1s cubic-bezier(0.34,1.15,0.64,1)'}}>
        {slide.type==='qa'?(
          <div style={{flex:1,minHeight:0,width:'100%',display:'flex',flexDirection:'column'}}>
            <div style={{width:'100%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'flex-start',gap:8,marginBottom:16}}>
              <h2 style={{fontFamily:FONT_DISPLAY,fontSize:'clamp(22px,3.5vw,30px)',fontWeight:700,textAlign:'left',margin:0,color:C.txt1}}>
                {slide.question||'Ask a question'}
              </h2>
            </div>
            <div style={{width:'100%',flex:1,minHeight:0,display:'flex',flexDirection:'column'}}>
              {/* PresenterSlideCard always renders the presented/projected
                slide — in both the live session and the Builder's preview
                mockup — so moderation controls never belong here; they're
                host-only and live in the Builder's Edit panel plus the
                dedicated moderator-link screen instead. */}
              <ModerationPanel session={session as Session} qnaList={qnaList} onModerate={onModerate} onToggleModeration={onToggleModeration} audienceView/>
            </div>
          </div>
        ):slide.type==='plain'?(
          <>
            <div style={{flex:1,minHeight:0,width:'100%',display:'flex',flexDirection:'column',
              justifyContent:VERTICAL_ALIGN_CSS[slide.verticalAlign||'middle']}}>
              <RichContentView content={slide.content}/>
            </div>
          </>
        ):(
          <>
            <h2 style={{width:'100%',fontFamily:FONT_DISPLAY,fontSize:'clamp(24px,4vw,36px)',fontWeight:700,textAlign:'left',margin:'0 0 30px',color:C.txt1,flexShrink:0}}>{slide.question}</h2>
            <div style={{flex:1,minHeight:0,width:'100%',
              // Matches Builder's SlideEditor sizing for the same content so a
              // choice slide's response shape doesn't grow to fill the far
              // wider presenter stage — 70% of the whole slide's width, which
              // (since the image column is a fixed 25% of the slide when
              // present) works out to 93.33% of this column's own width.
              maxWidth:slide.type==='choice'?(imageCol?'93.33%':'70%'):undefined,
              margin:slide.type==='choice'?'0 auto':undefined,
              display:'flex',flexDirection:'column'}}>
              {(() => {
                const mode=slide.responseMode||'instant'
                // Private: only a response count is shown (the line above,
                // always rendered) — the breakdown itself must stay hidden
                // and never reveal real proportions, but the chart's shape
                // should still read as "this slide's chosen format" rather
                // than vanishing outright. Force an empty list so it renders
                // its normal zero-votes state and never updates as real
                // votes come in, regardless of the real `list` prop.
                if (mode==='private') {
                  return (<>
                    {slide.type==='choice'   &&<ChoiceResults slide={slide} format={slide.resultsFormat} list={[]}/>}
                    {slide.type==='wordcloud'&&<WordCloudResults list={[]} hideEmptyLabel/>}
                    {slide.type==='open'     &&<OpenResults list={[]} hideEmptyLabel/>}
                  </>)
                }
                if (mode==='onclick'&&!revealedSlides.has(slide.id)) {
                  return (
                    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <button onClick={()=>onReveal(slide.id)}
                        style={{padding:'12px 28px',borderRadius:5,border:'none',
                          background:C.purple,color:'#fff',fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:15,
                          cursor:'pointer',boxShadow:`0 4px 20px ${C.purpleBg}`}}>
                        Reveal results
                      </button>
                    </div>
                  )
                }
                // Keyed by slide id so switching to a different slide (or
                // revealing this one) always mounts a fresh instance — the
                // chart formats animate their entrance on mount, and without
                // this key React would just update props on the same
                // instance when navigating between two already-revealed
                // slides, silently skipping the entrance animation.
                return (<>
                  {slide.type==='choice'   &&<ChoiceResults key={slide.id} slide={slide} format={slide.resultsFormat} list={list}/>}
                  {slide.type==='wordcloud'&&<WordCloudResults key={slide.id} list={list as string[]}/>}
                  {slide.type==='open'     &&<OpenResults key={slide.id} list={list}/>}
                </>)
              })()}
            </div>
          </>
        )}
      </div>
      {slide.layout!=='left'&&imageCol}
      </div>
      {/* Spacing to this column comes from its own marginLeft (not the row's
        gap) so a closed panel — still mounted at maxWidth 0 for its
        open/close transition — contributes zero gap instead of leaving a
        phantom 24px margin against the card's trailing edge. */}
      <div style={{flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',
        maxWidth:panelOpen?500:0,marginLeft:panelOpen?24:0,paddingRight:panelOpen?56:0,opacity:panelOpen?1:0,
        transition:'max-width 1.1s cubic-bezier(0.34,1.15,0.64,1), margin-left 1.1s cubic-bezier(0.34,1.15,0.64,1), padding 1.1s cubic-bezier(0.34,1.15,0.64,1), opacity .6s ease'}}>
        <div style={{flexShrink:0,
          transform:`translateX(${panelOpen?0:(panelHasOpened?100:-100)}px)`,
          transition:'transform 1.1s cubic-bezier(0.34,1.15,0.64,1)'}}>
          <JoinPanel code={joinCode} audienceCount={audienceCount} copied={copied}
            onCopy={onCopyJoinCode} onClose={onCloseJoinPanel}/>
          {(slide.type==='choice'||slide.type==='wordcloud'||slide.type==='open')&&(
            <div style={{marginTop:18,textAlign:'center',fontFamily:FONT_DISPLAY,fontSize:22,fontWeight:700,color:C.txt2}}>
              {list.length} response{list.length!==1?'s':''}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
