import type { CSSProperties } from 'react'
import { C, FONT_DISPLAY, PALETTE_BARS, VERTICAL_ALIGN_CSS } from '../theme.ts'
import { RichContentView } from './RichContentView.tsx'
import type { SlidePreviewData } from '../types.ts'

// Reference canvas plain-slide thumbnails are scaled down from — matches
// PresenterSlideCard's own aspect ratio and padding so the miniature has
// identical line-wrapping/proportions to the real presented slide.
const PLAIN_CANVAS_W = 800
const PLAIN_CANVAS_H = 450

interface MiniSlidePreviewProps {
  slide: SlidePreviewData | null | undefined
}

// Renders a scaled-down but genuine representation of what the slide will
// actually look like once presented — the real question/title centered,
// plus real option bars for choice slides — not a generic type-icon
// summary.
export function MiniSlidePreview({slide}: MiniSlidePreviewProps){
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
    const options=(slide.options||[]).filter(o=>o&&o.trim()).slice(0,4)
    body=(
      <div style={{flex:1,minWidth:0,minHeight:0,display:'flex',flexDirection:'column',gap:3}}>
        <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:10.5,color:C.txt2,textAlign:'center',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:0,marginBottom:1}}>{question}</div>
        {options.length
          ? <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',gap:3}}>
              {options.map((opt,i)=>{
                const optImg=(slide.optionImages||[])[i]||null
                const color=PALETTE_BARS[i%PALETTE_BARS.length]
                return(
                  <div key={i} style={{flex:1,minHeight:0,display:'flex',alignItems:'center',gap:4,
                    background:`${color}22`,border:`1px solid ${color}55`,borderRadius:3,
                    padding:'0 6px',overflow:'hidden'}}>
                    {optImg&&(
                      <div style={{width:12,height:12,borderRadius:'50%',flexShrink:0,border:`1px solid ${color}`,overflow:'hidden'}}>
                        <img src={optImg} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                      </div>
                    )}
                    <span style={{fontSize:9,fontWeight:700,color:C.txt2,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt}</span>
                  </div>
                )
              })}
            </div>
          : <div style={{fontSize:9.5,color:C.txt4,fontWeight:600,textAlign:'center'}}>No options yet</div>}
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
        alignItems:'center',justifyContent:'center'}}>
        <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:12,color:C.txt1,textAlign:'center',
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
