import { C, FONT_DISPLAY, VERTICAL_ALIGN_CSS } from '../../theme.ts'
import { ModerationPanel } from '../../components/ModerationPanel.tsx'
import { ChoiceResults } from '../../components/results/ChoiceResults.tsx'
import { WordCloudResults } from '../../components/results/WordCloudResults.tsx'
import { OpenResults } from '../../components/results/OpenResults.tsx'
import { RichContentView } from '../../components/RichContentView.tsx'
import type { Slide, Session, Question, ModerateAction } from '../../types.ts'

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
}

export function PresenterSlideCard({slide,slideIndex,totalSlides,list,revealedSlides,onReveal,qnaList,session,onModerate,onToggleModeration}: PresenterSlideCardProps){
  const pendingCount=qnaList.filter(q=>q.status==='pending').length
  const imageCol=slide.contentImage&&(
    <div style={{flex:'0 0 20%',minWidth:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <img src={slide.contentImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:5}}/>
    </div>
  )
  return(
    <div style={{background:C.surface,borderRadius:4,boxShadow:C.shadow,padding:'48px 56px',
      width:'auto',maxWidth:'100%',height:'100%',aspectRatio:'16/9',overflowY:'auto',display:'flex',gap:24}}>
      {slide.layout==='left'&&imageCol}
      <div style={{flex:'1 1 0%',minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
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
    </div>
  )
}
