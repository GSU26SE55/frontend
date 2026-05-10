import { beforeEach, describe, expect, it } from 'vitest'

// Reset module between tests to get fresh store
let getList: typeof import('../battery-reading.mock').getList
let createReading: typeof import('../battery-reading.mock').createReading
let updateReading: typeof import('../battery-reading.mock').updateReading
let deleteReading: typeof import('../battery-reading.mock').deleteReading

beforeEach(async () => {
  // Re-import to reset module-level store between test files
  // Note: within same file, store state persists across tests intentionally
  const mod = await import('../battery-reading.mock')
  getList = mod.getList
  createReading = mod.createReading
  updateReading = mod.updateReading
  deleteReading = mod.deleteReading
})

describe('getList', () => {
  it('returns seed data on first call', async () => {
    const list = await getList()
    expect(list.length).toBeGreaterThanOrEqual(5)
  })

  it('returns a copy — mutating result does not affect store', async () => {
    const list = await getList()
    const originalLength = list.length
    list.push({ id: 'x', batteryId: 'BAT-999', voltage: 1, current: 1, temperature: 1, timestamp: '' })
    const list2 = await getList()
    expect(list2.length).toBe(originalLength)
  })
})

describe('createReading', () => {
  it('prepends new record and returns it', async () => {
    const before = await getList()
    const created = await createReading({ batteryId: 'BAT-001', voltage: 4.0, current: 1.0, temperature: 30 })

    expect(created.id).toBeTruthy()
    expect(created.batteryId).toBe('BAT-001')
    expect(created.voltage).toBe(4.0)
    expect(created.timestamp).toBeTruthy()

    const after = await getList()
    expect(after.length).toBe(before.length + 1)
    expect(after[0].id).toBe(created.id)
  })

  it('generates unique id for each record', async () => {
    const a = await createReading({ batteryId: 'BAT-001', voltage: 3.7, current: 0.5, temperature: 25 })
    const b = await createReading({ batteryId: 'BAT-002', voltage: 3.8, current: 0.6, temperature: 26 })
    expect(a.id).not.toBe(b.id)
  })
})

describe('updateReading', () => {
  it('updates existing record and returns updated version', async () => {
    const created = await createReading({ batteryId: 'BAT-001', voltage: 3.0, current: 0.1, temperature: 20 })
    const updated = await updateReading(created.id, { batteryId: 'BAT-003', voltage: 4.5, current: 2.0, temperature: 50 })

    expect(updated.id).toBe(created.id)
    expect(updated.batteryId).toBe('BAT-003')
    expect(updated.voltage).toBe(4.5)
    expect(updated.temperature).toBe(50)
  })

  it('preserves timestamp when updating', async () => {
    const created = await createReading({ batteryId: 'BAT-001', voltage: 3.0, current: 0.1, temperature: 20 })
    const updated = await updateReading(created.id, { batteryId: 'BAT-002', voltage: 4.0, current: 1.0, temperature: 30 })
    expect(updated.timestamp).toBe(created.timestamp)
  })

  it('throws when id not found', async () => {
    await expect(
      updateReading('nonexistent-id', { batteryId: 'BAT-001', voltage: 1, current: 1, temperature: 1 })
    ).rejects.toThrow('Reading not found')
  })
})

describe('deleteReading', () => {
  it('removes record from store', async () => {
    const created = await createReading({ batteryId: 'BAT-001', voltage: 3.7, current: 0.5, temperature: 25 })
    const before = await getList()
    expect(before.some((r) => r.id === created.id)).toBe(true)

    await deleteReading(created.id)

    const after = await getList()
    expect(after.some((r) => r.id === created.id)).toBe(false)
    expect(after.length).toBe(before.length - 1)
  })

  it('does not throw when deleting nonexistent id', async () => {
    await expect(deleteReading('ghost-id')).resolves.toBeUndefined()
  })
})
