import { GestureController } from '../controller'
import { PointerPhase, type Pose } from '../types'

function createPose(): Pose {
  return {
    position: { x: 0, y: 0 },
    width: 100,
    height: 100,
    rotation: 0,
    scale: 1
  }
}

describe('GestureController', () => {
  it('produces deterministic drag snapshots', () => {
    const run = () => {
      const controller = new GestureController({ features: { drag: true } })
      controller.process(
        {
          pointerId: 1,
          phase: PointerPhase.Start,
          point: { x: 10, y: 10 },
          timestamp: 0
        },
        { pose: createPose() }
      )

      return controller.process(
        {
          pointerId: 1,
          phase: PointerPhase.Move,
          point: { x: 40, y: 25 },
          timestamp: 16
        },
        { pose: createPose() }
      )
    }

    expect(run()).toEqual(run())
  })

  it('supports two-pointer rotate and scale', () => {
    const controller = new GestureController({
      features: { rotate: true, scale: true }
    })

    controller.process(
      {
        pointerId: 1,
        phase: PointerPhase.Start,
        point: { x: 20, y: 50 },
        timestamp: 0
      },
      { pose: createPose(), anchorCenter: { x: 50, y: 50 } }
    )

    controller.process(
      {
        pointerId: 2,
        phase: PointerPhase.Start,
        point: { x: 80, y: 50 },
        timestamp: 1
      },
      { pose: createPose(), anchorCenter: { x: 50, y: 50 } }
    )

    const snapshot = controller.process(
      {
        pointerId: 1,
        phase: PointerPhase.Move,
        point: { x: 50, y: 20 },
        timestamp: 16
      },
      { pose: createPose(), anchorCenter: { x: 50, y: 50 } }
    )

    expect(snapshot.pose.rotation).not.toBe(0)
    expect(snapshot.pose.scale).not.toBe(1)
  })

  it('keeps the two-finger pose when one pointer lifts and continues from it', () => {
    const controller = new GestureController({ features: { drag: true } })
    const pose = createPose()

    controller.process(
      {
        pointerId: 1,
        phase: PointerPhase.Start,
        point: { x: 0, y: 0 },
        timestamp: 0
      },
      { pose }
    )

    controller.process(
      {
        pointerId: 1,
        phase: PointerPhase.Move,
        point: { x: 10, y: 0 },
        timestamp: 10
      },
      { pose }
    )

    controller.process(
      {
        pointerId: 2,
        phase: PointerPhase.Start,
        point: { x: 20, y: 0 },
        timestamp: 20
      },
      { pose: { ...pose, position: { x: 10, y: 0 } } }
    )

    controller.process(
      {
        pointerId: 1,
        phase: PointerPhase.Move,
        point: { x: 20, y: 0 },
        timestamp: 30
      },
      { pose: { ...pose, position: { x: 10, y: 0 } } }
    )

    const endSnapshot = controller.process(
      {
        pointerId: 2,
        phase: PointerPhase.End,
        point: { x: 20, y: 0 },
        timestamp: 40
      },
      { pose: { ...pose, position: { x: 15, y: 0 } } }
    )

    expect(endSnapshot.pose.position.x).toBe(15)

    const continueSnapshot = controller.process(
      {
        pointerId: 1,
        phase: PointerPhase.Move,
        point: { x: 30, y: 0 },
        timestamp: 50
      },
      { pose: { ...pose, position: { x: 15, y: 0 } } }
    )

    expect(continueSnapshot.pose.position.x).toBe(25)
  })
})
