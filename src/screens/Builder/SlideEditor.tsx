import { ShieldCheck, Lock, Cloud, MessageSquare } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'
import { ToggleChip } from '../../components/ui/ToggleChip.tsx'
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
  qnaModeration: boolean
  moderatorPin: string
  onToggleQnaModeration: () => void
  onChangeModeratorPin: (pin: string) => void
}

export function SlideEditor({slide,list,onChange,onAddOption,onRemoveOption,onUpdateOption,qnaModeration,moderatorPin,onToggleQnaModeration,onChangeModeratorPin}: SlideEditorProps){
  const hasImage=!!slide.contentImage
  const imageFirst=hasImage&&slide.layout==='left'

  const mainCol=(
    <div style={{display:'flex',flexDirection:'column',height:'100%',flex:'1 1 0%',minWidth:0}}>
      {slide.type==='plain' ? (
        <PlainSlideEditor key={slide.id} slide={slide} onChange={onChange}/>
      ) : (<>
      <input value={slide.question} onChange={e=>onChange({question:e.target.value})}
        placeholder={slide.type==='qa'?'Ask us anything…':'Type your question…'}
        style={{width:'100%',background:'transparent',border:'none',borderBottom:`2px solid transparent`,
          color:C.txt1,fontFamily:FONT_DISPLAY,fontSize:34,fontWeight:700,padding:'2px 0 12px',
          outline:'none',marginBottom:28,flexShrink:0,textAlign:'center'}}/>

      {slide.type==='choice'&&(
        // Capped so the response shape reads as a compact, dominant element rather
        // than stretching edge-to-edge — 50% of the whole slide's width, which
        // (since the image column is a fixed 20% of the slide when present)
        // works out to 62.5% of this column's own width in that case.
        <div style={{flex:1,minHeight:0,width:'100%',maxWidth:hasImage?'62.5%':'50%',margin:'0 auto',display:'flex'}}>
          <EditableChoiceOptions slide={slide} list={list}
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
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{fontSize:13,color:C.txt3,fontWeight:600}}>
            Audience can ask questions and upvote others during this slide.
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            <ToggleChip icon={ShieldCheck} label="Moderate questions before shown"
              active={qnaModeration} onClick={onToggleQnaModeration}/>
          </div>
          <div style={{background:C.surfaceAlt,border:`1.5px solid ${C.border}`,borderRadius:4,padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12.5,color:C.txt3,fontWeight:700}}>
              <Lock size={12}/> CO-MODERATOR PIN <span style={{fontWeight:600,color:C.txt4}}>(optional)</span>
            </div>
            <input value={moderatorPin} onChange={e=>onChangeModeratorPin(e.target.value.slice(0,20))}
              placeholder="Set a PIN so co-moderators can unlock moderation…" type="password"
              style={{width:'100%',background:C.inputBg,border:`1.5px solid ${C.border}`,borderRadius:4,padding:'9px 12px',color:C.txt1,fontSize:13.5,outline:'none'}}/>
            <div style={{fontSize:11.5,color:C.txt4,lineHeight:1.5,fontWeight:600}}>
              You're auto-authenticated as presenter. Share this PIN with trusted co-moderators — they join as audience, enter the PIN, and get approval powers on their device.
            </div>
          </div>
        </div>
      )}
      </>)}
    </div>
  )

  const imageCol=hasImage&&(
    <div style={{flex:'0 0 20%',minWidth:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <img src={slide.contentImage ?? undefined} alt="" style={{width:'100%',height:'100%',
        objectFit:'cover',borderRadius:5}}/>
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
