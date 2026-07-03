import React from 'react'
import { Plus, Trash2, ShieldCheck, Lock, Cloud, MessageSquare } from 'lucide-react'
import { C, FONT_DISPLAY, PALETTE_BARS } from '../../theme.js'
import { ToggleChip } from '../../components/ui/ToggleChip.jsx'
import { PlainSlideEditor } from './PlainSlideEditor.jsx'

export function SlideEditor({slide,onChange,onAddOption,onRemoveOption,onUpdateOption,qnaModeration,moderatorPin,onToggleQnaModeration,onChangeModeratorPin}){
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
        <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',gap:12}}>
          {slide.options.map((opt,oi)=>{
            const color=PALETTE_BARS[oi%PALETTE_BARS.length]
            return(
              <div key={oi} style={{flex:1,minHeight:48,display:'flex',gap:12,alignItems:'center'}}>
                <div style={{flex:1,height:'100%',borderRadius:4,background:`${color}16`,
                  border:`2px solid ${color}45`,display:'flex',alignItems:'center',padding:'0 16px'}}>
                  <input value={opt} onChange={e=>onUpdateOption(oi,e.target.value)} placeholder={`Option ${oi+1}`}
                    style={{flex:1,background:'transparent',border:'none',outline:'none',color:C.txt1,
                      fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:16}}/>
                </div>
                {slide.options.length>2&&<button onClick={()=>onRemoveOption(oi)} title="Remove option"
                  style={{background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:4,flexShrink:0}}><Trash2 size={14}/></button>}
              </div>
            )
          })}
          {slide.options.length<6&&(
            <button onClick={onAddOption} style={{height:50,flexShrink:0,borderRadius:4,border:`2px dashed ${C.border}`,
              background:'transparent',color:C.txt3,display:'flex',alignItems:'center',justifyContent:'center',
              gap:7,cursor:'pointer',fontSize:14,fontWeight:700}}>
              <Plus size={14}/> Add option
            </button>
          )}
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
      <img src={slide.contentImage} alt="" style={{width:'100%',height:'100%',
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
