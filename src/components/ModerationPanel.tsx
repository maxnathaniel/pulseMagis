import { ShieldCheck, Lock, Check, X, ThumbsUp, Trash2 } from 'lucide-react'
import { C } from '../theme.ts'
import { RoundBtn } from './ui/RoundBtn.tsx'
import { SectionLabel } from './ui/SectionLabel.tsx'
import { EmptyState } from './ui/EmptyState.tsx'
import type { Session, Question, ModerateAction } from '../types.ts'

interface ModerationPanelProps {
  session: Session
  qnaList: Question[]
  onModerate: (qId: string, action: ModerateAction) => void
  onToggleModeration: () => void
}

export function ModerationPanel({session,qnaList,onModerate,onToggleModeration}: ModerationPanelProps){
  const pending=qnaList.filter(q=>q.status==='pending').sort((a,b)=>a.createdAt-b.createdAt)
  const visible=qnaList.filter(q=>q.status==='visible').sort((a,b)=>a.answered===b.answered?b.votes-a.votes:a.answered?1:-1)
  return(
    <div style={{flex:1,overflowY:'auto',padding:'18px 2px 10px',display:'flex',flexDirection:'column',gap:22}}>
      <div onClick={onToggleModeration}
        style={{display:'flex',alignItems:'center',gap:8,alignSelf:'flex-start',padding:'8px 14px',borderRadius:999,
          border:`1.5px solid ${C.border}`,background:session.qnaModeration?C.tealBg:C.surfaceAlt,
          color:session.qnaModeration?C.teal:C.txt3,fontSize:13,fontWeight:700,cursor:'pointer'}}>
        {session.qnaModeration?<ShieldCheck size={14}/>:<Lock size={14}/>}
        {session.qnaModeration?'Moderation on — new questions need approval':'Moderation off — questions post instantly'}
      </div>
      {session.qnaModeration&&(
        <div>
          <SectionLabel>Needs review {pending.length?`(${pending.length})`:''}</SectionLabel>
          {pending.length===0?<EmptyState text="No questions waiting for review."/>:(
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
              {pending.map(q=>(
                <div key={q.id} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:4,padding:'12px 14px',display:'flex',alignItems:'center',gap:12,animation:'fadeUp .3s ease',boxShadow:C.shadow}}>
                  <div style={{flex:1,fontSize:14,fontWeight:700,color:C.txt1}}>{q.text}</div>
                  <RoundBtn onClick={()=>onModerate(q.id,'approve')} color={C.teal} title="Approve"><Check size={14}/></RoundBtn>
                  <RoundBtn onClick={()=>onModerate(q.id,'reject')}  color={C.red}  title="Reject"><X size={14}/></RoundBtn>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div>
        <SectionLabel>Questions {visible.length?`(${visible.length})`:''}</SectionLabel>
        {visible.length===0?<EmptyState text="Approved questions will appear here, ranked by votes."/>:(
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
            {visible.map(q=>(
              <div key={q.id} style={{background:C.surface,border:`1.5px solid ${q.answered?C.borderLight:C.border}`,borderRadius:4,padding:'12px 14px',display:'flex',alignItems:'center',gap:12,opacity:q.answered?.5:1,boxShadow:C.shadow}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',color:C.amber,fontSize:12,fontWeight:800,minWidth:28}}>
                  <ThumbsUp size={13}/>{q.votes}
                </div>
                <div style={{flex:1,fontSize:14,fontWeight:700,color:C.txt1,textDecoration:q.answered?'line-through':'none'}}>{q.text}</div>
                <RoundBtn onClick={()=>onModerate(q.id,'answered')} color={q.answered?C.txt4:C.teal} title={q.answered?'Mark unanswered':'Mark answered'}><Check size={14}/></RoundBtn>
                <RoundBtn onClick={()=>onModerate(q.id,'delete')}   color={C.red} title="Delete"><Trash2 size={14}/></RoundBtn>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
