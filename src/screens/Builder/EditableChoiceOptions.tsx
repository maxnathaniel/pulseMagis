import { EditableBarOptions } from './EditableBarOptions.tsx'
import { EditableDonutOptions } from './EditableDonutOptions.tsx'
import { EditablePieOptions } from './EditablePieOptions.tsx'
import { EditableDotsOptions } from './EditableDotsOptions.tsx'
import type { ResultsFormat } from '../../types.ts'

interface EditableChoiceOptionsProps {
  slide: { options: string[]; resultsFormat?: ResultsFormat }
  list: (string | number)[]
  readOnly?: boolean
  onUpdateOption?: (oi: number, val: string) => void
  onRemoveOption?: (oi: number) => void
  onAddOption?: () => void
}

export function EditableChoiceOptions({slide,list,readOnly,onUpdateOption,onRemoveOption,onAddOption}: EditableChoiceOptionsProps){
  const props={slide,list,readOnly,onUpdateOption,onRemoveOption,onAddOption}
  const format=slide.resultsFormat||'bar'
  if (format==='donut') return <EditableDonutOptions {...props}/>
  if (format==='pie')   return <EditablePieOptions {...props}/>
  if (format==='dots')  return <EditableDotsOptions {...props}/>
  return <EditableBarOptions {...props}/>
}
