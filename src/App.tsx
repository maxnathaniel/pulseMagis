import { useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import type { JSONContent } from '@tiptap/core'
import { supabase } from './lib/supabase.ts'
import { C, FONT_BODY, useFonts, EMPTY_RICH_DOC } from './theme.ts'
import { uid, genCode, hashPin, mapSlide, mapSlideForBuilder, toBuilderSlide, mapQuestion } from './lib/helpers.ts'
import { Home } from './screens/Home/Home.tsx'
import { Login } from './screens/Login/Login.tsx'
import { Builder } from './screens/Builder/Builder.tsx'
import { Presenter } from './screens/Presenter/Presenter.tsx'
import { Join } from './screens/Join/Join.tsx'
import { Vote } from './screens/Vote/Vote.tsx'
import { Moderate } from './screens/Moderate/Moderate.tsx'
import { EmptyState } from './components/ui/EmptyState.tsx'
import type { Draft, Session, Slide, SlideType, SlidePatch, Question, PulseSummary, ResponsesBySlide, ModerateAction, ResultsFormat } from './types.ts'

type Screen = 'home' | 'build' | 'present' | 'join' | 'vote' | 'moderate'

// ════════════════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  useFonts()

  // ── builder ──────────────────────────────────────────────────────────────
  const createSlide = (type: SlideType): Slide => {
    if (type === 'choice') {
      return { id: uid(), type, question: '', options: ['', '', '', ''], optionImages: [null, null, null, null],
        layout: 'right', contentImage: null, contentImageOriginal: null, responseMode: 'instant' }
    }
    if (type === 'plain') {
      return { id: uid(), type, question: '', layout: 'right', contentImage: null, contentImageOriginal: null, responseMode: 'instant',
        content: EMPTY_RICH_DOC, verticalAlign: 'middle' }
    }
    return { id: uid(), type, question: '', layout: 'right', contentImage: null, contentImageOriginal: null, responseMode: 'instant' }
  }

  const [screen, setScreen]         = useState<Screen>('home')
  const [draft, setDraft]           = useState<Draft>({
    title: 'Untitled presentation', qnaModeration: true, moderatorPin: '', pinHash: null,
    slides: [createSlide('choice')],
  })
  const [builderActiveId, setBuilderActiveId] = useState<string | undefined>(undefined)
  const [startingPresent, setStartingPresent]=useState(false)
  const [endingPresentation, setEndingPresentation]=useState(false)
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
  const [participantId]             = useState(() => {
    try {
      const stored = localStorage.getItem('pulsemagis_participant_id')
      if (stored) return stored
      const id = uid('p')
      localStorage.setItem('pulsemagis_participant_id', id)
      return id
    } catch {
      return uid('p')
    }
  })
  const [qnaList,     setQnaList]   = useState<Question[]>([])
  const [qnaDraft,    setQnaDraft]  = useState('')
  const [qnaSubmitting,setQnaSubmitting]=useState(false)
  const [, setIsModerator]=useState(false)
  const [audienceCount,setAudienceCount]=useState(0)

  // ── auth ─────────────────────────────────────────────────────────────────
  const [user,         setUser]         = useState<User | null>(null)
  const [loadingAuth,  setLoadingAuth]  = useState(true)
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

  const signInWithGoogle = async () => {
    setLoginError('')
    setLoginLoading(true)
    const {error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    setLoginLoading(false)
    if (error) setLoginError(error.message)
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
    let responsesByCode: Record<string, (string | number)[]> = {}
    if (codes.length) {
      const {data:slideRows,error:slideError}=await supabase.from('slides')
        .select('id,session_code,type,question,options,content_image,layout,content,vertical_align,results_format').in('session_code',codes).eq('position',0)
        .returns<{id:string; session_code:string; type:SlideType; question:string; options:string[] | null; content_image:string | null; layout:'left'|'right'; content:JSONContent | null; vertical_align:'top'|'middle'|'bottom'; results_format:ResultsFormat}[]>()
      if (slideError) console.error(slideError)
      firstSlideByCode=Object.fromEntries((slideRows||[]).map(s=>[s.session_code, {
        type:s.type, question:s.question, options:s.options,
        contentImage:s.content_image, layout:s.layout,
        content:s.content, verticalAlign:s.vertical_align, resultsFormat:s.results_format,
      }]))
      const slideIdToCode=Object.fromEntries((slideRows||[]).map(s=>[s.id,s.session_code]))
      const slideIds=(slideRows||[]).map(s=>s.id)
      if (slideIds.length) {
        const {data:responseRows,error:responseError}=await supabase.from('responses')
          .select('slide_id,value').in('slide_id',slideIds)
          .returns<{slide_id:string; value:string|number}[]>()
        if (responseError) console.error(responseError)
        ;(responseRows||[]).forEach(r => {
          const code=slideIdToCode[r.slide_id]
          if (code) (responsesByCode[code]=responsesByCode[code]||[]).push(r.value)
        })
      }
    }
    setPulses((data||[]).map(p=>({...p, firstSlide:firstSlideByCode[p.code]||null, firstSlideResponses:responsesByCode[p.code]||[]})))
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
      const shared={question:s.question, layout:s.layout, contentImage:s.contentImage,
        contentImageOriginal:s.contentImageOriginal, responseMode:s.responseMode}
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
    setStartingPresent(true)
    // startPresenting reconciles slides below (upsert + delete-only-removed,
    // same pattern as persistDraft). Suppress the autosave "flush on leave"
    // effect (fired by the screen change to 'present' at the end of this
    // function) so it doesn't fire a redundant/racy upsert of its own, AND
    // wait for any already-in-flight autosave (debounce timer that fired, or
    // a previous flush) to fully finish — clearTimeout can't stop a call that
    // already started, and an interleaved write here is what was corrupting
    // slide `position` ordering (presenter's own view stayed correct since
    // it's built from local state, but audience joins re-fetch from the DB,
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

    // pin_hash is one-way (SHA-256) — a blank PIN field on resume does not
    // mean "remove the PIN", so preserve whatever's already stored, which
    // draft.pinHash already carries (populated wherever a Draft is built —
    // no need to round-trip to the DB to read back a value we're not
    // changing).
    const pinHash: string | null = draft.moderatorPin.trim()
      ? await hashPin(draft.moderatorPin.trim())
      : (isUpdate ? draft.pinHash : null)

    // Upsert (not delete-then-insert): preserves existing slide rows in
    // place so responses/questions tied to still-present slides survive a
    // re-present — re-presenting the same Pulse is meant to resume it, not
    // silently reset every vote to zero (there's already a dedicated "Reset
    // results" button in the Results tab for anyone who explicitly wants
    // that). Only slides actually removed from the deck get deleted below,
    // which correctly cascades away just that slide's own responses. Upsert
    // also can't hit a duplicate-key error the way a blind insert could if a
    // previous attempt's slides were never fully cleaned up.
    const slideRows=draft.slides.map((s,idx) => ({
      id:s.id, session_code:code, type:s.type, question:s.question,
      options:s.type==='choice'?s.options.filter(o=>o.trim()):null,
      option_images:s.type==='choice'?(s.optionImages||null):null, position:idx,
      layout:s.layout||'right', content_image:s.contentImage||null, content_image_original:s.contentImageOriginal||null, response_mode:s.responseMode||'instant',
      content:s.type==='plain'?(s.content||null):null, vertical_align:s.type==='plain'?(s.verticalAlign||'middle'):'middle',
      results_format:s.type==='choice'?(s.resultsFormat||'bar'):'bar',
    }))

    if (isUpdate) {
      // The session row already exists, so the update, the slides upsert,
      // and the existing-slide-ids lookup (for the removed-slides diff
      // below) have no dependency on each other — run them concurrently
      // instead of as a sequential chain of round trips.
      const [sessRes, slidesRes, existingRes] = await Promise.all([
        supabase.from('sessions').update({
          title, current_slide_index:startIndex, qna_enabled:qnaEnabled,
          qna_moderation:draft.qnaModeration, pin_hash:pinHash, is_live:true, has_presented:true,
        }).eq('code',code),
        supabase.from('slides').upsert(slideRows),
        supabase.from('slides').select('id').eq('session_code',code),
      ])
      if (sessRes.error) {
        console.error(sessRes.error)
        window.alert(`Couldn't start presenting — the session failed to update (${sessRes.error.message}). Your Pulse has NOT started; please fix the issue and try again before making further changes.`)
        setStartingPresent(false)
        return
      }
      if (slidesRes.error) {
        console.error(slidesRes.error)
        window.alert(`Couldn't start presenting — the slides failed to save (${slidesRes.error.message}). Your Pulse has NOT started; please fix the issue and try again before making further changes.`)
        setStartingPresent(false)
        return
      }
      const currentIds=draft.slides.map(s=>s.id)
      const removedIds=(existingRes.data||[]).map(r=>r.id).filter(id=>!currentIds.includes(id))
      if (removedIds.length) {
        const {error:deleteError}=await supabase.from('slides').delete().in('id',removedIds)
        if (deleteError) console.error(deleteError)
      }
    } else {
      // A brand-new session row must exist before slides can reference it
      // (slides.session_code has a FK to sessions(code)), so this path stays
      // sequential.
      const {error:sessInsertError}=await supabase.from('sessions').insert({
        code, title, owner_id:user!.id, current_slide_index:startIndex, qna_enabled:qnaEnabled,
        qna_moderation:draft.qnaModeration, pin_hash:pinHash, is_live:true, has_presented:true,
      })
      if (sessInsertError) {
        console.error(sessInsertError)
        window.alert(`Couldn't start presenting — the session failed to save (${sessInsertError.message}).`)
        setStartingPresent(false)
        return
      }
      const {error:slidesUpsertError}=await supabase.from('slides').upsert(slideRows)
      if (slidesUpsertError) {
        console.error(slidesUpsertError)
        window.alert(`Couldn't start presenting — the slides failed to save (${slidesUpsertError.message}). Your Pulse has NOT started; please fix the issue and try again before making further changes.`)
        setStartingPresent(false)
        return
      }
    }
    setSession({ code, title,
      slides:draft.slides.map(s=>s.type==='choice' ? {...s,options:s.options.filter(o=>o.trim())} : s),
      currentSlideIndex:startIndex, qnaEnabled,
      qnaModeration:draft.qnaModeration, pinHash, isLive:true, hasPresented:true })
    setSlideIndex(startIndex); setResponses({}); setQnaList([])
    setIsModerator(true); setScreen('present')
    setPulseUrl(code, 'present')
    setStartingPresent(false)
  }

  // ── build a Builder Draft directly from an in-memory Session ────────────
  // Used by endPresentation instead of resumePulse's DB re-fetch: nothing
  // can have changed `sessions`/`slides` server-side while presenting (slide
  // edits are a Builder-only action, and the only session field changes
  // during a presentation are ones the app itself just wrote), so the
  // in-memory session is already a faithful mirror of what a re-fetch would
  // return.
  const sessionToDraft = (s: Session): Draft => ({
    code: s.code, title: s.title, qnaModeration: s.qnaModeration,
    moderatorPin: '', pinHash: s.pinHash,
    slides: s.slides.map(toBuilderSlide),
  })

  // ── resume an existing Pulse into the Builder ───────────────────────────
  // activeId lets a caller (e.g. endPresentation) land the Builder back on a
  // specific slide instead of always defaulting to the first one.
  const resumePulse = async (code: string, activeId?: string) => {
    const [{data:sd,error}, {data:slideRows}] = await Promise.all([
      supabase.from('sessions').select('*').eq('code',code).single(),
      supabase.from('slides').select('*').eq('session_code',code).order('position'),
    ])
    if (error||!sd) { console.error(error); return }
    setDraft({
      code:sd.code, title:sd.title, qnaModeration:sd.qna_moderation, moderatorPin:'', pinHash:sd.pin_hash,
      slides:(slideRows||[]).map(mapSlideForBuilder),
    })
    setBuilderActiveId(activeId)
    setScreen('build')
    setPulseUrl(code, 'build')
  }

  // ── resume presenting an existing Pulse directly (e.g. after a reload) ──
  const resumePresenting = async (code: string) => {
    const [{data:sd,error}, {data:slideRows}] = await Promise.all([
      supabase.from('sessions').select('*').eq('code',code).single(),
      supabase.from('slides').select('*').eq('session_code',code).order('position'),
    ])
    if (error||!sd) { console.error(error); return }
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
    setDraft({code, title:'Untitled presentation', qnaModeration:true, moderatorPin:'', pinHash:null, slides:[createSlide('choice')]})
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
    // pin_hash is one-way, so a blank PIN field means "preserve the existing
    // hash", which d.pinHash already carries — no need to read it back from
    // the DB. When a PIN *is* set, write the freshly computed hash back into
    // draft state too, so a later autosave (within the same Builder session)
    // that clears the PIN field falls back to this latest hash rather than a
    // stale one captured when the Builder first opened.
    let pinHash: string | null
    if (d.moderatorPin.trim()) {
      pinHash=await hashPin(d.moderatorPin.trim())
      setDraft(cur => cur.pinHash===pinHash ? cur : {...cur, pinHash})
    } else {
      pinHash=d.pinHash
    }

    const slideRows=d.slides.map((s,idx) => ({
      id:s.id, session_code:code, type:s.type, question:s.question,
      options:s.type==='choice'?s.options.filter(o=>o.trim()):null,
      option_images:s.type==='choice'?(s.optionImages||null):null, position:idx,
      layout:s.layout||'right', content_image:s.contentImage||null, content_image_original:s.contentImageOriginal||null, response_mode:s.responseMode||'instant',
      content:s.type==='plain'?(s.content||null):null, vertical_align:s.type==='plain'?(s.verticalAlign||'middle'):'middle',
      results_format:s.type==='choice'?(s.resultsFormat||'bar'):'bar',
    }))

    // The session row already exists here (guarded by `!d.code` above), so
    // these three calls have no dependency on each other and can run
    // concurrently instead of as a sequential chain.
    const [sessionRes, upsertRes, existingRes] = await Promise.all([
      supabase.from('sessions').update({
        title, qna_enabled:draftQnaEnabled, qna_moderation:d.qnaModeration, pin_hash:pinHash,
      }).eq('code',code),
      supabase.from('slides').upsert(slideRows),
      supabase.from('slides').select('id').eq('session_code',code),
    ])
    if (sessionRes.error) console.error(sessionRes.error)
    if (upsertRes.error) console.error(upsertRes.error)

    const currentIds=d.slides.map(s=>s.id)
    const removedIds=(existingRes.data||[]).map(r=>r.id).filter(id=>!currentIds.includes(id))
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
    if (!['present','vote','moderate'].includes(screen)||!session) return
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
    if (!['vote','moderate'].includes(screen)||!session) return
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
    if (!['vote','moderate'].includes(screen)||!session) return
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
  const submitJoin=async(codeOverride?: string, role?: 'moderator')=>{
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
    setScreen(role==='moderator'?'moderate':'vote')
  }

  // ── deep link: ?joinCode=123456 joins directly, skipping manual code entry ──
  // Deliberately not named `code` — Supabase's OAuth client (detectSessionInUrl)
  // scans the URL for a `code` query param on every load to detect an OAuth
  // callback, so a QR/link scan carrying `?code=123456` would get misread as a
  // bogus auth code instead of reaching this handler. `role=moderator` routes
  // straight to the moderator PIN-gate instead of the ordinary audience view.
  useEffect(() => {
    const params=new URLSearchParams(window.location.search)
    const code=params.get('joinCode')
    const role=params.get('role')==='moderator'?'moderator':undefined
    if (code && /^\d{6}$/.test(code)) {
      // Screen stays 'join' during the fetch (shows the "Joining…" loading
      // state, and — on failure — the ordinary Join form with the error
      // message) regardless of role; submitJoin itself picks the final
      // 'moderate' vs 'vote' destination once the session is confirmed to exist.
      setJoinCode(code); setAutoJoining(true); setScreen('join'); submitJoin(code, role)
    }
  }, [])
  const submitResponse=async()=>{
    if (!session||!currentAudienceSlide) return
    const slide=currentAudienceSlide
    let value: string | number | null = null
    if (slide.type==='choice'){if(choiceInput===null)return;value=choiceInput}
    else{if(!textInput.trim())return;value=textInput.trim().slice(0,140)}
    setSubmitting(true)
    await supabase.from('responses')
      .upsert({session_code:session.code,slide_id:slide.id,value,participant_id:participantId},
              {onConflict:'slide_id,participant_id',ignoreDuplicates:true})
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
    setEndingPresentation(true)
    const code=session?.code
    // Captured before session is wiped below, so the Builder can reopen on
    // whichever slide was on screen when presenting ended, not always slide 1.
    const activeId=session?.slides[slideIndex]?.id
    // Built from the in-memory session before it's wiped below, so exiting
    // doesn't need to re-fetch sessions+slides from the DB (see
    // sessionToDraft's comment) — this is what makes exiting fast.
    const nextDraft=session ? sessionToDraft(session) : null
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
    if (nextDraft) {
      setDraft(nextDraft)
      setBuilderActiveId(activeId)
      setScreen('build')
      setPulseUrl(code!, 'build')
    } else {
      resetAll()
    }
    setEndingPresentation(false)
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
        @keyframes dotPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
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
          ? <Login loading={loginLoading} error={loginError} onSubmit={signInWithGoogle}/>
          : <>
              {screen==='home'    && <Home pulses={pulses} pulsesLoading={pulsesLoading} userEmail={user?.email}
                onCreateNew={createNewPulse} onJoin={()=>setScreen('join')} onResume={resumePulse}
                onDeletePulse={deletePulse} onRenamePulse={renamePulse} onLogout={logout}/>}
              {screen==='build'   && <Builder draft={draft} initialActiveId={builderActiveId} setDraft={setDraft} updateSlide={updateSlide}
                changeSlideType={changeSlideType}
                addSlide={addSlide} removeSlide={removeSlide} reorderSlide={reorderSlide} addOption={addOption}
                removeOption={removeOption} updateOption={updateOption}
                applyResponseModeToAll={applyResponseModeToAll}
                onBack={resetAll} onPresent={startPresenting} presentLoading={startingPresent}/>}
              {screen==='present' && session && <Presenter session={session} slideIndex={slideIndex}
                responses={responses} goToSlide={goToSlide} copyCode={copyCode} copied={copied}
                onExit={endPresentation} exiting={endingPresentation} qnaList={qnaList}
                onModerate={moderateQuestion} audienceCount={audienceCount}/>}
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
      {screen==='moderate' && session && <Moderate session={session} qnaList={qnaList}
        onModerate={moderateQuestion} onToggleModeration={toggleModeration} onLeave={resetAll}/>}
    </div>
  )
}
