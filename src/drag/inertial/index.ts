import { GestureParams, keepTouchesRelative, KeepTouchesRelativeOptions } from '../dragMethods'
import type { Point } from '../../utils/mathUtils'

/**
 * 优化的惯性拖拽时间函数
 * 基于物理惯性运动原理，计算在给定百分比时刻的位置
 *
 * @param initialPosition 初始位置 {x: number, y: number}
 * @param velocity 初速度（单位 px/s），也是一个二维向量 {x: number, y: number}
 * @param friction 摩擦力系数（相当于减速度）
 * @returns 返回一个函数，该函数接收一个0-1之间的百分比参数，返回当前应该所在的位置
 */
export function getInertialDragTimingFunction(
    initialPosition: Point,
    velocity: Point,
    friction: number = 0.0009
) {
    // 计算惯性运动的总位移
    const totalDisplacementX = velocity.x / friction;
    const totalDisplacementY = velocity.y / friction;

    // 返回时间函数，参数为0-1之间的百分比
    return (percent: number): Point => {
        // 确保百分比在有效范围内
        const clampedPercent = Math.max(0, Math.min(1, percent));

        // 对于小摩擦系数的优化，避免除零错误
        if (friction < 0.0001) {
            // 当摩擦力极小时，近似为匀速运动
            return {
                x: initialPosition.x + velocity.x * clampedPercent,
                y: initialPosition.y + velocity.y * clampedPercent
            };
        }

        // 使用指数衰减模型计算当前位置
        // s(t) = s0 + (v0/μ) * (1 - e^(-μ * t))
        // 其中t映射到百分比0-1
        const normalizedTime = clampedPercent; // 将百分比直接映射为归一化时间

        return {
            x: initialPosition.x + totalDisplacementX * (1 - Math.exp(-friction * normalizedTime)),
            y: initialPosition.y + totalDisplacementY * (1 - Math.exp(-friction * normalizedTime))
        };
    };
}

export function inertialDragTimingFunction(
    velocity: number,
    deceleration: number = 0.09
): number {
  return velocity / (1 + deceleration * velocity)
}

// 获取减速运动所用时间
export function getDecelerationTime(
    velocity: number,
    deceleration: number = 0.009
): number {
    return velocity / deceleration
}

/**
 * 创建惯性拖拽效果
 *
 * @param params 手势参数对象
 * @param options 保持触摸点相对位置选项
 * @param endDragPoint 拖拽结束时的位置 {x: number, y: number}
 * @param friction 摩擦力系数（默认为 0.009）
 * @param dragDuration 拖拽持续时间
 * @returns 返回一个清理函数，用于停止惯性拖拽效果
 */
export function makeInertialDrag(
    params: GestureParams,
    options: KeepTouchesRelativeOptions,
    dragDuration: number,
    friction: number = 0.009
): () => void {
    if (params.currentGlobalPoints.length !== params.startGlobalPoints.length) {
        console.error('currentGlobalPoints and startGlobalPoints must have the same length')
        return () => {}
    }
    // 每个点分别计算
    const timingFunctions = params.startGlobalPoints.map((startPoint, index) => {
        const dragOffset = {
            x: params.currentGlobalPoints[index].x - startPoint.x,
            y: params.currentGlobalPoints[index].y - startPoint.y
        }
        const velocity = {
            x: dragOffset.x / (dragDuration / 1000),
            y: dragOffset.y / (dragDuration / 1000)
        }
        return getInertialDragTimingFunction(params.currentGlobalPoints[index], velocity, friction)
    })
    const startTimestamp = Date.now()
    const job = () => {
        const percent = (Date.now() - startTimestamp) / dragDuration
        if (percent >= 1) {
            return
        }
        const newPoints = timingFunctions.map((timingFunction, index) => {
            return timingFunction(percent)
        })
        keepTouchesRelative({
            ...params,
            currentGlobalPoints: newPoints
        }, options)
        raf = requestAnimationFrame(job)
    }
    let raf = requestAnimationFrame(job)
    return () => {
        cancelAnimationFrame(raf)
    }
}
