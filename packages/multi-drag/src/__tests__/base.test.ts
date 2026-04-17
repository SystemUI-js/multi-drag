jest.mock('@system-ui-js/multi-drag-core', () => {
  const actual = jest.requireActual(
    '@system-ui-js/multi-drag-core'
  ) as typeof import('@system-ui-js/multi-drag-core')

  return {
    ...actual,
    createInertiaProjector: jest.fn()
  }
})

import * as multiDragCore from '@system-ui-js/multi-drag-core'
import { DragBase, DragOperationType } from '../drag/base'
import { createAnElement, mockMouseMove, mockTouchMove } from './utils'

describe('DragBase', () => {
  it('registers and removes listeners', () => {
    const element = createAnElement()
    const dragBase = new DragBase(element)
    const listener = jest.fn()
    dragBase.addEventListener(DragOperationType.Start, listener)
    dragBase.trigger(DragOperationType.Start, [])
    expect(listener).toHaveBeenCalledTimes(1)
    dragBase.removeEventListener(DragOperationType.Start, listener)
    dragBase.trigger(DragOperationType.Start, [])
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('respects enabled and passive mode', () => {
    const element = createAnElement()
    const dragBase = new DragBase(element)
    const listener = jest.fn()
    dragBase.addEventListener(DragOperationType.Move, listener)
    dragBase.setPassive(true)
    mockMouseMove(element, { x: 0, y: 0 }, { x: 10, y: 10 })
    expect(listener).toHaveBeenCalledTimes(0)
    dragBase.setPassive(false)
    dragBase.setDisabled()
    mockMouseMove(element, { x: 0, y: 0 }, { x: 10, y: 10 })
    expect(listener).toHaveBeenCalledTimes(0)
  })

  it('cleans fingers after end', () => {
    const element = createAnElement()
    const dragBase = new DragBase(element, { maxFingerCount: 2 })
    mockTouchMove(element, { x: 0, y: 0 }, { x: 20, y: 20 }, 2)
    expect(dragBase.getFingers().length).toBe(0)
  })

  it('emits inertial end when inertia finishes', () => {
    const element = createAnElement()
    const dragBase = new DragBase(element, { inertial: true })
    const inertialEndListener = jest.fn()
    dragBase.addEventListener(
      DragOperationType.InertialEnd,
      inertialEndListener
    )

    const rafCallbacks: FrameRequestCallback[] = []
    const requestAnimationFrameSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        rafCallbacks.push(callback)
        return rafCallbacks.length
      })
    const dateNowSpy = jest.spyOn(Date, 'now')
    let now = 1_000
    dateNowSpy.mockImplementation(() => now)

    const projectorMock =
      multiDragCore.createInertiaProjector as jest.MockedFunction<
        typeof multiDragCore.createInertiaProjector
      >
    projectorMock.mockReturnValue(((elapsedTime: number) => {
      if (elapsedTime < 16) {
        return {
          position: { x: 10, y: 10 },
          width: 100,
          height: 100
        }
      }

      return null
    }) as ReturnType<typeof multiDragCore.createInertiaProjector>)

    mockMouseMove(element, { x: 0, y: 0 }, { x: 10, y: 10 })

    expect(rafCallbacks).toHaveLength(1)
    now = 1_020
    rafCallbacks[0](16)

    expect(inertialEndListener).toHaveBeenCalledTimes(1)
    expect(dragBase.getCurrentOperationType()).toBe(
      DragOperationType.InertialEnd
    )

    projectorMock.mockReset()
    requestAnimationFrameSpy.mockRestore()
    dateNowSpy.mockRestore()
  })

  it('cancels inertial animation on destroy', () => {
    const element = createAnElement()
    const dragBase = new DragBase(element, { inertial: true })
    const inertialListener = jest.fn()
    dragBase.addEventListener(DragOperationType.Inertial, inertialListener)

    const rafCallbacks: FrameRequestCallback[] = []
    const requestAnimationFrameSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        rafCallbacks.push(callback)
        return rafCallbacks.length
      })
    const cancelAnimationFrameSpy = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {})
    const projectorMock =
      multiDragCore.createInertiaProjector as jest.MockedFunction<
        typeof multiDragCore.createInertiaProjector
      >
    projectorMock.mockReturnValue(((elapsedTime: number) => {
      if (elapsedTime < 16) {
        return {
          position: { x: 10, y: 10 },
          width: 100,
          height: 100
        }
      }

      return null
    }) as ReturnType<typeof multiDragCore.createInertiaProjector>)

    mockMouseMove(element, { x: 0, y: 0 }, { x: 10, y: 10 })
    expect(rafCallbacks).toHaveLength(1)
    expect(inertialListener).toHaveBeenCalledTimes(1)

    dragBase.destroy()
    expect(cancelAnimationFrameSpy).toHaveBeenCalledTimes(1)

    rafCallbacks[0](16)
    expect(inertialListener).toHaveBeenCalledTimes(1)

    projectorMock.mockReset()
    requestAnimationFrameSpy.mockRestore()
    cancelAnimationFrameSpy.mockRestore()
  })
})
