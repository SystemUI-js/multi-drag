describe('multi-drag-core import safety', () => {
  it('imports without DOM globals', async () => {
    const previousDocument = (globalThis as { document?: unknown }).document
    const previousWindow = (globalThis as { window?: unknown }).window

    delete (globalThis as { document?: unknown }).document
    delete (globalThis as { window?: unknown }).window

    await expect(import('../index')).resolves.toBeDefined()
    ;(globalThis as { document?: unknown }).document = previousDocument
    ;(globalThis as { window?: unknown }).window = previousWindow
  })
})
