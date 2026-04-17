import { Drag, defaultGetPose } from '../index'
import { createAnElement, mockMouseMove } from './utils'

describe('compatibility host pose hooks', () => {
  it('uses setPose and setPoseOnEnd hooks', () => {
    const element = createAnElement()
    const setPose = jest.fn()
    const setPoseOnEnd = jest.fn()

    new Drag(element, {
      getPose: defaultGetPose,
      setPose,
      setPoseOnEnd
    })

    mockMouseMove(element, { x: 0, y: 0 }, { x: 20, y: 20 })

    expect(setPose).toHaveBeenCalled()
    expect(setPoseOnEnd).toHaveBeenCalled()
  })
})
