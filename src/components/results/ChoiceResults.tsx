import { BarResults } from './BarResults.tsx'
import { DonutResults } from './DonutResults.tsx'
import { PieResults } from './PieResults.tsx'
import { DotsResults } from './DotsResults.tsx'
import type { ChoiceSlide, ResultsFormat } from '../../types.ts'

interface ChoiceResultsProps {
  slide: ChoiceSlide
  list: (string | number)[]
  format?: ResultsFormat
}

export function ChoiceResults({slide,list,format='bar'}: ChoiceResultsProps){
  if (format==='donut') return <DonutResults slide={slide} list={list}/>
  if (format==='pie')   return <PieResults slide={slide} list={list}/>
  if (format==='dots')  return <DotsResults slide={slide} list={list}/>
  return <BarResults slide={slide} list={list}/>
}
