export interface Point {
  x: number
  y: number
}

export interface ReadonlyPoint extends Point {
  readonly x: number
  readonly y: number
}
