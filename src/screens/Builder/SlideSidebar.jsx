import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { C } from '../../theme.js'
import { SlideThumbnail } from './SlideThumbnail.jsx'
import { AddSlideMenu } from './AddSlideMenu.jsx'

export function SlideSidebar({slides,activeIndex,onSelect,onReorder,onRemove,onAddSlide,onChangeType}){
  const [pickerOpen,setPickerOpen]=useState(false)
  const [dragIndex,setDragIndex]=useState(null)
  const [overIndex,setOverIndex]=useState(null)
  const hasQa=slides.some(s=>s.type==='qa')
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
        <button onClick={()=>setPickerOpen(o=>!o)} style={{width:'100%',padding:'12px',borderRadius:4,
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
