import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import {
  useBatteryReadingList,
  useCreateReading,
  useDeleteReading,
  useUpdateReading,
} from '../useBatteryReadings'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

afterEach(() => vi.clearAllMocks())

describe('useBatteryReadingList', () => {
  it('fetches and returns list with at least 5 seed items', async () => {
    const { result } = renderHook(() => useBatteryReadingList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBeGreaterThanOrEqual(5)
  })
})

describe('useCreateReading', () => {
  it('mutation resolves and data has id + timestamp', async () => {
    const { result } = renderHook(() => useCreateReading(), { wrapper: makeWrapper() })
    result.current.mutate({ batteryId: 'BAT-001', voltage: 4.0, current: 1.0, temperature: 30 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBeTruthy()
    expect(result.current.data?.timestamp).toBeTruthy()
  })
})

describe('useUpdateReading', () => {
  it('mutation resolves with updated values', async () => {
    const { result: createResult } = renderHook(() => useCreateReading(), { wrapper: makeWrapper() })
    createResult.current.mutate({ batteryId: 'BAT-001', voltage: 3.5, current: 0.5, temperature: 25 })
    await waitFor(() => expect(createResult.current.isSuccess).toBe(true))
    const id = createResult.current.data!.id

    const wrapper = makeWrapper()
    const { result } = renderHook(() => useUpdateReading(), { wrapper })
    result.current.mutate({ id, values: { batteryId: 'BAT-002', voltage: 4.2, current: 1.5, temperature: 40 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.voltage).toBe(4.2)
    expect(result.current.data?.batteryId).toBe('BAT-002')
  })

  it('mutation fails when id not found', async () => {
    const { result } = renderHook(() => useUpdateReading(), { wrapper: makeWrapper() })
    result.current.mutate({ id: 'bad-id', values: { batteryId: 'BAT-001', voltage: 1, current: 1, temperature: 1 } })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useDeleteReading', () => {
  it('mutation resolves without error', async () => {
    const { result: createResult } = renderHook(() => useCreateReading(), { wrapper: makeWrapper() })
    createResult.current.mutate({ batteryId: 'BAT-003', voltage: 3.9, current: 0.8, temperature: 35 })
    await waitFor(() => expect(createResult.current.isSuccess).toBe(true))
    const id = createResult.current.data!.id

    const wrapper = makeWrapper()
    const { result } = renderHook(() => useDeleteReading(), { wrapper })
    result.current.mutate(id)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
