import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { C } from '../../theme.ts'
import { supabase } from '../../lib/supabase.ts'
import { BuilderTopBar, type BuilderView } from './BuilderTopBar.tsx'
import { SlideSidebar } from './SlideSidebar.tsx'
import { SlideEditor } from './SlideEditor.tsx'
import { PreviewModal } from './PreviewModal.tsx'
import { RightRail } from './RightRail.tsx'
import { EditPanel } from './EditPanel.tsx'
import { ResultsView } from './ResultsView.tsx'
import type { Draft, SlideType, SlidePatch, ResponseMode, ResponsesBySlide } from '../../types.ts'

interface BuilderProps {
  draft: Draft
  setDraft: Dispatch<SetStateAction<Draft>>
  updateSlide: (id: string, patch: SlidePatch) => void
  changeSlideType: (id: string, newType: SlideType) => void
  addSlide: (type: SlideType) => void
  removeSlide: (id: string) => void
  reorderSlide: (id: string, toIndex: number) => void
  addOption: (sid: string) => void
  removeOption: (sid: string, oi: number) => void
  updateOption: (sid: string, oi: number, val: string) => void
  applyResponseModeToAll: (mode: ResponseMode) => void
  onBack: () => void
  onPresent: (startIndex: number) => void
}

export function Builder({draft,setDraft,updateSlide,changeSlideType,addSlide,removeSlide,reorderSlide,addOption,removeOption,updateOption,applyResponseModeToAll,onBack,onPresent}: BuilderProps){
  // Tracked by slide id, not array index — reordering (drag-and-drop) changes
  // which slide sits at a given index, so an index-based "active slide" would
  // silently start pointing at the wrong slide after a drag.
  const [activeId,setActiveId]=useState(draft.slides[0]?.id)
  const [previewOpen,setPreviewOpen]=useState(false)
  const [editPanelOpen,setEditPanelOpen]=useState(true)
  const [view,setView]=useState<BuilderView>('create')
  const [responsesBySlide,setResponsesBySlide]=useState<ResponsesBySlide>({})
  const prevLen=useRef(draft.slides.length)

  useEffect(() => {
    if (view!=='create') return
    if (!draft.code) { setResponsesBySlide({}); return }
    let cancelled=false
    supabase.from('responses').select('slide_id,value').eq('session_code', draft.code)
      .returns<{slide_id:string; value:string|number}[]>()
      .then(({data, error}) => {
        if (cancelled) return
        if (error) { console.error(error); return }
        const grouped: ResponsesBySlide = {}
        ;(data||[]).forEach(r => { (grouped[r.slide_id] = grouped[r.slide_id]||[]).push(r.value) })
        setResponsesBySlide(grouped)
      })
    return () => { cancelled=true }
  }, [draft.code, view])

  useEffect(() => {
    // addSlide always appends at the end, so a length increase means the new
    // slide is the last one — jump to it.
    if (draft.slides.length>prevLen.current) setActiveId(draft.slides[draft.slides.length-1]?.id)
    prevLen.current=draft.slides.length
  }, [draft.slides.length])

  useEffect(() => {
    // activeId no longer present (its slide was removed) — fall back to the last slide.
    if (draft.slides.length && !draft.slides.some(s=>s.id===activeId)) {
      setActiveId(draft.slides[draft.slides.length-1].id)
    }
  }, [draft.slides, activeId])

  const activeIndex=draft.slides.findIndex(s=>s.id===activeId)
  const slide=activeIndex>=0 ? draft.slides[activeIndex] : draft.slides[0]
  const qaTakenByOtherActive=!!slide&&slide.type!=='qa'&&draft.slides.some(s=>s.type==='qa')

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
      <BuilderTopBar title={draft.title} onTitleChange={t=>setDraft(d=>({...d,title:t}))}
        onBack={onBack} onPreview={()=>setPreviewOpen(true)} onPresent={()=>onPresent(Math.max(activeIndex,0))}
        view={view} onViewChange={setView}/>
      {view==='results'
        ? <ResultsView draft={draft}/>
        : <div style={{flex:1,display:'flex',minHeight:0}}>
            <SlideSidebar slides={draft.slides} activeIndex={activeIndex} onSelect={setActiveId}
              onReorder={reorderSlide} onRemove={removeSlide} onAddSlide={addSlide}
              onChangeType={(id,patch)=>changeSlideType(id,patch.type)} responsesBySlide={responsesBySlide}/>
            <div style={{flex:1,overflowY:'auto',padding:32,display:'flex',alignItems:'stretch',justifyContent:'center',minWidth:0}}>
              {slide&&(
                <div style={{background:C.surface,borderRadius:4,boxShadow:C.shadow,padding:'48px 0',
                  width:'auto',maxWidth:'100%',height:'100%',aspectRatio:'16/9',overflowY:'auto',display:'flex',flexDirection:'column'}}>
                  <SlideEditor slide={slide} list={responsesBySlide[slide.id]||[]}
                    onChange={patch=>updateSlide(slide.id,patch)}
                    onAddOption={()=>addOption(slide.id)}
                    onRemoveOption={oi=>removeOption(slide.id,oi)}
                    onUpdateOption={(oi,v)=>updateOption(slide.id,oi,v)}
                    qnaModeration={draft.qnaModeration} moderatorPin={draft.moderatorPin}
                    onToggleQnaModeration={()=>setDraft(d=>({...d,qnaModeration:!d.qnaModeration}))}
                    onChangeModeratorPin={v=>setDraft(d=>({...d,moderatorPin:v}))}/>
                </div>
              )}
            </div>
            {editPanelOpen&&slide&&(
              <EditPanel slide={slide} onChange={patch=>updateSlide(slide.id,patch)}
                onChangeType={type=>changeSlideType(slide.id,type)} qaTakenByOther={qaTakenByOtherActive}
                onApplyToAll={applyResponseModeToAll} onClose={()=>setEditPanelOpen(false)}/>
            )}
            <RightRail editOpen={editPanelOpen} onToggleEdit={()=>setEditPanelOpen(v=>!v)}/>
          </div>
      }
      {previewOpen&&<PreviewModal draft={draft} onClose={()=>setPreviewOpen(false)}/>}
    </div>
  )
}
