// Mock data for the prototype. This mirrors the shape the Spring Boot + MySQL
// backend will eventually return, so swapping fetch() in later is a drop-in.
//
//   User -> Goals -> Milestones -> Tasks
//
// `weight` (1-5) is how hard / how much effort a milestone is. Progress along
// the journey is weighted by it, so finishing a hard milestone moves you
// further down the path than an easy one — "doing hard things looks crazy."

export const DIFFICULTY = {
  easy:   { label: 'Easy',   color: '#34d399' },
  medium: { label: 'Medium', color: '#60a5fa' },
  hard:   { label: 'Hard',   color: '#fbbf24' },
  epic:   { label: 'Epic',   color: '#f472b6' },
}
