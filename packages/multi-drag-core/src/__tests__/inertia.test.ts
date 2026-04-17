import { createInertiaProjector } from '../inertia'
import { PoseRecord } from '../types'

const records: PoseRecord[] = [
  {
    pose: {
      position: { x: 0, y: 0 },
      width: 100,
      height: 100,
      rotation: 0,
      scale: 1
    },
    time: 0
  },
  {
    pose: {
      position: { x: 20, y: 0 },
      width: 100,
      height: 100,
      rotation: 10,
      scale: 1.2
    },
    time: 10
  }
]

describe('createInertiaProjector', () => {
  it('returns deterministic projections', () => {
    const projector = createInertiaProjector(records)
    expect(projector(10)).toEqual(projector(10))
  })
})
