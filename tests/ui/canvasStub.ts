import { vi } from 'vitest'

/** A recording stand-in for CanvasRenderingContext2D (jsdom has no canvas). */
export function stubContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  }
}

export function canvasWithStub(id: string, width = 300, height = 150) {
  const canvas = document.createElement('canvas')
  canvas.id = id
  canvas.width = width
  canvas.height = height
  document.body.appendChild(canvas)
  const ctx = stubContext()
  vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
  return { canvas, ctx }
}
