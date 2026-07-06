import { Cloud, MessageSquare } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'
import { PlainSlideEditor } from './PlainSlideEditor.tsx'
import { EditableChoiceOptions } from './EditableChoiceOptions.tsx'
import type { Slide, SlidePatch } from '../../types.ts'

interface SlideEditorProps {
  slide: Slide
  list: (string | number)[]
  onChange: (patch: SlidePatch) => void
  onAddOption: () => void
  onRemoveOption: (oi: number) => void
  onUpdateOption: (oi: number, val: string) => void
}

export function SlideEditor({slide,list,onChange,onAddOption,onRemoveOption,onUpdateOption}: SlideEditorProps){
  const hasImage=!!slide.contentImage
  const imageFirst=hasImage&&slide.layout==='left'
  // The image column always bleeds flush to every card edge it sits against
  // (top, bottom, and whichever side) so it renders as tall as the card
  // allows — unlike PresenterSlideCard, which insets it vertically too. The
  // 56px/48px insets below apply only to the main column, not the image.
  const contentIsLeftEdge=!imageFirst
  const contentIsRightEdge=!(hasImage&&!imageFirst)

  const mainCol=(
    <div style={{display:'flex',flexDirection:'column',height:'100%',flex:'1 1 0%',minWidth:0,
      paddingTop:48,paddingBottom:48,
      paddingLeft:contentIsLeftEdge?56:0,paddingRight:contentIsRightEdge?56:0}}>
      {slide.type==='plain' ? (
        <PlainSlideEditor key={slide.id} slide={slide} onChange={onChange}/>
      ) : (<>
      <input value={slide.question} onChange={e=>onChange({question:e.target.value})}
        placeholder={slide.type==='qa'?'Ask us anything…':'Type your question…'}
        style={{width:'100%',background:'transparent',border:'none',borderBottom:`2px solid transparent`,
          color:C.txt1,fontFamily:FONT_DISPLAY,fontSize:34,fontWeight:700,padding:'2px 0 12px',
          outline:'none',marginBottom:28,flexShrink:0,textAlign:'left'}}/>

      {slide.type==='choice'&&(
        // Capped so the response shape reads as a compact, dominant element rather
        // than stretching edge-to-edge — 70% of the whole slide's width, which
        // (since the image column is a fixed 25% of the slide when present)
        // works out to 93.33% of this column's own width in that case.
        <div style={{flex:1,minHeight:0,width:'100%',maxWidth:hasImage?'93.33%':'70%',margin:'0 auto',display:'flex'}}>
          {/* Keyed by slide id so switching the active slide always mounts a
            fresh chart instance — the same entrance-animation reasoning as
            PresenterSlideCard's results, otherwise React just updates props
            on the same instance and the reveal animation never replays. */}
          <EditableChoiceOptions key={slide.id} slide={slide} list={list}
            onUpdateOption={onUpdateOption} onRemoveOption={onRemoveOption} onAddOption={onAddOption}/>
        </div>
      )}

      {slide.type==='wordcloud'&&(
        <div style={{border:`2px dashed ${C.border}`,borderRadius:5,padding:'52px 24px',textAlign:'center'}}>
          <Cloud size={30} color={C.txt4}/>
          <div style={{marginTop:12,fontSize:14.5,color:C.txt3,fontWeight:700}}>Audience responses appear here as a live word cloud</div>
        </div>
      )}
      {slide.type==='open'&&(
        <div style={{border:`2px dashed ${C.border}`,borderRadius:5,padding:'52px 24px',textAlign:'center'}}>
          <MessageSquare size={30} color={C.txt4}/>
          <div style={{marginTop:12,fontSize:14.5,color:C.txt3,fontWeight:700}}>Audience free-text responses appear here live</div>
        </div>
      )}
      {slide.type==='qa'&&(
        <div style={{fontSize:13,color:C.txt3,fontWeight:600}}>
          Audience can ask questions and upvote others during this slide.
        </div>
      )}
      </>)}
    </div>
  )

  const imageCol=hasImage&&(
    <div style={{flex:'0 0 25%',minWidth:0,overflow:'hidden',borderRadius:5}}>
      <img src={slide.contentImage ?? undefined} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
    </div>
  )

  return(
    <div style={{display:'flex',height:'100%',gap:hasImage?24:0,animation:'fadeUp .3s ease'}}>
      {imageFirst&&imageCol}
      {mainCol}
      {!imageFirst&&imageCol}
    </div>
  )
}
