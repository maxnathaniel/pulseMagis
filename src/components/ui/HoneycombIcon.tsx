// A small hex-packed dot cluster — one center dot ringed by six more — so
// the "dot matrix" results format is represented by the same honeycomb
// silhouette its chart (HoneycombDots.tsx) actually draws, rather than a
// generic grid-of-dots icon.
const CENTER: [number, number]=[12,12]
const RING_OFFSETS: [number, number][]=[
  [0,-8],[6.93,-4],[6.93,4],[0,8],[-6.93,4],[-6.93,-4],
]
const DOTS=[CENTER,...RING_OFFSETS.map(([dx,dy]):[number,number]=>[CENTER[0]+dx,CENTER[1]+dy])]

interface HoneycombIconProps {
  size?: number | string
  className?: string
}

export function HoneycombIcon({size=24,className}: HoneycombIconProps){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {DOTS.map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r={2.6} fill="currentColor"/>))}
    </svg>
  )
}
