import type { CSSProperties } from 'react'
import { C, FONT_DISPLAY, VERTICAL_ALIGN_CSS } from '../theme.ts'
import { RichContentView } from './RichContentView.tsx'
import { EditableChoiceOptions } from '../screens/Builder/EditableChoiceOptions.tsx'
import type { SlidePreviewData } from '../types.ts'

// Reference canvas plain-slide thumbnails are scaled down from — matches
// PresenterSlideCard's own aspect ratio and padding so the miniature has
// identical line-wrapping/proportions to the real presented slide.
const PLAIN_CANVAS_W = 800
const PLAIN_CANVAS_H = 450

// Choice slides use a taller reference canvas than the plain one above —
// the Create tab's real chart (EditableDonutOptions/EditablePieOptions) is
// 320px tall, which the plain canvas's 450px height (minus its own padding)
// isn't tall enough to fit without clipping. Kept at the same 16:9 ratio as
// the thumbnail box itself so scaling by width (the cqw trick below) also
// fits the height exactly, with no clipping or leftover empty space.
const CHOICE_CANVAS_W = 960
const CHOICE_CANVAS_H = 540

interface MiniSlidePreviewProps {
  slide: SlidePreviewData | null | undefined
  list?: (string | number)[]
}

// Renders a scaled-down but genuine representation of what the slide will
// actually look like once presented — the real question/title left-aligned,
// plus real option bars for choice slides — not a generic type-icon
// summary.
export function MiniSlidePreview({slide,list}: MiniSlidePreviewProps){
  if (!slide) return (
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontSize:12,color:C.txt4,fontWeight:600}}>No slides yet</span>
    </div>
  )

  // Matches the real Presenter view's per-type fallback text exactly.
  const question=slide.question?.trim()||(slide.type==='qa'?'Ask a question':'Untitled question')
  const hasImage=!!slide.contentImage
  const imageFirst=hasImage&&slide.layout==='left'

  const imageCol=hasImage&&(
    <div style={{flex:'0 0 20%',minWidth:0,borderRadius:3,overflow:'hidden'}}>
      <img src={slide.contentImage ?? undefined} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
    </div>
  )

  let body
  if (slide.type==='choice') {
    // Response values are option-index based against the ORIGINAL
    // (unfiltered) options array — filtering out blanks for display would
    // silently shift vote counts onto the wrong option unless the list is
    // remapped through each entry's original index first.
    const rawOptions=slide.options||[]
    const validEntries=rawOptions
      .map((opt,i)=>({opt,i}))
      .filter(e=>e.opt&&e.opt.trim())
    const indexMap=new Map(validEntries.map((e,newIdx)=>[e.i,newIdx]))
    const remappedList=(list||[])
      .map(v=>indexMap.get(v as number))
      .filter((v): v is number => v!==undefined)
    const previewSlide={options:validEntries.map(e=>e.opt), resultsFormat:slide.resultsFormat}

    // True mirror of SlideEditor.tsx's real layout (same fontSize:34
    // question, same maxWidth cap, same EditableChoiceOptions component in
    // its readOnly mode) rendered at full size in a fixed reference canvas,
    // then shrunk via transform:scale — same technique as the plain-slide
    // branch below, so this can't independently drift from the real thing.
    body=(
      <div style={{flex:1,minWidth:0,minHeight:0,overflow:'hidden',position:'relative',containerType:'inline-size'} as CSSProperties}>
        <div style={{position:'absolute',top:'50%',left:'50%',width:CHOICE_CANVAS_W,height:CHOICE_CANVAS_H,
          padding:'48px 56px',boxSizing:'border-box',
          transform:`translate(-50%,-50%) scale(calc(100cqw / ${CHOICE_CANVAS_W}px))`,transformOrigin:'center center',
          display:'flex',flexDirection:'column'} as CSSProperties}>
          <div style={{width:'100%',textAlign:'left',fontFamily:FONT_DISPLAY,fontSize:34,fontWeight:700,
            color:C.txt1,padding:'2px 0 12px',marginBottom:28,flexShrink:0,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{question}</div>
          {validEntries.length
            ? <div style={{flex:1,minHeight:0,width:'100%',maxWidth:hasImage?'87.5%':'70%',margin:'0 auto',display:'flex'}}>
                <EditableChoiceOptions slide={previewSlide} list={remappedList} readOnly/>
              </div>
            : <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
                fontFamily:FONT_DISPLAY,fontSize:18,color:C.txt4,fontWeight:600}}>No options yet</div>}
        </div>
      </div>
    )
  } else if (slide.type==='plain') {
    // A true miniature, not just "smaller text": render at the same fixed
    // canvas size/padding as PresenterSlideCard (full fontSize, real line
    // wrapping), then shrink the whole canvas visually via transform:scale.
    // Font-size-only scaling (what this used before) reformats the text at
    // a different width, so paragraphs wrap differently than they do on the
    // real slide — this preserves the exact same layout, just smaller.
    // containerType lets the scale factor track this box's actual rendered
    // width with no JS/ResizeObserver measurement needed.
    body=(
      <div style={{flex:1,minWidth:0,minHeight:0,overflow:'hidden',position:'relative',containerType:'inline-size'} as CSSProperties}>
        <div style={{position:'absolute',top:'50%',left:'50%',width:PLAIN_CANVAS_W,height:PLAIN_CANVAS_H,
          padding:'48px 56px',boxSizing:'border-box',
          transform:`translate(-50%,-50%) scale(calc(100cqw / ${PLAIN_CANVAS_W}px))`,transformOrigin:'center center',
          display:'flex',flexDirection:'column',justifyContent:VERTICAL_ALIGN_CSS[slide.verticalAlign||'middle']}}>
          <RichContentView content={slide.content}/>
        </div>
      </div>
    )
  } else {
    // wordcloud/open/qa: the real presented slide is just the question as a
    // big centered title (plus a live response area that's empty here) —
    // so the preview shows exactly that, no type icon.
    body=(
      <div style={{flex:1,minWidth:0,minHeight:0,overflow:'hidden',display:'flex',flexDirection:'column',
        alignItems:'flex-start',justifyContent:'center'}}>
        <div style={{width:'100%',fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:12,color:C.txt1,textAlign:'left',
          overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',lineHeight:1.35} as CSSProperties}>
          {question}
        </div>
      </div>
    )
  }

  return (
    <div style={{width:'100%',height:'100%',display:'flex',gap:6}}>
      {imageFirst&&imageCol}
      {body}
      {!imageFirst&&imageCol}
    </div>
  )
}
