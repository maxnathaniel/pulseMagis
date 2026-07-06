import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { supabase } from '../../lib/supabase.ts'
import { C, FONT_DISPLAY, SLIDE_TYPES } from '../../theme.ts'
import { ChoiceResults } from '../../components/results/ChoiceResults.tsx'
import { WordCloudResults } from '../../components/results/WordCloudResults.tsx'
import { OpenResults } from '../../components/results/OpenResults.tsx'
import { EmptyState } from '../../components/ui/EmptyState.tsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx'
import type { Draft, ResponsesBySlide, QuestionStatus } from '../../types.ts'

const RESULT_TYPES = ['choice', 'wordcloud', 'open']

interface ResultQuestion {
  id: string
  text: string
  votes: number
  answered: boolean
  status: QuestionStatus
}

export function ResultsView({draft}: {draft: Draft}){
  const [responsesBySlide, setResponsesBySlide] = useState<ResponsesBySlide>({})
  const [questions, setQuestions] = useState<ResultQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [clearingQna, setClearingQna] = useState(false)
  const [confirmClearQna, setConfirmClearQna] = useState(false)

  const load = async () => {
    if (!draft.code) { setLoading(false); return }
    setLoading(true)
    const [{data:responseRows, error:respErr}, {data:questionRows, error:qErr}] = await Promise.all([
      supabase.from('responses').select('slide_id,value').eq('session_code', draft.code)
        .returns<{slide_id:string; value:string|number}[]>(),
      supabase.from('questions').select('id,text,votes,answered,status').eq('session_code', draft.code).order('created_at')
        .returns<ResultQuestion[]>(),
    ])
    if (respErr) console.error(respErr)
    if (qErr) console.error(qErr)
    const grouped: ResponsesBySlide = {}
    ;(responseRows||[]).forEach(r => { (grouped[r.slide_id] = grouped[r.slide_id]||[]).push(r.value) })
    setResponsesBySlide(grouped)
    setQuestions(questionRows||[])
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => { await load(); if (cancelled) return }
    run()
    return () => { cancelled = true }
  }, [draft.code])

  const resetResults = async () => {
    setConfirmReset(false)
    setResetting(true)
    const {error} = await supabase.from('responses').delete().eq('session_code', draft.code!)
    if (error) console.error(error)
    setResponsesBySlide({})
    setResetting(false)
  }

  const clearQuestions = async () => {
    setConfirmClearQna(false)
    setClearingQna(true)
    const {error} = await supabase.from('questions').delete().eq('session_code', draft.code!)
    if (error) console.error(error)
    setQuestions([])
    setClearingQna(false)
  }

  const relevantSlides = draft.slides.filter(s => RESULT_TYPES.includes(s.type))
  const hasQnaSlide = draft.slides.some(s => s.type==='qa')
  const totalResponses = Object.values(responsesBySlide).reduce((n, list) => n+list.length, 0)

  if (loading) return <div style={{flex:1,overflowY:'auto',padding:32}}><EmptyState text="Loading results…"/></div>
  if (!relevantSlides.length && !hasQnaSlide) return (
    <div style={{flex:1,overflowY:'auto',padding:32}}>
      <EmptyState text="Add a multiple choice, word cloud, open-ended, or Q&amp;A slide to see results here."/>
    </div>
  )

  return (
    <div style={{flex:1,overflowY:'auto',padding:'32px 40px'}}>
      <div style={{maxWidth:640,margin:'0 auto'}}>
        {relevantSlides.length>0&&(
          <>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
              <button onClick={()=>setConfirmReset(true)} disabled={resetting||!totalResponses}
                style={{display:'flex',alignItems:'center',gap:7,padding:'8px 14px',borderRadius:4,
                  border:`2px solid ${C.border}`,background:C.surface,
                  color:totalResponses?C.txt2:C.txtDis,fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:13,
                  cursor:totalResponses?'pointer':'not-allowed'}}>
                <RotateCcw size={14}/> {resetting?'Resetting…':'Reset results'}
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:36}}>
              {relevantSlides.map(slide => {
                const list = responsesBySlide[slide.id]||[]
                const typeMeta = SLIDE_TYPES.find(t => t.key===slide.type)
                return (
                  <div key={slide.id}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:11.5,color:C.txt4,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>
                        {typeMeta?.label}
                      </div>
                      <h3 style={{fontFamily:FONT_DISPLAY,fontSize:20,fontWeight:700,color:C.txt1,margin:'0 0 6px'}}>
                        {slide.question.trim()||'Untitled question'}
                      </h3>
                      <div style={{fontSize:12.5,color:C.txt3,fontWeight:600,marginBottom:16}}>
                        {list.length} response{list.length!==1?'s':''}
                      </div>
                    </div>
                    {slide.type==='choice'   && <ChoiceResults slide={slide} format={slide.resultsFormat} list={list}/>}
                    {slide.type==='wordcloud'&& <WordCloudResults list={list as string[]}/>}
                    {slide.type==='open'     && <OpenResults list={list}/>}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {hasQnaSlide&&(
          <div style={{marginTop:relevantSlides.length>0?44:0}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <div style={{fontSize:11.5,color:C.txt4,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Q&amp;A</div>
              <button onClick={()=>setConfirmClearQna(true)} disabled={clearingQna||!questions.length}
                style={{display:'flex',alignItems:'center',gap:7,padding:'8px 14px',borderRadius:4,
                  border:`2px solid ${C.border}`,background:C.surface,
                  color:questions.length?C.txt2:C.txtDis,fontFamily:FONT_DISPLAY,fontWeight:700,fontSize:13,
                  cursor:questions.length?'pointer':'not-allowed'}}>
                <RotateCcw size={14}/> {clearingQna?'Clearing…':'Clear questions'}
              </button>
            </div>
            <div style={{fontSize:12.5,color:C.txt3,fontWeight:600,marginBottom:16}}>
              {questions.length} question{questions.length!==1?'s':''}
            </div>
            {questions.length===0
              ? <EmptyState text="No questions submitted yet."/>
              : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {questions.map(q => (
                    <div key={q.id} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:4,
                      padding:'12px 14px',display:'flex',justifyContent:'space-between',gap:12,
                      opacity:q.answered?0.6:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:C.txt1,textDecoration:q.answered?'line-through':'none'}}>{q.text}</div>
                      <div style={{fontSize:12.5,color:C.txt3,fontWeight:700,flexShrink:0}}>{q.votes} vote{q.votes!==1?'s':''}</div>
                    </div>
                  ))}
                </div>}
          </div>
        )}
      </div>
      {confirmReset&&<ConfirmDialog
        title="Reset all results?"
        message="Every response collected so far for this Pulse will be permanently deleted. This can't be undone."
        confirmLabel="Reset" onConfirm={resetResults} onCancel={()=>setConfirmReset(false)}/>}
      {confirmClearQna&&<ConfirmDialog
        title="Clear all questions?"
        message="Every question submitted so far for this Pulse will be permanently deleted. This can't be undone."
        confirmLabel="Clear" onConfirm={clearQuestions} onCancel={()=>setConfirmClearQna(false)}/>}
    </div>
  )
}
