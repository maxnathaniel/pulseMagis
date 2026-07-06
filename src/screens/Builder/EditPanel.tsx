import { useRef, useState } from 'react'
import { AlignLeft, AlignRight, Image as ImageIcon, X, Copy, ChevronDown, Crop, ShieldCheck, Lock, Link2, type LucideIcon } from 'lucide-react'
import { C, FONT_DISPLAY, RESPONSE_MODES, SLIDE_TYPES, RESULTS_FORMATS } from '../../theme.ts'
import { readFileAsDataUrl, compressDataUrl } from '../../lib/helpers.ts'
import { SectionLabel } from '../../components/ui/SectionLabel.tsx'
import { ToggleChip } from '../../components/ui/ToggleChip.tsx'
import { ImageCropModal } from './ImageCropModal.tsx'
import type { Slide, SlidePatch, SlideType, ResponseMode, Layout } from '../../types.ts'

const LAYOUT_OPTIONS: [Layout, LucideIcon, string][] = [
  ['left', AlignLeft, 'Image left'],
  ['right', AlignRight, 'Image right'],
]

// Cap for the preserved uncropped "original" — high enough to re-crop into
// a sharp 640px final image, low enough to not store multi-megabyte photos
// inline in the DB.
const ORIGINAL_MAX_PX = 1600

interface EditPanelProps {
  slide: Slide
  onChange: (patch: SlidePatch) => void
  onChangeType: (type: SlideType) => void
  qaTakenByOther: boolean
  onApplyToAll: (mode: ResponseMode) => void
  onClose: () => void
  qnaModeration: boolean
  moderatorPin: string
  onToggleQnaModeration: () => void
  onChangeModeratorPin: (pin: string) => void
  sessionCode: string | undefined
}

export function EditPanel({slide,onChange,onChangeType,qaTakenByOther,onApplyToAll,onClose,qnaModeration,moderatorPin,onToggleQnaModeration,onChangeModeratorPin,sessionCode}: EditPanelProps){
  const fileRef=useRef<HTMLInputElement>(null)
  const [typeMenuOpen,setTypeMenuOpen]=useState(false)
  const [cropSrc,setCropSrc]=useState<string|null>(null)
  const [linkCopied,setLinkCopied]=useState(false)
  // The uncropped image to save alongside the next crop confirmation — kept
  // separate from cropSrc since on "Edit crop" the two start out equal but
  // cropSrc gets replaced by the new crop while this stays the same source.
  const [pendingOriginal,setPendingOriginal]=useState<string|null>(null)
  // The slide's currently-saved crop result, passed to the modal only when
  // re-editing an existing crop (not a fresh upload) so it can detect that
  // crop's aspect ratio and reopen showing the same shape instead of always
  // resetting to the "Perfect" default.
  const [reCropCurrent,setReCropCurrent]=useState<string|null>(null)
  const currentType=SLIDE_TYPES.find(t=>t.key===slide.type)!
  const handleUpload=async(file: File | null | undefined)=>{
    if (!file) return
    try{
      const raw=await readFileAsDataUrl(file)
      setPendingOriginal(await compressDataUrl(raw, ORIGINAL_MAX_PX))
      setReCropCurrent(null)
      setCropSrc(raw)
    }
    catch(e){ console.error(e) }
  }
  // Re-crop from the preserved uncropped original when available, falling
  // back to the current (possibly already-cropped) contentImage for slides
  // that predate contentImageOriginal — either way, that same source is
  // what gets saved back as the original alongside the new crop.
  const openEditCrop=()=>{
    const source=slide.contentImageOriginal||slide.contentImage
    if (!source) return
    setPendingOriginal(source)
    setReCropCurrent(slide.contentImage)
    setCropSrc(source)
  }
  const copyModeratorLink=async()=>{
    if (!sessionCode||!moderatorPin.trim()) return
    const link=`${window.location.origin}/?joinCode=${sessionCode}&role=moderator`
    try{await navigator.clipboard.writeText(link);setLinkCopied(true);setTimeout(()=>setLinkCopied(false),1500)}catch(_){}
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

      <div style={{position:'relative'}}>
        <SectionLabel>Question type</SectionLabel>
        <button onClick={()=>setTypeMenuOpen(o=>!o)}
          style={{marginTop:8,width:'100%',padding:'10px 12px',borderRadius:6,
            border:`1.5px solid ${C.border}`,background:C.surfaceAlt,cursor:'pointer',
            display:'flex',alignItems:'center',gap:9}}>
          <currentType.icon size={15} color={C.purple}/>
          <span style={{flex:1,textAlign:'left',fontFamily:FONT_DISPLAY,fontWeight:700,
            fontSize:13,color:C.txt1}}>{currentType.label}</span>
          <ChevronDown size={15} color={C.txt3}/>
        </button>
        {typeMenuOpen&&(
          <>
            <div onClick={()=>setTypeMenuOpen(false)}
              style={{position:'fixed',inset:0,background:'transparent',zIndex:40}}/>
            <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:6,
              background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:4,
              boxShadow:C.shadowHov,padding:4,zIndex:41}}>
              {SLIDE_TYPES.map(t=>{
                const Icon=t.icon
                const isCurrent=t.key===slide.type
                const disabled=isCurrent||(t.key==='qa'&&qaTakenByOther)
                return(
                  <button key={t.key} disabled={disabled}
                    onClick={()=>{ if(!disabled){ setTypeMenuOpen(false); onChangeType(t.key) } }}
                    style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:9,
                      padding:'8px 9px',borderRadius:4,border:'none',
                      background:isCurrent?C.surfaceHov:'transparent',
                      cursor:disabled?'not-allowed':'pointer',opacity:isCurrent?1:(disabled?0.5:1)}}
                    onMouseEnter={e=>{ if (!disabled) e.currentTarget.style.background=C.surfaceHov }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=isCurrent?C.surfaceHov:'transparent' }}>
                    <Icon size={14} color={isCurrent?C.purple:C.txt2}/>
                    <span style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:13,
                      color:isCurrent?C.purple:C.txt1}}>
                      {t.label}{disabled&&!isCurrent?' (added)':''}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {slide.type==='qa'&&(
        <div>
          <SectionLabel>Q&A settings</SectionLabel>
          <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:8}}>
            <ToggleChip icon={qnaModeration?ShieldCheck:Lock}
              label={qnaModeration?'Moderation on — new questions need approval':'Moderation off — questions post instantly'}
              active={qnaModeration} onClick={onToggleQnaModeration}/>
          </div>
          <div style={{marginTop:10,background:C.surfaceAlt,border:`1.5px solid ${C.border}`,borderRadius:4,padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12.5,color:C.txt3,fontWeight:700}}>
              <Lock size={12}/> CO-MODERATOR PIN <span style={{fontWeight:600,color:C.txt4}}>(optional)</span>
            </div>
            <input value={moderatorPin} onChange={e=>onChangeModeratorPin(e.target.value.slice(0,20))}
              placeholder="Set a PIN so co-moderators can unlock moderation…" type="password"
              style={{width:'100%',background:C.inputBg,border:`1.5px solid ${C.border}`,borderRadius:4,padding:'9px 12px',color:C.txt1,fontSize:13.5,outline:'none'}}/>
            <div style={{fontSize:11.5,color:C.txt4,lineHeight:1.5,fontWeight:600}}>
              Share this PIN with trusted co-moderators, along with the moderator link below — they open it on their own device to get approval powers, without ever seeing it on the projected screen.
            </div>
            <button onClick={copyModeratorLink} disabled={!sessionCode||!moderatorPin.trim()}
              title={!sessionCode?'Present once to generate a shareable moderator link':!moderatorPin.trim()?'Set a PIN above to enable the moderator link':undefined}
              style={{marginTop:2,width:'100%',padding:'9px 0',borderRadius:4,border:`1.5px solid ${C.border}`,
                background:'transparent',color:(!sessionCode||!moderatorPin.trim())?C.txt4:C.txt3,
                cursor:(!sessionCode||!moderatorPin.trim())?'not-allowed':'pointer',fontSize:12,fontWeight:700,
                display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <Link2 size={12}/> {linkCopied?'Link copied!':'Copy moderator link'}
            </button>
          </div>
        </div>
      )}

      {slide.type==='choice'&&(
        <div>
          <SectionLabel>Results format</SectionLabel>
          <div style={{display:'flex',marginTop:8,borderRadius:4,overflow:'hidden',border:`2px solid ${C.border}`}}>
            {RESULTS_FORMATS.map(({key,label,icon:Icon},i)=>{
              const active=(slide.resultsFormat||'bar')===key
              const isLast=i===RESULTS_FORMATS.length-1
              return(
                <button key={key} onClick={()=>onChange({resultsFormat:key})} title={label}
                  style={{flex:1,aspectRatio:'16 / 9',padding:0,border:'none',
                    borderRight:isLast?'none':`2px solid ${C.border}`,
                    background:active?C.purpleBg:C.surface,color:active?C.purple:C.txt3,
                    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Icon size={16}/>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Layout</SectionLabel>
        <div style={{display:'flex',marginTop:8}}>
          {LAYOUT_OPTIONS.map(([key,Icon,label],i)=>{
            const active=(slide.layout||'right')===key
            const isFirst=i===0
            const isLast=i===LAYOUT_OPTIONS.length-1
            return(
              <button key={key} onClick={()=>onChange({layout:key})} title={label}
                style={{flex:1,padding:'10px 0',
                  borderRadius:isFirst?'4px 0 0 4px':isLast?'0 4px 4px 0':0,
                  border:`2px solid ${active?C.purple:C.border}`,
                  marginLeft:isFirst?0:-2,position:'relative',zIndex:active?1:0,
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
            <div onClick={openEditCrop} title="Click to edit crop" style={{position:'relative',
              width:56,height:56,flexShrink:0,cursor:'pointer'}}>
              <img src={slide.contentImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover',
                borderRadius:5,border:`1.5px solid ${C.border}`,display:'block'}}/>
              <button onClick={e=>{e.stopPropagation();onChange({contentImage:null,contentImageOriginal:null})}} title="Remove image"
                style={{position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',
                  border:`1.5px solid ${C.surface}`,background:C.red,color:'#fff',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                <X size={11}/>
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:4}}>
              <button onClick={openEditCrop}
                style={{background:'none',border:'none',color:C.purple,cursor:'pointer',fontSize:12.5,fontWeight:700,
                  display:'flex',alignItems:'center',gap:5,padding:0}}>
                <Crop size={12}/> Edit crop
              </button>
              <button onClick={()=>fileRef.current?.click()}
                style={{background:'none',border:'none',color:C.txt3,cursor:'pointer',fontSize:12.5,fontWeight:700,padding:0}}>
                Replace image
              </button>
            </div>
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

      {cropSrc&&(
        <ImageCropModal imageSrc={cropSrc} currentImageSrc={reCropCurrent||undefined}
          onCancel={()=>{ setCropSrc(null); setPendingOriginal(null); setReCropCurrent(null) }}
          onConfirm={dataUrl=>{
            onChange({contentImage:dataUrl, contentImageOriginal:pendingOriginal})
            setCropSrc(null); setPendingOriginal(null); setReCropCurrent(null)
          }}/>
      )}

      <div>
        <SectionLabel>Show responses</SectionLabel>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
          {RESPONSE_MODES.map(({key,label,description})=>{
            const active=(slide.responseMode||'instant')===key
            return(
              <label key={key}
                style={{textAlign:'left',padding:'10px 12px',borderRadius:4,
                  border:`2px solid ${active?C.purple:C.border}`,
                  background:active?C.purpleBg:C.surface,cursor:'pointer',
                  display:'flex',alignItems:'flex-start',gap:9}}>
                <input type="radio" name="responseMode" checked={active}
                  onChange={()=>onChange({responseMode:key})}
                  style={{marginTop:3,flexShrink:0,accentColor:C.purple,cursor:'pointer'}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:active?C.purple:C.txt1}}>{label}</div>
                  <div style={{fontSize:11,color:C.txt4,fontWeight:600,marginTop:2}}>{description}</div>
                </div>
              </label>
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
