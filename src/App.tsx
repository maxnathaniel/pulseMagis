import { useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import type { JSONContent } from '@tiptap/core'
import { supabase } from './lib/supabase.ts'
import { C, FONT_BODY, useFonts, EMPTY_RICH_DOC } from './theme.ts'
import { uid, genCode, hashPin, mapSlide, mapSlideForBuilder, mapQuestion } from './lib/helpers.ts'
import { Home } from './screens/Home/Home.tsx'
import { Login } from './screens/Login/Login.tsx'
import { Builder } from './screens/Builder/Builder.tsx'
import { Presenter } from './screens/Presenter/Presenter.tsx'
import { Join } from './screens/Join/Join.tsx'
import { Vote } from './screens/Vote/Vote.tsx'
import { EmptyState } from './components/ui/EmptyState.tsx'
import type { Draft, Session, Slide, SlideType, SlidePatch, Question, PulseSummary, ResponsesBySlide, ModerateAction } from './types.ts'

type Screen = 'home' | 'build' | 'present' | 'join' | 'vote'
type LoginMode = 'signin' | 'signup'

// ════════════════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  useFonts()

  // ── builder ──────────────────────────────────────────────────────────────
  const createSlide = (type: SlideType): Slide => {
    if (type === 'choice') {
      return { id: uid(), type, question: '', options: ['', '', '', ''], optionImages: [null, null, null, null],
        layout: 'right', contentImage: null, responseMode: 'instant' }
    }
    if (type === 'plain') {
      return { id: uid(), type, question: '', layout: 'right', contentImage: null, responseMode: 'instant',
        content: EMPTY_RICH_DOC, verticalAlign: 'middle' }
    }
    return { id: uid(), type, question: '', layout: 'right', contentImage: null, responseMode: 'instant' }
  }

  const [screen, setScreen]         = useState<Screen>('home')
  const [draft, setDraft]           = useState<Draft>({
    title: 'Untitled presentation', qnaModeration: true, moderatorPin: '',
    slides: [createSlide('choice')],
  })
  const [session,     setSession]   = useState<Session | null>(null)
  const [slideIndex,  setSlideIndex]= useState(0)
  const [responses,   setResponses] = useState<ResponsesBySlide>({})
  const [copied,      setCopied]    = useState(false)
  const [joinCode,    setJoinCode]  = useState('')
  const [joinError,   setJoinError] = useState('')
  const [joinLoading, setJoinLoading]=useState(false)
  const [autoJoining, setAutoJoining]=useState(false)
  const [votedSlides, setVotedSlides]=useState<Record<string, boolean>>({})
  const [choiceInput, setChoiceInput]=useState<number | null>(null)
  const [textInput,   setTextInput] = useState('')
  const [submitting,  setSubmitting] = useState(false)
  const [participantId]             = useState(() => uid('p'))
  const [qnaList,     setQnaList]   = useState<Question[]>([])
  const [qnaDraft,    setQnaDraft]  = useState('')
  const [qnaSubmitting,setQnaSubmitting]=useState(false)
  const [, setIsModerator]=useState(false)
  const [audienceCount,setAudienceCount]=useState(0)

  // ── auth ─────────────────────────────────────────────────────────────────
  const [user,         setUser]         = useState<User | null>(null)
  const [loadingAuth,  setLoadingAuth]  = useState(true)
  const [loginEmail,   setLoginEmail]   = useState('')
  const [loginPassword,setLoginPassword]= useState('')
  const [loginMode,    setLoginMode]    = useState<LoginMode>('signin')
  const [loginError,   setLoginError]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // ── home: created Pulses ────────────────────────────────────────────────
  const [pulses,        setPulses]        = useState<PulseSummary[]>([])
  const [pulsesLoading, setPulsesLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setUser(data.session?.user ?? null)
      setLoadingAuth(false)
    })
    const {data:sub}=supabase.auth.onAuthStateChange((_event,session)=>{
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const submitLogin = async () => {
    setLoginError('')
    if (!loginEmail.trim()||!loginPassword) { setLoginError('Enter your email and password.'); return }
    setLoginLoading(true)
    const {error} = loginMode==='signup'
      ? await supabase.auth.signUp({email:loginEmail.trim(), password:loginPassword})
      : await supabase.auth.signInWithPassword({email:loginEmail.trim(), password:loginPassword})
    setLoginLoading(false)
    if (error) { setLoginError(error.message); return }
    setLoginEmail(''); setLoginPassword('')
  }
  const logout = async () => { await supabase.auth.signOut() }

  // ── URL sync: give each open Pulse its own reloadable URL ────────────────
  const setPulseUrl = (code: string, mode: string) => {
    const url=new URL(window.location.href)
    url.searchParams.set('pulse', code)
    url.searchParams.set('mode', mode)
    window.history.replaceState(null, '', url)
  }
  const clearPulseUrl = () => {
    const url=new URL(window.location.href)
    url.searchParams.delete('pulse'); url.searchParams.delete('mode')
    window.history.replaceState(null, '', url)
  }

  const fetchPulses = useCallback(async () => {
    if (!user) return
    setPulsesLoading(true)
    const {data,error} = await supabase.from('sessions')
      .select('code,title,created_at').eq('owner_id',user.id).order('created_at',{ascending:false})
      .returns<{code:string; title:string; created_at:string}[]>()
    if (error) console.error(error)
    const codes=(data||[]).map(p=>p.code)
    let firstSlideByCode: Record<string, PulseSummary['firstSlide']> = {}
    if (codes.length) {
      const {data:slideRows,error:slideError}=await supabase.from('slides')
        .select('session_code,type,question,options,content_image,layout,content,vertical_align').in('session_code',codes).eq('position',0)
        .returns<{session_code:string; type:SlideType; question:string; options:string[] | null; content_image:string | null; layout:'left'|'right'; content:JSONContent | null; vertical_align:'top'|'middle'|'bottom'}[]>()
      if (slideError) console.error(slideError)
      firstSlideByCode=Object.fromEntries((slideRows||[]).map(s=>[s.session_code, {
        type:s.type, question:s.question, options:s.options,
        contentImage:s.content_image, layout:s.layout,
        content:s.content, verticalAlign:s.vertical_align,
      }]))
    }
    setPulses((data||[]).map(p=>({...p, firstSlide:firstSlideByCode[p.code]||null})))
    setPulsesLoading(false)
  }, [user])
  useEffect(() => { if (screen==='home' && user) fetchPulses() }, [screen, user, fetchPulses])

  const updateSlide = (id: string, patch: SlidePatch) =>
    setDraft(d => ({ ...d, slides: d.slides.map(s => s.id===id ? {...s,...patch} as Slide : s) }))
  // Switching type via the 3-dot menu can't just patch {type} onto the slide
  // (updateSlide's job) — a slide changing INTO 'choice' needs options/
  // optionImages, INTO 'plain' needs content/verticalAlign, etc., none of
  // which exist on a slide of a different type. Mirrors createSlide's
  // per-type shape, but keeps whatever's reusable (question/layout/
  // contentImage/responseMode) instead of wiping the slide.
  const changeSlideType = (id: string, newType: SlideType) =>
    setDraft(d => ({ ...d, slides: d.slides.map((s): Slide => {
      if (s.id!==id || s.type===newType) return s
      const shared={question:s.question, layout:s.layout, contentImage:s.contentImage, responseMode:s.responseMode}
      if (newType==='choice') return { id:s.id, type:newType, ...shared,
        options: s.type==='choice' && s.options.length ? s.options : ['','','',''],
        optionImages: s.type==='choice' && s.optionImages.length ? s.optionImages : [null,null,null,null] }
      if (newType==='plain') return { id:s.id, type:newType, ...shared,
        content: (s.type==='plain' && s.content) || EMPTY_RICH_DOC, verticalAlign: (s.type==='plain' && s.verticalAlign) || 'middle' }
      return { id:s.id, type:newType, ...shared }
    })}))
  const applyResponseModeToAll = (mode: Slide['responseMode']) =>
    setDraft(d => ({ ...d, slides: d.slides.map(s => ({ ...s, responseMode: mode })) }))
  const addSlide = (type: SlideType) =>
    setDraft(d => ({ ...d, slides: [...d.slides, createSlide(type)] }))
  const removeSlide = (id: string) =>
    setDraft(d => d.slides.length<=1 ? d : { ...d, slides: d.slides.filter(s=>s.id!==id) })
  const reorderSlide = (id: string, toIndex: number) =>
    setDraft(d => {
      const fromIndex=d.slides.findIndex(s=>s.id===id)
      if (fromIndex===-1||fromIndex===toIndex) return d
      const slides=[...d.slides]
      const [moved]=slides.splice(fromIndex,1)
      slides.splice(toIndex,0,moved)
      return {...d,slides}
    })
  const addOption = (sid: string) =>
    setDraft(d => ({ ...d, slides: d.slides.map(s => s.type==='choice' && s.id===sid && s.options.length<6
      ? {...s, options:[...s.options,''], optionImages:[...s.optionImages,null]} : s) }))
  const removeOption = (sid: string, oi: number) =>
    setDraft(d => ({ ...d, slides: d.slides.map(s => s.type==='choice' && s.id===sid && s.options.length>2
      ? {...s, options:s.options.filter((_,i)=>i!==oi), optionImages:s.optionImages.filter((_,i)=>i!==oi)} : s) }))
  const updateOption = (sid: string, oi: number, val: string) =>
    setDraft(d => ({ ...d, slides: d.slides.map(s => s.type==='choice' && s.id===sid
      ? {...s, options:s.options.map((o,i)=>i===oi?val:o)} : s) }))
  const qnaEnabled = draft.slides.some(s => s.type==='qa')

  // ── start presenting ──────────────────────────────────────────────────────
  const startPresenting = async (startIndex = 0) => {
    // startPresenting does its own authoritative delete-and-reinsert of
    // slides below. Suppress the autosave "flush on leave" effect (fired by
    // the screen change to 'present' at the end of this function) so it
    // doesn't fire a redundant/racy upsert of its own, AND wait for any
    // already-in-flight autosave (debounce timer that fired, or a previous
    // flush) to fully finish — clearTimeout can't stop a call that already
    // started, and an interleaved write here is what was corrupting slide
    // `position` ordering (presenter's own view stayed correct since it's
    // built from local state, but audience joins re-fetch from the DB,
    // ordered by `position`, so they'd see whatever the race left behind).
    suppressAutosaveFlush.current=true
    if (persistInFlight.current) await persistInFlight.current
    // Also wait for any in-flight current_slide_index write left over from
    // a just-ended presentation, so it can't land after (and overwrite) the
    // startIndex update below. See goToSlide's own comment for why this
    // matters.
    if (goToSlideInFlight.current) await goToSlideInFlight.current
    const isUpdate=!!draft.code
    const code=isUpdate ? draft.code! : genCode()
    const title=draft.title.trim()||'Untitled presentation'

    let pinHash: string | null
    if (draft.moderatorPin.trim()) {
      pinHash=await hashPin(draft.moderatorPin.trim())
    } else if (isUpdate) {
      // pin_hash is one-way (SHA-256) — a blank PIN field on resume does not
      // mean "remove the PIN", so preserve whatever's already stored.
      const {data:existing}=await supabase.from('sessions').select('pin_hash').eq('code',code).single()
      pinHash=existing?.pin_hash ?? null
    } else {
      pinHash=null
    }

    if (isUpdate) {
      const {error:sessUpdErr}=await supabase.from('sessions').update({
        title, current_slide_index:startIndex, qna_enabled:qnaEnabled,
        qna_moderation:draft.qnaModeration, pin_hash:pinHash, is_live:true, has_presented:true,
      }).eq('code',code)
      if (sessUpdErr) console.error(sessUpdErr)
      const {error:delErr}=await supabase.from('slides').delete().eq('session_code',code)
      if (delErr) console.error(delErr)
    } else {
      await supabase.from('sessions').insert({
        code, title, owner_id:user!.id, current_slide_index:startIndex, qna_enabled:qnaEnabled,
        qna_moderation:draft.qnaModeration, pin_hash:pinHash, is_live:true, has_presented:true,
      })
    }

    await supabase.from('slides').insert(draft.slides.map((s,idx) => ({
      id:s.id, session_code:code, type:s.type, question:s.question,
      options:s.type==='choice'?s.options.filter(o=>o.trim()):null,
      option_images:s.type==='choice'?(s.optionImages||null):null, position:idx,
      layout:s.layout||'right', content_image:s.contentImage||null, response_mode:s.responseMode||'instant',
      content:s.type==='plain'?(s.content||null):null, vertical_align:s.type==='plain'?(s.verticalAlign||'middle'):'middle',
    }))).then(({error}) => { if (error) console.error(error) })
    setSession({ code, title,
      slides:draft.slides.map(s=>s.type==='choice' ? {...s,options:s.options.filter(o=>o.trim())} : s),
      currentSlideIndex:startIndex, qnaEnabled,
      qnaModeration:draft.qnaModeration, pinHash, isLive:true, hasPresented:true })
    setSlideIndex(startIndex); setResponses({}); setQnaList([])
    setIsModerator(true); setScreen('present')
    setPulseUrl(code, 'present')
  }

  // ── resume an existing Pulse into the Builder ───────────────────────────
  const resumePulse = async (code: string) => {
    const {data:sd,error}=await supabase.from('sessions').select('*').eq('code',code).single()
    if (error||!sd) { console.error(error); return }
    const {data:slideRows}=await supabase.from('slides').select('*').eq('session_code',code).order('position')
    setDraft({
      code:sd.code, title:sd.title, qnaModeration:sd.qna_moderation, moderatorPin:'',
      slides:(slideRows||[]).map(mapSlideForBuilder),
    })
    setScreen('build')
    setPulseUrl(code, 'build')
  }

  // ── resume presenting an existing Pulse directly (e.g. after a reload) ──
  const resumePresenting = async (code: string) => {
    const {data:sd,error}=await supabase.from('sessions').select('*').eq('code',code).single()
    if (error||!sd) { console.error(error); return }
    const {data:slideRows}=await supabase.from('slides').select('*').eq('session_code',code).order('position')
    setSession({code:sd.code, title:sd.title, currentSlideIndex:sd.current_slide_index,
      qnaEnabled:sd.qna_enabled, qnaModeration:sd.qna_moderation, pinHash:sd.pin_hash, isLive:sd.is_live!==false,
      hasPresented:sd.has_presented===true,
      slides:(slideRows||[]).map(mapSlide)})
    setSlideIndex(sd.current_slide_index)
    setResponses({}); setQnaList([])
    setIsModerator(true); setScreen('present')
  }

  // ── delete a Pulse (cascades slides/responses/questions via schema FKs) ─
  const deletePulse = async (code: string) => {
    setPulses(p=>p.filter(x=>x.code!==code))
    const {error}=await supabase.from('sessions').delete().eq('code',code)
    if (error) { console.error(error); fetchPulses() }
  }

  // ── rename a Pulse from its Home tile ────────────────────────────────────
  const renamePulse = async (code: string, title: string) => {
    setPulses(p=>p.map(x=>x.code===code?{...x,title}:x))
    const {error}=await supabase.from('sessions').update({title}).eq('code',code)
    if (error) { console.error(error); fetchPulses() }
  }

  // ── create a brand-new Pulse and open it in the Builder ─────────────────
  const createNewPulse = async () => {
    const code=genCode()
    const {error}=await supabase.from('sessions').insert({
      code, title:'Untitled presentation', owner_id:user!.id, current_slide_index:0,
      qna_enabled:false, qna_moderation:true, pin_hash:null,
    })
    if (error) { console.error(error); return }
    setDraft({code, title:'Untitled presentation', qnaModeration:true, moderatorPin:'', slides:[createSlide('choice')]})
    setScreen('build')
    setPulseUrl(code, 'build')
  }

  // ── autosave: sync Builder edits to Supabase ─────────────────────────────
  // Unlike startPresenting (an explicit "start a fresh run" action that
  // deletes and reinserts all slides, intentionally cascading away stale
  // responses/questions), autosave must never destroy audience data just
  // because the presenter is idly editing. Slides are reconciled via
  // upsert-by-id, and only slides actually removed from the draft are
  // deleted (which correctly cascades away just that slide's responses).
  const persistDraft = async (d: Draft) => {
    if (!d.code) return
    const code=d.code
    const title=d.title.trim()||'Untitled presentation'
    const draftQnaEnabled=d.slides.some(s=>s.type==='qa')
    let pinHash: string | null
    if (d.moderatorPin.trim()) {
      pinHash=await hashPin(d.moderatorPin.trim())
    } else {
      const {data:existing}=await supabase.from('sessions').select('pin_hash').eq('code',code).single()
      pinHash=existing?.pin_hash ?? null
    }
    const {error:sessionError}=await supabase.from('sessions').update({
      title, qna_enabled:draftQnaEnabled, qna_moderation:d.qnaModeration, pin_hash:pinHash,
    }).eq('code',code)
    if (sessionError) console.error(sessionError)

    const slideRows=d.slides.map((s,idx) => ({
      id:s.id, session_code:code, type:s.type, question:s.question,
      options:s.type==='choice'?s.options.filter(o=>o.trim()):null,
      option_images:s.type==='choice'?(s.optionImages||null):null, position:idx,
      layout:s.layout||'right', content_image:s.contentImage||null, response_mode:s.responseMode||'instant',
      content:s.type==='plain'?(s.content||null):null, vertical_align:s.type==='plain'?(s.verticalAlign||'middle'):'middle',
    }))
    const {error:upsertError}=await supabase.from('slides').upsert(slideRows)
    if (upsertError) console.error(upsertError)

    const currentIds=d.slides.map(s=>s.id)
    const {data:existingSlides}=await supabase.from('slides').select('id').eq('session_code',code)
    const removedIds=(existingSlides||[]).map(r=>r.id).filter(id=>!currentIds.includes(id))
    if (removedIds.length) {
      const {error:deleteError}=await supabase.from('slides').delete().in('id',removedIds)
      if (deleteError) console.error(deleteError)
    }
  }

  // Tracks any currently in-flight persistDraft call so startPresenting can
  // wait for it to fully land before doing its own delete+reinsert of slides.
  // clearTimeout only cancels a *pending* debounce timer — it can't stop an
  // async call that already started (e.g. the timer fired, or the "flush on
  // leave" cleanup ran, moments before Present was clicked) — without this,
  // that in-flight write can interleave with startPresenting's writes and
  // corrupt slide `position` ordering.
  const persistInFlight = useRef<Promise<void> | null>(null)
  const runPersist = (d: Draft) => {
    const p = persistDraft(d)
    persistInFlight.current = p
    p.finally(() => { if (persistInFlight.current===p) persistInFlight.current=null })
    return p
  }

  // Debounced save while idly editing (avoids hammering Supabase on every keystroke).
  useEffect(() => {
    if (screen!=='build'||!draft.code) return
    const timer=setTimeout(() => { runPersist(draft) }, 800)
    return () => clearTimeout(timer)
  }, [screen, draft])

  // Immediate flush when leaving the Builder screen, so a quick "Back" click
  // right after an edit can't race the debounce timer and lose that edit.
  const draftRef=useRef(draft)
  useEffect(() => { draftRef.current=draft }, [draft])
  const suppressAutosaveFlush=useRef(false)
  useEffect(() => {
    if (screen!=='build') return
    return () => {
      if (suppressAutosaveFlush.current) { suppressAutosaveFlush.current=false; return }
      if (draftRef.current.code) runPersist(draftRef.current)
    }
  }, [screen])

  // ── realtime: responses ───────────────────────────────────────────────────
  useEffect(() => {
    if (screen!=='present'||!session) return
    const slide=session.slides[slideIndex]
    supabase.from('responses').select('value').eq('slide_id',slide.id)
      .then(({data}) => setResponses(r=>({...r,[slide.id]:(data||[]).map(d=>d.value)})))
    const ch=supabase.channel(`responses-${slide.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'responses',filter:`slide_id=eq.${slide.id}`},
        payload=>setResponses(r=>({...r,[slide.id]:[...(r[slide.id]||[]),payload.new.value]})))
      .subscribe()
    return ()=>{supabase.removeChannel(ch)}
  }, [screen, session?.code, slideIndex])

  // ── realtime: Q&A ─────────────────────────────────────────────────────────
  const fetchQna = useCallback(async (code: string) => {
    const {data}=await supabase.from('questions').select('*').eq('session_code',code).order('created_at')
    setQnaList((data||[]).map(mapQuestion))
  },[])
  useEffect(() => {
    if (!['present','vote'].includes(screen)||!session) return
    fetchQna(session.code)
    const ch=supabase.channel(`questions-${session.code}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'questions',filter:`session_code=eq.${session.code}`},
        ()=>fetchQna(session.code)).subscribe()
    return ()=>{supabase.removeChannel(ch)}
  },[screen,session?.code,fetchQna])

  // ── realtime: session (audience follows slide) ────────────────────────────
  // Tracks whether the audience's last-known state was live, so we can tell
  // "presenter just clicked Present while I was waiting" apart from a plain
  // slide-index update — in that case the slide deck may have changed since
  // we joined (it's fully rewritten on every Present click), so it needs a
  // fresh fetch rather than trusting whatever we fetched before it started.
  const wasLiveRef=useRef(session?.isLive)
  useEffect(() => { wasLiveRef.current=session?.isLive }, [session?.isLive])
  useEffect(() => {
    if (screen!=='vote'||!session) return
    const ch=supabase.channel(`session-${session.code}`)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'sessions',filter:`code=eq.${session.code}`},
        async payload=>{
          const nowLive=payload.new.is_live!==false
          if (!wasLiveRef.current && nowLive) {
            const {data:slideRows}=await supabase.from('slides').select('*').eq('session_code',payload.new.code).order('position')
            setSession(prev=>prev && ({...prev,
              currentSlideIndex:payload.new.current_slide_index,
              qnaModeration:payload.new.qna_moderation,
              isLive:true, hasPresented:true,
              slides:(slideRows||[]).map(mapSlide)}))
            return
          }
          setSession(prev=>prev && ({...prev,
            currentSlideIndex:payload.new.current_slide_index,
            qnaModeration:payload.new.qna_moderation,
            isLive:nowLive,
            hasPresented:payload.new.has_presented===true}))
        })
      .subscribe()
    return ()=>{supabase.removeChannel(ch)}
  },[screen,session?.code])

  // ── realtime: presence (presenter watches how many are in the room) ───────
  useEffect(() => {
    if (screen!=='present'||!session) return
    const ch=supabase.channel(`presence-${session.code}`)
    ch.on('presence',{event:'sync'},()=>setAudienceCount(Object.keys(ch.presenceState()).length))
    ch.subscribe()
    return ()=>{supabase.removeChannel(ch);setAudienceCount(0)}
  },[screen,session?.code])

  // ── realtime: presence (audience announces itself while it's in the room) ─
  useEffect(() => {
    if (screen!=='vote'||!session) return
    const ch=supabase.channel(`presence-${session.code}`,{config:{presence:{key:participantId}}})
    ch.subscribe(async status=>{ if (status==='SUBSCRIBED') await ch.track({joinedAt:Date.now()}) })
    return ()=>{supabase.removeChannel(ch)}
  },[screen,session?.code,participantId])

  useEffect(()=>{ setChoiceInput(null); setTextInput('') },[session?.currentSlideIndex])
  const currentAudienceSlide=session?session.slides[session.currentSlideIndex]:null

  // ── actions ───────────────────────────────────────────────────────────────
  // Tracks the in-flight current_slide_index write so startPresenting can
  // wait for it before doing its own reset-to-0 — otherwise a goToSlide
  // call from a just-ended presentation (e.g. navigated to slide 2, then
  // immediately ended + re-presented) can land AFTER the fresh reset and
  // silently overwrite it back to a stale non-zero value.
  const goToSlideInFlight = useRef<PromiseLike<unknown> | null>(null)
  const goToSlide=async(newIdx: number)=>{
    if (!session||newIdx<0||newIdx>=session.slides.length) return
    setSlideIndex(newIdx); setSession(p=>p && ({...p,currentSlideIndex:newIdx}))
    const p=supabase.from('sessions').update({current_slide_index:newIdx}).eq('code',session.code)
    goToSlideInFlight.current=p
    await p
    if (goToSlideInFlight.current===p) goToSlideInFlight.current=null
  }
  const copyCode=async()=>{
    if (!session) return
    try{await navigator.clipboard.writeText(session.code);setCopied(true);setTimeout(()=>setCopied(false),1500)}catch(_){}
  }
  const submitJoin=async(codeOverride?: string)=>{
    const code=(typeof codeOverride==='string'?codeOverride:joinCode).trim()
    setJoinError('')
    if (code.length<6){setJoinError("Enter the 6-digit code shown on the presenter's screen.");return}
    setJoinLoading(true)
    const{data:sd,error}=await supabase.from('sessions').select('*').eq('code',code).single()
    if (error||!sd){setJoinLoading(false);setAutoJoining(false);setJoinError("We couldn't find that presentation. Check the code and try again.");return}
    const{data:slides}=await supabase.from('slides').select('*').eq('session_code',code).order('position')
    setJoinLoading(false)
    setSession({code:sd.code,title:sd.title,currentSlideIndex:sd.current_slide_index,
      qnaEnabled:sd.qna_enabled,qnaModeration:sd.qna_moderation,pinHash:sd.pin_hash,isLive:sd.is_live!==false,
      hasPresented:sd.has_presented===true,
      slides:(slides||[]).map(mapSlide)})
    setVotedSlides({});setChoiceInput(null);setTextInput('');setQnaList([])
    setScreen('vote')
  }

  // ── deep link: ?code=123456 joins directly, skipping manual code entry ────
  useEffect(() => {
    const code=new URLSearchParams(window.location.search).get('code')
    if (code && /^\d{6}$/.test(code)) { setJoinCode(code); setAutoJoining(true); setScreen('join'); submitJoin(code) }
  }, [])
  const submitResponse=async()=>{
    if (!session||!currentAudienceSlide) return
    const slide=currentAudienceSlide
    let value: string | number | null = null
    if (slide.type==='choice'){if(choiceInput===null)return;value=choiceInput}
    else{if(!textInput.trim())return;value=textInput.trim().slice(0,140)}
    setSubmitting(true)
    await supabase.from('responses').insert({session_code:session.code,slide_id:slide.id,value})
    setSubmitting(false);setVotedSlides(v=>({...v,[slide.id]:true}))
  }
  const submitQuestion=async()=>{
    if (!session||!qnaDraft.trim()) return
    setQnaSubmitting(true)
    await supabase.from('questions').insert({id:uid('q'),session_code:session.code,
      text:qnaDraft.trim().slice(0,200),votes:0,voter_ids:[],
      status:session.qnaModeration?'pending':'visible',author_id:participantId,answered:false})
    setQnaDraft('');setQnaSubmitting(false)
  }
  const moderateQuestion=async(qId: string, action: ModerateAction)=>{
    if (!session) return
    if (action==='delete'||action==='reject'){
      setQnaList(list=>list.filter(q=>q.id!==qId))
      const{error}=await supabase.from('questions').delete().eq('id',qId)
      if (error){console.error(error);fetchQna(session.code)}
    } else if (action==='approve'){
      setQnaList(list=>list.map(q=>q.id===qId?{...q,status:'visible'}:q))
      const{error}=await supabase.from('questions').update({status:'visible'}).eq('id',qId)
      if (error){console.error(error);fetchQna(session.code)}
    } else if (action==='answered'){
      const q=qnaList.find(q=>q.id===qId)
      if(!q) return
      setQnaList(list=>list.map(x=>x.id===qId?{...x,answered:!x.answered}:x))
      const{error}=await supabase.from('questions').update({answered:!q.answered}).eq('id',qId)
      if (error){console.error(error);fetchQna(session.code)}
    }
  }
  const toggleModeration=async()=>{
    if (!session) return
    const newMod=!session.qnaModeration
    setSession(p=>p && ({...p,qnaModeration:newMod}))
    await supabase.from('sessions').update({qna_moderation:newMod}).eq('code',session.code)
  }
  const resetAll=()=>{
    setScreen('home');setSession(null);setSlideIndex(0);setResponses({})
    setJoinCode('');setJoinError('');setVotedSlides({});setQnaList([])
    setQnaDraft('')
    setIsModerator(false)
    clearPulseUrl()
  }

  // ── end presentation: flip is_live so connected audience clients are notified,
  // then return the presenter to the Builder for this Pulse (not all the way home) ─
  const endPresentation=async()=>{
    const code=session?.code
    if (session) {
      // Wait for any in-flight goToSlide write first, so it can't land
      // after (and overwrite) this reset — see goToSlide's own comment.
      if (goToSlideInFlight.current) await goToSlideInFlight.current
      const {error}=await supabase.from('sessions')
        .update({is_live:false, current_slide_index:0}).eq('code',session.code)
      if (error) console.error(error)
    }
    setSession(null); setSlideIndex(0); setResponses({}); setQnaList([])
    setIsModerator(false); setAudienceCount(0)
    if (code) await resumePulse(code)
    else resetAll()
  }

  // ── deep link: ?pulse=<code>&mode=build|present reopens that Pulse on reload
  const pulseDeepLinkHandled=useRef(false)
  useEffect(() => {
    if (loadingAuth||!user||pulseDeepLinkHandled.current) return
    pulseDeepLinkHandled.current=true
    const params=new URLSearchParams(window.location.search)
    const pulse=params.get('pulse'), mode=params.get('mode')
    if (!pulse) return
    if (mode==='present') resumePresenting(pulse)
    else if (mode==='build') resumePulse(pulse)
  }, [loadingAuth, user])

  return (
    <div style={{height:'100vh',width:'100%',overflow:'hidden',background:C.pageBg,color:C.txt1,fontFamily:FONT_BODY,display:'flex',flexDirection:'column'}}>
      <style>{`
        @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.75)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(.92)}60%{transform:scale(1.04)}100%{transform:scale(1)}}
        *{box-sizing:border-box}
        input,textarea,select,button{font-family:${FONT_BODY}}
        ::selection{background:#7C3AED;color:#fff}
        input::placeholder,textarea::placeholder{color:${C.txt4}}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-thumb{background:rgba(110,60,200,0.2);border-radius:3px}
      `}</style>
      {loadingAuth
        ? <EmptyState text="Loading…"/>
        : (['home','build','present'] as Screen[]).includes(screen) && !user
          ? <Login mode={loginMode} setMode={setLoginMode} email={loginEmail} setEmail={setLoginEmail}
              password={loginPassword} setPassword={setLoginPassword}
              loading={loginLoading} error={loginError} onSubmit={submitLogin}/>
          : <>
              {screen==='home'    && <Home pulses={pulses} pulsesLoading={pulsesLoading} userEmail={user?.email}
                onCreateNew={createNewPulse} onJoin={()=>setScreen('join')} onResume={resumePulse}
                onDeletePulse={deletePulse} onRenamePulse={renamePulse} onLogout={logout}/>}
              {screen==='build'   && <Builder draft={draft} setDraft={setDraft} updateSlide={updateSlide}
                changeSlideType={changeSlideType}
                addSlide={addSlide} removeSlide={removeSlide} reorderSlide={reorderSlide} addOption={addOption}
                removeOption={removeOption} updateOption={updateOption}
                applyResponseModeToAll={applyResponseModeToAll}
                onBack={resetAll} onPresent={startPresenting}/>}
              {screen==='present' && session && <Presenter session={session} slideIndex={slideIndex}
                responses={responses} goToSlide={goToSlide} copyCode={copyCode} copied={copied}
                onExit={endPresentation} qnaList={qnaList}
                onModerate={moderateQuestion} onToggleModeration={toggleModeration} audienceCount={audienceCount}/>}
            </>
      }
      {screen==='join'    && (autoJoining
        ? <EmptyState text="Joining…"/>
        : <Join joinCode={joinCode} setJoinCode={setJoinCode} joinError={joinError}
            joinLoading={joinLoading} onSubmit={submitJoin} onBack={resetAll}/>)}
      {screen==='vote'    && session && currentAudienceSlide && <Vote session={session}
        slide={currentAudienceSlide} voted={!!votedSlides[currentAudienceSlide.id]}
        choiceInput={choiceInput} setChoiceInput={setChoiceInput}
        textInput={textInput} setTextInput={setTextInput} submitting={submitting}
        onSubmit={submitResponse} onLeave={resetAll}
        qnaList={qnaList} participantId={participantId} qnaDraft={qnaDraft} setQnaDraft={setQnaDraft}
        qnaSubmitting={qnaSubmitting} onSubmitQuestion={submitQuestion}/>}
    </div>
  )
}
