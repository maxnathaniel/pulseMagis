import { useEffect, useRef, useState } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { C, FONT_DISPLAY } from '../../theme.ts'
import { Modal } from '../../components/ui/Modal.tsx'
import { cropAndCompress } from '../../lib/helpers.ts'

// Matches the actual on-slide content-image box (SlideEditor/PresenterSlideCard/
// MiniSlidePreview all share this: a fixed 25% of the slide's width, by its
// full height) — for a 16:9 slide that's 0.25 * (16/9). The on-slide box always
// renders full-bleed via object-fit:cover regardless of what's picked here, so
// this preset isn't required for a full-height fill — it just previews the
// exact framing that'll show up with no extra auto-cropping on top.
const PERFECT_ASPECT = 0.25 * (16 / 9)

type Preset = 'perfect' | 'square' | 'free'
const PRESETS: [Preset, string, number | undefined][] = [
  ['perfect', 'Perfect', PERFECT_ASPECT],
  ['square', 'Square', 1],
  ['free', 'Free Form', undefined],
]

interface ImageCropModalProps {
  imageSrc: string
  // The slide's currently-saved crop result, when re-editing an existing
  // crop — its aspect ratio is used to reopen the tool on the same shape
  // instead of always resetting to the "Perfect" default. Omitted for a
  // fresh upload, where there's no previous crop to preserve.
  currentImageSrc?: string
  onCancel: () => void
  onConfirm: (croppedDataUrl: string) => void
}

function centeredCrop(width: number, height: number, aspect: number | undefined): Crop {
  if (aspect===undefined) return { unit: '%', x: 5, y: 5, width: 90, height: 90 }
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height)
}

export function ImageCropModal({imageSrc,currentImageSrc,onCancel,onConfirm}: ImageCropModalProps){
  const imgRef = useRef<HTMLImageElement>(null)
  const initialized = useRef(false)
  const [preset,setPreset] = useState<Preset>('perfect')
  const [crop,setCrop] = useState<Crop>()
  const [completedCrop,setCompletedCrop] = useState<PixelCrop>()
  const [mainImgSize,setMainImgSize] = useState<{w:number; h:number}|null>(null)
  const [savedAspect,setSavedAspect] = useState<number|undefined>()
  const [savedAspectReady,setSavedAspectReady] = useState(!currentImageSrc)

  // Detect the aspect ratio of whatever crop is currently saved on the
  // slide (if any) — used below to reopen the tool showing that same
  // shape rather than always resetting to the "Perfect" default.
  useEffect(() => {
    if (!currentImageSrc) return
    const img = new Image()
    img.onload = () => { setSavedAspect(img.naturalWidth / img.naturalHeight); setSavedAspectReady(true) }
    img.onerror = () => setSavedAspectReady(true)
    img.src = currentImageSrc
  }, [currentImageSrc])

  const applyPreset = (p: Preset, aspect: number | undefined) => {
    setPreset(p)
    const img = imgRef.current
    if (img) setCrop(centeredCrop(img.width, img.height, aspect))
  }

  const onImageLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget
    setMainImgSize({w:img.width, h:img.height})
  }

  // Runs once both the reference image's rendered size and the saved crop's
  // aspect (if any) are known, so the very first crop this tool shows
  // matches whatever's already saved instead of a fresh recentered default.
  useEffect(() => {
    if (initialized.current || !mainImgSize || !savedAspectReady) return
    initialized.current = true
    const matched = savedAspect!==undefined
      ? PRESETS.find(([,,a]) => a!==undefined && Math.abs(a-savedAspect)<0.01)
      : undefined
    const aspect = matched ? matched[2] : (savedAspect ?? PERFECT_ASPECT)
    setPreset(matched ? matched[0] : (savedAspect!==undefined ? 'free' : 'perfect'))
    setCrop(centeredCrop(mainImgSize.w, mainImgSize.h, aspect))
  }, [mainImgSize, savedAspectReady, savedAspect])

  const handleConfirm = () => {
    const img = imgRef.current
    if (!img || !completedCrop || !completedCrop.width || !completedCrop.height) return
    onConfirm(cropAndCompress(img, completedCrop, 640))
  }

  const currentAspect = PRESETS.find(([p])=>p===preset)?.[2]

  return (
    <Modal onClose={onCancel} maxWidth={640}>
      <div style={{fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:18,color:C.txt1,marginBottom:16}}>Crop image</div>

      <div style={{display:'flex',justifyContent:'center',background:C.surfaceAlt,borderRadius:6,padding:12}}>
        <ReactCrop crop={crop} onChange={(_,percentCrop)=>setCrop(percentCrop)} onComplete={c=>setCompletedCrop(c)}
          aspect={currentAspect} ruleOfThirds keepSelection>
          <img ref={imgRef} src={imageSrc} alt="" onLoad={onImageLoad} style={{maxHeight:'60vh',display:'block'}}/>
        </ReactCrop>
      </div>

      <div style={{display:'flex',marginTop:16}}>
        {PRESETS.map(([key,label,aspect],i)=>{
          const active=preset===key
          const isFirst=i===0
          const isLast=i===PRESETS.length-1
          return(
            <button key={key} onClick={()=>applyPreset(key,aspect)}
              style={{flex:1,padding:'10px 0',
                borderRadius:isFirst?'4px 0 0 4px':isLast?'0 4px 4px 0':0,
                border:`2px solid ${active?C.purple:C.border}`,
                marginLeft:isFirst?0:-2,position:'relative',zIndex:active?1:0,
                background:active?C.purpleBg:C.surface,color:active?C.purple:C.txt3,
                cursor:'pointer',fontFamily:FONT_DISPLAY,fontSize:13,fontWeight:700}}>
              {label}
            </button>
          )
        })}
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        <button onClick={onCancel}
          style={{padding:'10px 20px',borderRadius:5,border:`1.5px solid ${C.border}`,background:'transparent',
            color:C.txt3,cursor:'pointer',fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14}}>
          Cancel
        </button>
        <button onClick={handleConfirm}
          style={{padding:'10px 20px',borderRadius:5,border:'none',background:C.purple,color:'#fff',
            cursor:'pointer',fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:14,boxShadow:`0 4px 20px ${C.purpleBg}`}}>
          Apply crop
        </button>
      </div>
    </Modal>
  )
}
