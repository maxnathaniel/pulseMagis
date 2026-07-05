import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react'
import { C, FONT_DISPLAY } from '../../theme.ts'
import { MiniSlidePreview } from '../../components/MiniSlidePreview.tsx'
import { ShareDialog } from '../../components/ui/ShareDialog.tsx'
import type { SlidePreviewData } from '../../types.ts'

interface PulseTileProps {
  code: string
  firstSlide: SlidePreviewData | null
  list?: (string | number)[]
  title: string
  dateLabel: string
  onClick: () => void
  onDelete: () => void
  onRename: (newTitle: string) => void
}

export function PulseTile({code,firstSlide,list,title,dateLabel,onClick,onDelete,onRename}: PulseTileProps){
  const [hov,setHov]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [renaming,setRenaming]=useState(false)
  const [draftTitle,setDraftTitle]=useState(title)
  const [sharing,setSharing]=useState(false)

  const commitRename=()=>{
    setRenaming(false)
    const trimmed=draftTitle.trim()
    if (trimmed&&trimmed!==title) onRename(trimmed)
    else setDraftTitle(title)
  }

  return(
    <div onClick={renaming?undefined:onClick} onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>{setHov(false);setMenuOpen(false)}}
      style={{position:'relative',width:'100%',cursor:'pointer',borderRadius:6,overflow:'hidden',
        background:C.surface,border:`2px solid ${C.border}`,boxShadow:C.shadow}}>

      <div style={{position:'relative',aspectRatio:'16/9',background:C.purpleBg,display:'flex',padding:'12px 14px'}}>
        <MiniSlidePreview slide={firstSlide} list={list}/>
      </div>

      <div style={{padding:'12px 14px',background:C.surfaceAlt}}>
        {renaming
          ? <input autoFocus value={draftTitle} onChange={e=>setDraftTitle(e.target.value)}
              onClick={e=>e.stopPropagation()} onBlur={commitRename}
              onKeyDown={e=>{
                if (e.key==='Enter') commitRename()
                if (e.key==='Escape') { setDraftTitle(title); setRenaming(false) }
              }}
              style={{width:'100%',fontFamily:FONT_DISPLAY,fontWeight:600,fontSize:15,color:C.txt1,
                background:C.surface,border:`1.5px solid ${C.purple}`,borderRadius:4,padding:'2px 6px',outline:'none'}}/>
          : <div style={{fontFamily:FONT_DISPLAY,fontWeight:600,fontSize:15,color:C.txt1,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</div>}
        <div style={{color:C.txt4,fontSize:12,marginTop:4,fontWeight:600}}>{dateLabel}</div>
      </div>

      {hov&&!renaming&&(
        <div style={{position:'absolute',bottom:10,right:10}}>
          <button onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o)}}
            style={{width:26,height:26,borderRadius:4,border:`1.5px solid ${C.border}`,background:C.surfaceAlt,
              color:C.txt2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:C.shadow}}>
            <MoreVertical size={14}/>
          </button>
          {menuOpen&&(
            <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'100%',right:0,marginBottom:8,
              background:C.surfaceAlt,border:`1.5px solid ${C.border}`,borderRadius:6,boxShadow:C.shadowHov,
              padding:6,zIndex:10,minWidth:200,display:'flex',flexDirection:'column',gap:2}}>
              <button onClick={()=>{ setMenuOpen(false); setDraftTitle(title); setRenaming(true) }}
                style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:10,
                  padding:'11px 14px',borderRadius:5,border:'none',background:'transparent',
                  color:C.txt2,cursor:'pointer',fontSize:14,fontWeight:700}}>
                <Pencil size={15}/> Rename
              </button>
              <button onClick={()=>{ setMenuOpen(false); setSharing(true) }}
                style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:10,
                  padding:'11px 14px',borderRadius:5,border:'none',background:'transparent',
                  color:C.txt2,cursor:'pointer',fontSize:14,fontWeight:700}}>
                <Share2 size={15}/> Share with Participants
              </button>
              <button onClick={()=>{ setMenuOpen(false); onDelete() }}
                style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:10,
                  padding:'11px 14px',borderRadius:5,border:'none',background:'transparent',
                  color:C.red,cursor:'pointer',fontSize:14,fontWeight:700}}>
                <Trash2 size={15}/> Delete
              </button>
            </div>
          )}
        </div>
      )}

      {sharing&&<ShareDialog code={code} onClose={()=>setSharing(false)}/>}
    </div>
  )
}
