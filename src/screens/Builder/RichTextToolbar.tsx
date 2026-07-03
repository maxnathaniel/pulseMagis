import { useState, type ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify, PanelTop, AlignVerticalJustifyCenter, PanelBottom,
  Bold, Italic, Underline, Strikethrough, Link as LinkIcon, List, ListOrdered, Palette, MoreHorizontal,
  ChevronDown, Check, type LucideIcon,
} from 'lucide-react'
import { C, FONT_DISPLAY, PALETTE_BARS } from '../../theme.ts'
import type { VerticalAlign } from '../../types.ts'

interface ToolbarBtnProps {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: ReactNode
}

function ToolbarBtn({active, disabled, onClick, title, children}: ToolbarBtnProps) {
  return (
    <button type="button" onClick={onClick} title={title} disabled={disabled}
      style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:4,
        border:'none',background:active?C.purpleBg:'transparent',
        color:disabled?C.txtDis:(active?C.purple:C.txt3),
        cursor:disabled?'default':'pointer',flexShrink:0}}
      onMouseEnter={e=>{ if (!disabled&&!active) e.currentTarget.style.background=C.surfaceHov }}
      onMouseLeave={e=>{ if (!disabled&&!active) e.currentTarget.style.background='transparent' }}>
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{width:1.5,alignSelf:'stretch',margin:'5px 3px',background:C.borderLight,flexShrink:0}}/>
}

interface BlockOption {
  key: string
  label: string
  level: 1 | 2 | 3 | null
}

const BLOCK_OPTIONS: BlockOption[] = [
  { key:'body', label:'Body',       level:null },
  { key:'h1',   label:'Heading 1',  level:1 },
  { key:'h2',   label:'Heading 2',  level:2 },
  { key:'h3',   label:'Heading 3',  level:3 },
]
const HALIGNS: { key:string; icon:LucideIcon }[] = [
  { key:'left',    icon:AlignLeft },
  { key:'center',  icon:AlignCenter },
  { key:'right',   icon:AlignRight },
  { key:'justify', icon:AlignJustify },
]
const VALIGNS: { key:VerticalAlign; icon:LucideIcon; title:string }[] = [
  { key:'top',    icon:PanelTop,                     title:'Align top' },
  { key:'middle', icon:AlignVerticalJustifyCenter,    title:'Align middle' },
  { key:'bottom', icon:PanelBottom,                   title:'Align bottom' },
]

interface RichTextToolbarProps {
  editor: Editor | null
  verticalAlign: VerticalAlign
  onVerticalAlignChange: (va: VerticalAlign) => void
}

export function RichTextToolbar({editor, verticalAlign, onVerticalAlignChange}: RichTextToolbarProps) {
  const [blockOpen, setBlockOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [linkOpen, setLinkOpen]   = useState(false)
  const [linkUrl, setLinkUrl]     = useState('')

  if (!editor) return null

  const activeBlock = BLOCK_OPTIONS.find(b => b.level
    ? editor.isActive('heading', {level:b.level}) : editor.isActive('paragraph')) || BLOCK_OPTIONS[0]

  const setBlock = (opt: BlockOption) => {
    if (opt.level) editor.chain().focus().toggleHeading({level:opt.level}).run()
    else editor.chain().focus().setParagraph().run()
    setBlockOpen(false)
  }
  const setColor = (hex: string | null) => {
    if (hex) editor.chain().focus().setColor(hex).run()
    else editor.chain().focus().unsetColor().run()
    setColorOpen(false)
  }
  const openLink = () => {
    if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return }
    setLinkUrl(''); setLinkOpen(true)
  }
  const confirmLink = () => {
    const url=linkUrl.trim()
    if (url) editor.chain().focus().extendMarkRange('link').setLink({href:url}).run()
    setLinkOpen(false)
  }

  return (
    <div style={{display:'flex',alignItems:'center',gap:1,flexWrap:'wrap',padding:'6px 8px',
      background:C.surfaceAlt,border:`1.5px solid ${C.border}`,borderRadius:6,marginBottom:14,flexShrink:0}}>

      {/* block style */}
      <div style={{position:'relative'}}>
        <button type="button" onClick={()=>setBlockOpen(o=>!o)}
          style={{display:'flex',alignItems:'center',gap:4,height:28,padding:'0 8px',borderRadius:4,
            border:'none',background:blockOpen?C.surfaceHov:'transparent',color:C.txt2,
            fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:12.5,cursor:'pointer'}}>
          {activeBlock.label}<ChevronDown size={12}/>
        </button>
        {blockOpen&&(
          <>
            <div onClick={()=>setBlockOpen(false)} style={{position:'fixed',inset:0,background:'transparent',zIndex:60}}/>
            <div style={{position:'absolute',top:'100%',left:0,marginTop:4,background:C.surface,
              border:`1.5px solid ${C.border}`,borderRadius:5,boxShadow:C.shadowHov,padding:4,zIndex:61,minWidth:140}}>
              {BLOCK_OPTIONS.map(opt=>(
                <button key={opt.key} onClick={()=>setBlock(opt)}
                  style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,
                    textAlign:'left',padding:'7px 9px',borderRadius:4,border:'none',
                    background:opt.key===activeBlock.key?C.surfaceHov:'transparent',
                    color:C.txt1,fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:13,cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHov}
                  onMouseLeave={e=>e.currentTarget.style.background=opt.key===activeBlock.key?C.surfaceHov:'transparent'}>
                  {opt.label}{opt.key===activeBlock.key&&<Check size={13} color={C.purple}/>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Divider/>

      {/* color */}
      <div style={{position:'relative'}}>
        <ToolbarBtn title="Text color" active={colorOpen} onClick={()=>setColorOpen(o=>!o)}>
          <Palette size={15}/>
        </ToolbarBtn>
        {colorOpen&&(
          <>
            <div onClick={()=>setColorOpen(false)} style={{position:'fixed',inset:0,background:'transparent',zIndex:60}}/>
            <div style={{position:'absolute',top:'100%',left:0,marginTop:4,background:C.surface,
              border:`1.5px solid ${C.border}`,borderRadius:5,boxShadow:C.shadowHov,padding:8,zIndex:61,
              display:'flex',gap:6}}>
              <button onClick={()=>setColor(null)} title="Default"
                style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${C.border}`,
                  background:C.surface,color:C.txt2,fontSize:11,cursor:'pointer',padding:0}}>×</button>
              {PALETTE_BARS.map(hex=>(
                <button key={hex} onClick={()=>setColor(hex)} title={hex}
                  style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${hex}`,
                    background:hex,cursor:'pointer',padding:0}}/>
              ))}
            </div>
          </>
        )}
      </div>

      <Divider/>

      <ToolbarBtn title="Bullet list" active={editor.isActive('bulletList')}
        onClick={()=>editor.chain().focus().toggleBulletList().run()}><List size={15}/></ToolbarBtn>
      <ToolbarBtn title="Numbered list" active={editor.isActive('orderedList')}
        onClick={()=>editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15}/></ToolbarBtn>

      <Divider/>

      {HALIGNS.map(a=>{
        const Icon=a.icon
        return (
          <ToolbarBtn key={a.key} title={`Align ${a.key}`} active={editor.isActive({textAlign:a.key})}
            onClick={()=>editor.chain().focus().setTextAlign(a.key).run()}><Icon size={15}/></ToolbarBtn>
        )
      })}

      <Divider/>

      {VALIGNS.map(a=>{
        const Icon=a.icon
        return (
          <ToolbarBtn key={a.key} title={a.title} active={(verticalAlign||'middle')===a.key}
            onClick={()=>onVerticalAlignChange(a.key)}><Icon size={15}/></ToolbarBtn>
        )
      })}

      <Divider/>

      <ToolbarBtn title="Bold" active={editor.isActive('bold')}
        onClick={()=>editor.chain().focus().toggleBold().run()}><Bold size={15}/></ToolbarBtn>
      <ToolbarBtn title="Italic" active={editor.isActive('italic')}
        onClick={()=>editor.chain().focus().toggleItalic().run()}><Italic size={15}/></ToolbarBtn>
      <ToolbarBtn title="Underline" active={editor.isActive('underline')}
        onClick={()=>editor.chain().focus().toggleUnderline().run()}><Underline size={15}/></ToolbarBtn>
      <ToolbarBtn title="Strikethrough" active={editor.isActive('strike')}
        onClick={()=>editor.chain().focus().toggleStrike().run()}><Strikethrough size={15}/></ToolbarBtn>

      <Divider/>

      <div style={{position:'relative'}}>
        <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={openLink}><LinkIcon size={15}/></ToolbarBtn>
        {linkOpen&&(
          <>
            <div onClick={()=>setLinkOpen(false)} style={{position:'fixed',inset:0,background:'transparent',zIndex:60}}/>
            <div style={{position:'absolute',top:'100%',left:0,marginTop:4,background:C.surface,
              border:`1.5px solid ${C.border}`,borderRadius:5,boxShadow:C.shadowHov,padding:10,zIndex:61,
              display:'flex',gap:6,width:260}}>
              <input autoFocus value={linkUrl} onChange={e=>setLinkUrl(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&confirmLink()} placeholder="https://…"
                style={{flex:1,background:C.inputBg,border:`1.5px solid ${C.border}`,borderRadius:4,
                  padding:'6px 8px',color:C.txt1,fontSize:13,outline:'none'}}/>
              <button onClick={confirmLink}
                style={{padding:'6px 12px',borderRadius:4,border:'none',background:C.purple,color:'#fff',
                  fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:12.5,cursor:'pointer'}}>Add</button>
            </div>
          </>
        )}
      </div>

      <Divider/>

      <ToolbarBtn title="More formatting (coming soon)" disabled onClick={()=>{}}><MoreHorizontal size={15}/></ToolbarBtn>
    </div>
  )
}
