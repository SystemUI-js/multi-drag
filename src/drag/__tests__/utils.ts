import { Point } from "../../utils/mathUtils"

export function createAnElement() {
    const element = document.createElement('div')
    element.style.position = 'fixed'
    element.style.left = '0px'
    element.style.top = '0px'
    element.style.width = '100px'
    element.style.height = '100px'
    return element
}

export let touchCnt = 0

export function getTouchCnt() {
    return touchCnt++;
}

export function mockTouchMove(element: HTMLElement, initPoint: Point, movePoint: Point, fingerCnt: number) {
    const touchIds = Array.from({ length: fingerCnt }, () => getTouchCnt())
    const touchStart = touchIds.map((id, index) => {
        return () => {
            element.dispatchEvent(new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{
                    identifier: id,
                    force: 1,
                    pageX: initPoint.x + index * 10,
                    pageY: initPoint.y + index * 10,
                    radiusX: 1,
                    radiusY: 1,
                    rotationAngle: 0,
                    screenX: initPoint.x + index * 10,
                    screenY: initPoint.y + index * 10,
                    target: element,
                    clientX: initPoint.x + index * 10,
                    clientY: initPoint.y + index * 10,
                }],
            }))
        }
    })
    const touchMove = touchIds.map((id, index) => {
        return () => {
            document.dispatchEvent(new TouchEvent('touchmove', {
                bubbles: true,
                cancelable: true,
                touches: [{
                    identifier: id,
                    force: 1,
                    pageX: movePoint.x + index * 10,
                    pageY: movePoint.y + index * 10,
                    radiusX: 1,
                    radiusY: 1,
                    rotationAngle: 0,
                    screenX: movePoint.x + index * 10,
                    screenY: movePoint.y + index * 10,
                    target: document,
                    clientX: movePoint.x + index * 10,
                    clientY: movePoint.y + index * 10,
                }],
            }))
        }
    })
    const touchEnd = touchIds.map((id, index) => {
        return () => {
            document.dispatchEvent(new TouchEvent('touchend', {
                bubbles: true,
                cancelable: true,
                touches: [{
                    identifier: id,
                    force: 1,
                    pageX: movePoint.x + index * 10,
                    pageY: movePoint.y + index * 10,
                    radiusX: 1,
                    radiusY: 1,
                    rotationAngle: 0,
                    screenX: movePoint.x + index * 10,
                    screenY: movePoint.y + index * 10,
                    target: document,
                    clientX: movePoint.x + index * 10,
                    clientY: movePoint.y + index * 10,
                }],
            }))
        }
    })
    touchStart.forEach(fn => fn())
    touchMove.forEach(fn => fn())
    touchEnd.forEach(fn => fn())
}

export function mockMouseMove(element: HTMLElement, initPoint: Point, movePoint: Point) {
    element.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: initPoint.x,
        clientY: initPoint.y,
    }))
    document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: movePoint.x,
        clientY: movePoint.y,
    }))
    document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: movePoint.x,
        clientY: movePoint.y,
    }))
}
