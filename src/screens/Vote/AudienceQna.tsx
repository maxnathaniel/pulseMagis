import type { Dispatch, SetStateAction } from 'react'
import { C } from '../../theme.ts'
import { EmptyState } from '../../components/ui/EmptyState.tsx'
import type { Session, Question } from '../../types.ts'

interface AudienceQnaProps {
  session: Session | { title: string; qnaModeration: boolean }
  qnaList: Question[]
  participantId: string
  qnaDraft: string
  setQnaDraft: Dispatch<SetStateAction<string>>
  qnaSubmitting: boolean
  onSubmitQuestion: () => void
}

export function AudienceQna({qnaList,participantId,qnaDraft,setQnaDraft,qnaSubmitting,onSubmitQuestion}: AudienceQnaProps){
  const mine=qnaList.filter(q=>q.authorId===participantId)
    .sort((a,b)=>b.createdAt-a.createdAt)
  return(
    <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',maxWidth:480,margin:'0 auto',width:'100%',paddingTop:16}}>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <textarea rows={3} value={qnaDraft} onChange={e=>setQnaDraft(e.target.value.slice(0,200))}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); onSubmitQuestion() } }}
          placeholder="Ask a question…"
          style={{padding:'12px 14px',borderRadius:4,border:`2px solid ${C.border}`,background:C.surface,color:C.txt1,fontSize:14,fontWeight:500,fontFamily:'inherit',outline:'none',boxShadow:C.shadow,resize:'none'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,fontWeight:400,color:C.txt4}}>{qnaDraft.length}/200</span>
          <button onClick={onSubmitQuestion} disabled={qnaSubmitting||!qnaDraft.trim()}
            style={{padding:'0 20px',height:38,borderRadius:9999,border:'none',background:qnaDraft.trim()?C.amber:C.disabledBtn,color:qnaDraft.trim()?'#fff':C.txtDis,fontWeight:500,fontSize:14,cursor:qnaDraft.trim()?'pointer':'not-allowed'}}>
            Ask
          </button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
        {mine.length===0?<EmptyState text="Ask a question and it'll show up here."/>:(
          mine.map(q=>(
            <div key={q.id} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:4,padding:'12px 14px',opacity:q.answered?.5:1,animation:'fadeUp .3s ease',boxShadow:C.shadow}}>
              <div style={{fontSize:14,fontWeight:500,color:C.txt1,textDecoration:q.answered?'line-through':'none'}}>{q.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
