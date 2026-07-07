import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { C } from '../../theme.ts'
import { SlideThumbnail } from './SlideThumbnail.tsx'
import { AddSlideMenu } from './AddSlideMenu.tsx'
import type { Slide, SlideType, ResponsesBySlide } from '../../types.ts'

interface SlideSidebarProps {
  slides: Slide[]
  activeIndex: number
  onSelect: (id: string) => void
  onReorder: (id: string, toIndex: number) => void
  onRemove: (id: string) => void
  onAddSlide: (type: SlideType) => void
  onChangeType: (id: string, patch: { type: SlideType }) => void
  responsesBySlide: ResponsesBySlide
}

export function SlideSidebar({slides,activeIndex,onSelect,onReorder,onRemove,onAddSlide,onChangeType,responsesBySlide}: SlideSidebarProps){
  const [pickerOpen,setPickerOpen]=useState(false)
  const [dragIndex,setDragIndex]=useState<number | null>(null)
  const [overIndex,setOverIndex]=useState<number | null>(null)
  const hasQa=slides.some(s=>s.type==='qa')

  useEffect(() => {
    // Global Up/Down slide nav (PowerPoint/Slides-style) — skipped while
    // typing so it doesn't hijack cursor movement in the question/option
    // text fields or the caret in a contentEditable rich-text area.
    function onKeyDown(e: KeyboardEvent){
      if (e.key!=='ArrowUp' && e.key!=='ArrowDown') return
      const el=document.activeElement
      const typing=el instanceof HTMLElement &&
        (el.tagName==='INPUT' || el.tagName==='TEXTAREA' || el.isContentEditable)
      if (typing) return
      e.preventDefault()
      const delta=e.key==='ArrowUp' ? -1 : 1
      const nextIndex=activeIndex+delta
      if (nextIndex<0 || nextIndex>=slides.length) return
      onSelect(slides[nextIndex].id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, slides, onSelect])

  return(
    <div style={{width:240,flexShrink:0,borderRight:`1.5px solid ${C.border}`,padding:16,
      display:'flex',flexDirection:'column',gap:10,overflowY:'auto'}}>
      {slides.map((slide,i)=>{
        const qaTakenByOther=slide.type!=='qa'&&hasQa
        return(
          <SlideThumbnail key={slide.id} slide={slide} index={i} total={slides.length}
            active={i===activeIndex} dropIndicator={dragIndex!==null&&dragIndex!==i&&overIndex===i}
            onSelect={()=>onSelect(slide.id)} onRemove={()=>onRemove(slide.id)}
            onChangeType={type=>onChangeType(slide.id,{type})} qaTakenByOther={qaTakenByOther}
            list={responsesBySlide[slide.id]||[]}
            onDragStart={()=>setDragIndex(i)}
            onDragOver={e=>{ e.preventDefault(); setOverIndex(i) }}
            onDrop={e=>{
              e.preventDefault()
              if (dragIndex!==null&&dragIndex!==i) onReorder(slides[dragIndex].id, i)
              setDragIndex(null); setOverIndex(null)
            }}
            onDragEnd={()=>{ setDragIndex(null); setOverIndex(null) }}/>
        )
      })}
      <div style={{position:'relative',marginTop:4}}>
        <button onClick={()=>setPickerOpen(o=>!o)} style={{width:'100%',padding:'12px',borderRadius:9999,
          border:`2px dashed ${C.border}`,background:'transparent',color:C.txt3,
          display:'flex',alignItems:'center',justifyContent:'center',gap:7,cursor:'pointer',
          fontSize:13.5,fontWeight:700}}>
          <Plus size={15}/> Add slide
        </button>
        <AddSlideMenu open={pickerOpen} hasQa={hasQa}
          onPick={type=>{ onAddSlide(type); setPickerOpen(false) }}
          onClose={()=>setPickerOpen(false)}/>
      </div>
    </div>
  )
}
