const DOT_SIZE=16
const DOT_GAP=5
const HEX_RADIUS=4 // rings out from the center dot; 3*r*(r+1)+1 = 61 cells total

type Axial={q:number; r:number}

// One step in each of the 6 directions on a triangular (axial) lattice.
const AXIAL_DIRECTIONS: Axial[]=[
  {q:1,r:0},{q:1,r:-1},{q:0,r:-1},
  {q:-1,r:0},{q:-1,r:1},{q:0,r:1},
]

// Cells ordered ring-by-ring outward from the center, so filling the first
// N cells grows outward and the full set traces a hexagon silhouette —
// the same shape as a honeycomb cell, built out of individually packed dots.
function buildHexTemplate(radius:number):Axial[]{
  const cells:Axial[]=[{q:0,r:0}]
  for(let ring=1;ring<=radius;ring++){
    let cell={q:AXIAL_DIRECTIONS[4].q*ring,r:AXIAL_DIRECTIONS[4].r*ring}
    for(let side=0;side<6;side++){
      for(let step=0;step<ring;step++){
        cells.push(cell)
        cell={q:cell.q+AXIAL_DIRECTIONS[side].q,r:cell.r+AXIAL_DIRECTIONS[side].r}
      }
    }
  }
  return cells
}

const HEX_TEMPLATE=buildHexTemplate(HEX_RADIUS)
export const DOTS_MAX_PER_OPTION=HEX_TEMPLATE.length

const HEX_PIXELS=(()=>{
  const pitch=DOT_SIZE+DOT_GAP
  const rowHeight=pitch*0.8660254 // sqrt(3)/2, tight hex-packed row spacing
  const raw=HEX_TEMPLATE.map(({q,r})=>({x:pitch*(q+r/2),y:rowHeight*r}))
  const xs=raw.map(p=>p.x), ys=raw.map(p=>p.y)
  const minX=Math.min(...xs), minY=Math.min(...ys)
  return raw.map(p=>({x:p.x-minX,y:p.y-minY}))
})()
export const HEX_WIDTH=Math.max(...HEX_PIXELS.map(p=>p.x))+DOT_SIZE
export const HEX_HEIGHT=Math.max(...HEX_PIXELS.map(p=>p.y))+DOT_SIZE

interface HoneycombDotsProps {
  count: number
  color: string
}

// Renders `count` dots (clamped to DOTS_MAX_PER_OPTION) hex-packed outward
// from a center point, so the cluster traces a honeycomb hexagon silhouette
// as it grows. Only filled dots are drawn — no placeholders for empty cells.
export function HoneycombDots({count,color}: HoneycombDotsProps){
  const shown=Math.min(count,DOTS_MAX_PER_OPTION)
  return(
    <div style={{position:'relative',width:HEX_WIDTH,height:HEX_HEIGHT,flexShrink:0}}>
      {HEX_PIXELS.slice(0,shown).map((p,d)=>(
        <span key={d} style={{position:'absolute',left:p.x,top:p.y,width:DOT_SIZE,height:DOT_SIZE,
          borderRadius:'50%',background:color,animation:`dotPop .4s cubic-bezier(.22,1,.36,1) ${d*15}ms both`}}/>
      ))}
    </div>
  )
}
