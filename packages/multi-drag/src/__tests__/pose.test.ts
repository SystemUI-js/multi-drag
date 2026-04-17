import { defaultSetPose } from '../dom/pose'

describe('pose', () => {
  it('keeps content-box height stable with padding and border', () => {
    const element = document.createElement('div')
    element.style.boxSizing = 'content-box'
    element.style.paddingTop = '10px'
    element.style.paddingBottom = '10px'
    element.style.borderTopWidth = '2px'
    element.style.borderBottomWidth = '2px'

    defaultSetPose(element, { height: 100 })
    const firstHeight = element.style.height

    defaultSetPose(element, { height: 100 })

    expect(firstHeight).toBe('76px')
    expect(element.style.height).toBe('76px')
  })
})
