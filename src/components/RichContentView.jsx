import React, { useEffect } from 'react'
import { generateHTML } from '@tiptap/core'
import { richTextExtensions } from '../lib/richTextExtensions.js'
import { C, FONT_BODY, EMPTY_RICH_DOC } from '../theme.js'

// Single source of truth for how rich-text nodes/marks look, shared by the
// live editor (SlideEditor mounts .pm-rich too) and this read-only renderer
// — generateHTML() only produces bare HTML tags (h1/ul/a/...), which can't
// carry React inline `style` props, so this is the one deliberate exception
// to this codebase's otherwise-universal inline-style convention.
const RICH_TEXT_CSS = `
.pm-rich h1{font-size:2em;font-weight:700;margin:.4em 0;line-height:1.2}
.pm-rich h2{font-size:1.5em;font-weight:700;margin:.4em 0;line-height:1.25}
.pm-rich h3{font-size:1.17em;font-weight:700;margin:.4em 0;line-height:1.3}
.pm-rich p{margin:.4em 0}
.pm-rich ul,.pm-rich ol{padding-left:1.3em;margin:.4em 0}
.pm-rich a{color:${C.purple};text-decoration:underline}
.pm-rich strong{font-weight:700}
.pm-rich em{font-style:italic}
.pm-rich u{text-decoration:underline}
.pm-rich s{text-decoration:line-through}
.pm-rich .ProseMirror{outline:none}
.pm-rich p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:${C.txt4};float:left;height:0;pointer-events:none}
`

export function useRichTextStyles() {
  useEffect(() => {
    if (document.getElementById('pm-rich-styles')) return
    const style = document.createElement('style')
    style.id = 'pm-rich-styles'
    style.textContent = RICH_TEXT_CSS
    document.head.appendChild(style)
  }, [])
}

// Read-only renderer for stored TipTap JSON content (plain slides), used at
// every scale: Presenter (full size), MiniSlidePreview (thumbnails), and
// AudienceSlideView (mobile). All heading/list/margin rules above are in em
// units, so passing a smaller `fontSize` scales the whole rendered document
// — headings, lists, spacing — proportionally, without a transform hack.
export function RichContentView({content, fontSize=16}) {
  useRichTextStyles()
  const html = generateHTML(content || EMPTY_RICH_DOC, richTextExtensions)
  return (
    <div className="pm-rich" style={{width:'100%',color:C.txt1,fontFamily:FONT_BODY,fontSize,lineHeight:1.5}}
      dangerouslySetInnerHTML={{__html: html}}/>
  )
}
