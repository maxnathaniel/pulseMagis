import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Placeholder } from '@tiptap/extensions'
import { richTextExtensions } from '../../lib/richTextExtensions.js'
import { useRichTextStyles } from '../../components/RichContentView.jsx'
import { RichTextToolbar } from './RichTextToolbar.jsx'
import { VERTICAL_ALIGN_CSS, EMPTY_RICH_DOC, C, FONT_BODY } from '../../theme.js'

// Only the live editor needs a placeholder hint (an empty read-only
// RichContentView should just render nothing) — kept out of the shared
// richTextExtensions list used by generateHTML.
const editorExtensions = [...richTextExtensions, Placeholder.configure({placeholder:'Start typing…'})]

// Owns the live TipTap editor instance for a 'plain' slide. Must be its own
// component (not inlined in SlideEditor) since useEditor can't be called
// conditionally — SlideEditor is shared across all 5 slide types.
export function PlainSlideEditor({slide, onChange}) {
  useRichTextStyles()
  const editor = useEditor({
    extensions: editorExtensions,
    content: slide.content || EMPTY_RICH_DOC,
    onUpdate: ({editor}) => onChange({content: editor.getJSON()}),
  })

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',flex:'1 1 0%',minWidth:0}}>
      <RichTextToolbar editor={editor} verticalAlign={slide.verticalAlign||'middle'}
        onVerticalAlignChange={va=>onChange({verticalAlign:va})}/>
      <div className="pm-rich" onClick={()=>editor?.chain().focus().run()}
        style={{flex:1,minHeight:0,overflowY:'auto',display:'flex',cursor:'text',
        flexDirection:'column',justifyContent:VERTICAL_ALIGN_CSS[slide.verticalAlign||'middle'],
        color:C.txt1,fontFamily:FONT_BODY,fontSize:16,lineHeight:1.5}}>
        <EditorContent editor={editor} style={{width:'100%'}}/>
      </div>
    </div>
  )
}
