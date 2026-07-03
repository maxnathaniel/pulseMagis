import { useRef } from 'react'
import { AlignLeft, AlignRight, Image as ImageIcon, X, Copy, type LucideIcon } from 'lucide-react'
import { C, FONT_DISPLAY, RESPONSE_MODES } from '../../theme.ts'
import { compressImage } from '../../lib/helpers.ts'
import { SectionLabel } from '../../components/ui/SectionLabel.tsx'
import type { Slide, ResponseMode, Layout } from '../../types.ts'

const CONTENT_IMAGE_MAX_PX = 640

const LAYOUT_OPTIONS: [Layout, LucideIcon, string][] = [
  ['left', AlignLeft, 'Image left'],
  ['right', AlignRight, 'Image right'],
]

interface EditPanelProps {
  slide: Slide
  onChange: (patch: Partial<Slide>) => void
  onApplyToAll: (mode: ResponseMode) => void
  onClose: () => void
}

export function EditPanel({slide,onChange,onApplyToAll,onClose}: EditPanelProps){
  const fileRef=useRef<HTMLInputElement>(null)
  const handleUpload=async(file: File | null | undefined)=>{
    if (!file) return
    try{ onChange({contentImage: await compressImage(file, CONTENT_IMAGE_MAX_PX)}) }
    catch(e){ console.error(e) }
  }
  return(
    <div style={{width:280,flexShrink:0,borderLeft:`1.5px solid ${C.border}`,
      padding:20,overflowY:'auto',display:'flex',flexDirection:'column',gap:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:16,color:C.txt1}}>Edit slide</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.txt4,cursor:'pointer',padding:4}}>
          <X size={16}/>
        </button>
      </div>

      <div>
        <SectionLabel>Layout</SectionLabel>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          {LAYOUT_OPTIONS.map(([key,Icon,label])=>{
            const active=(slide.layout||'right')===key
            return(
              <button key={key} onClick={()=>onChange({layout:key})} title={label}
                style={{flex:1,padding:'10px 0',borderRadius:4,
                  border:`2px solid ${active?C.purple:C.border}`,
                  background:active?C.purpleBg:C.surface,color:active?C.purple:C.txt3,
                  cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
                <Icon size={16}/>
                <span style={{fontSize:11,fontWeight:700}}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Content image</SectionLabel>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
          onChange={e=>handleUpload(e.target.files?.[0])}/>
        {slide.contentImage?(
          <div style={{marginTop:8,display:'flex',alignItems:'center',gap:10}}>
            <div onClick={()=>fileRef.current?.click()} title="Click to replace" style={{position:'relative',
              width:56,height:56,flexShrink:0,cursor:'pointer'}}>
              <img src={slide.contentImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover',
                borderRadius:5,border:`1.5px solid ${C.border}`,display:'block'}}/>
              <button onClick={e=>{e.stopPropagation();onChange({contentImage:null})}} title="Remove image"
                style={{position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',
                  border:`1.5px solid ${C.surface}`,background:C.red,color:'#fff',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                <X size={11}/>
              </button>
            </div>
            <button onClick={()=>fileRef.current?.click()}
              style={{background:'none',border:'none',color:C.purple,cursor:'pointer',fontSize:12.5,fontWeight:700}}>
              Replace image
            </button>
          </div>
        ):(
          <button onClick={()=>fileRef.current?.click()} style={{marginTop:8,width:'100%',
            padding:'28px 12px',borderRadius:5,border:`2px dashed ${C.border}`,background:'transparent',
            color:C.txt3,display:'flex',flexDirection:'column',alignItems:'center',gap:8,
            cursor:'pointer',fontSize:12.5,fontWeight:700}}>
            <ImageIcon size={20} color={C.txt4}/> Click to upload
          </button>
        )}
      </div>

      <div>
        <SectionLabel>Show responses</SectionLabel>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
          {RESPONSE_MODES.map(({key,label,description})=>{
            const active=(slide.responseMode||'instant')===key
            return(
              <button key={key} onClick={()=>onChange({responseMode:key})}
                style={{textAlign:'left',padding:'10px 12px',borderRadius:4,
                  border:`2px solid ${active?C.purple:C.border}`,
                  background:active?C.purpleBg:C.surface,cursor:'pointer'}}>
                <div style={{fontSize:13,fontWeight:700,color:active?C.purple:C.txt1}}>{label}</div>
                <div style={{fontSize:11,color:C.txt4,fontWeight:600,marginTop:2}}>{description}</div>
              </button>
            )
          })}
        </div>
        <button onClick={()=>onApplyToAll(slide.responseMode||'instant')}
          style={{marginTop:10,width:'100%',padding:'9px 0',borderRadius:4,border:`1.5px solid ${C.border}`,
            background:'transparent',color:C.txt3,cursor:'pointer',fontSize:12,fontWeight:700,
            display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          <Copy size={12}/> Apply to all slides
        </button>
      </div>
    </div>
  )
}
