import { useState, type DragEvent, type CSSProperties } from 'react'
import { MoreVertical, Trash2 } from 'lucide-react'
import { C, SLIDE_TYPES, FONT_DISPLAY } from '../../theme.ts'
import { MiniSlidePreview } from '../../components/MiniSlidePreview.tsx'
import type { Slide, SlideType } from '../../types.ts'

interface SlideThumbnailProps {
  slide: Slide
  index: number
  total: number
  active: boolean
  dropIndicator: boolean
  onSelect: () => void
  onRemove: () => void
  onChangeType: (type: SlideType) => void
  qaTakenByOther: boolean
  list: (string | number)[]
  onDragStart: () => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}

export function SlideThumbnail({slide,index,total,active,dropIndicator,onSelect,onRemove,
  onChangeType,qaTakenByOther,list,onDragStart,onDragOver,onDrop,onDragEnd}: SlideThumbnailProps){
  const [hov,setHov]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  return(
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setMenuOpen(false)}}
      style={{display:'flex',alignItems:'stretch',gap:6,width:'100%',cursor:'grab'}}>

      <div style={{width:22,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:10.5,fontWeight:700,color:active?C.purple:C.txt4}}>{index+1}</div>
        <div style={{position:'relative',display:'flex',justifyContent:'center'}}>
        {hov&&(
          <>
            <button onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o)}}
              style={{width:22,height:22,borderRadius:4,border:`1.5px solid ${C.border}`,background:C.surfaceAlt,
                color:C.txt2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <MoreVertical size={13}/>
            </button>
            {menuOpen&&(
              <div onClick={e=>e.stopPropagation()} style={{position:'absolute',left:'100%',top:0,marginLeft:4,
                background:C.surfaceAlt,border:`1.5px solid ${C.border}`,borderRadius:4,boxShadow:C.shadowHov,
                padding:4,zIndex:10,minWidth:168}}>
                {SLIDE_TYPES.map(t=>{
                  const Icon=t.icon
                  const isCurrent=t.key===slide.type
                  const disabled=isCurrent||(t.key==='qa'&&qaTakenByOther)
                  return(
                    <button key={t.key} disabled={disabled}
                      onClick={()=>{ if(!disabled){ setMenuOpen(false); onChangeType(t.key) } }}
                      style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:9,
                        padding:'7px 9px',borderRadius:4,border:'none',
                        background:isCurrent?C.surfaceHov:'transparent',
                        cursor:disabled?'not-allowed':'pointer',opacity:isCurrent?1:(disabled?0.5:1)}}
                      onMouseEnter={e=>{ if (!disabled) e.currentTarget.style.background=C.surfaceHov }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=isCurrent?C.surfaceHov:'transparent' }}>
                      <Icon size={13} color={isCurrent?C.purple:C.txt2}/>
                      <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:12.5,
                        color:isCurrent?C.purple:C.txt1}}>
                        {t.label}{disabled&&!isCurrent?' (added)':''}
                      </span>
                    </button>
                  )
                })}
                <div style={{height:1,background:C.border,margin:'4px 2px'}}/>
                <button onClick={()=>{setMenuOpen(false);onRemove()}} disabled={total<=1}
                  style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:7,
                    padding:'7px 9px',borderRadius:4,border:'none',background:'transparent',
                    color:total<=1?C.txtDis:C.red,cursor:total<=1?'not-allowed':'pointer',
                    fontSize:12.5,fontWeight:700}}>
                  <Trash2 size={12}/> Delete
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      <div onClick={onSelect} style={{position:'relative',flex:1,minWidth:0,aspectRatio:'16/9',
        background:C.surface,
        border:`2px solid ${dropIndicator?C.purple:(active?C.purple:C.border)}`,borderRadius:4,
        cursor:'pointer',display:'flex',padding:'8px 10px 8px 8px',
        boxShadow:active?`0 2px 10px ${C.purpleBg}`:C.shadow,
        userSelect:'none',WebkitUserSelect:'none',
        outline:dropIndicator?`2px dashed ${C.purple}`:'none',outlineOffset:2} as CSSProperties}>

        <MiniSlidePreview slide={slide} list={list}/>
      </div>
    </div>
  )
}
