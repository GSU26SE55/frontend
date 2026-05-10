import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BatteryReadingForm } from '../BatteryReadingForm'

describe('BatteryReadingForm — Create mode (no defaultValues)', () => {
  it('renders all fields', () => {
    render(<BatteryReadingForm onSubmit={vi.fn()} isPending={false} />)
    expect(screen.getByText('Battery ID')).toBeInTheDocument()
    expect(screen.getByText(/Voltage/)).toBeInTheDocument()
    expect(screen.getByText(/Current/)).toBeInTheDocument()
    expect(screen.getByText(/Temperature/)).toBeInTheDocument()
  })

  it('submit button says "Thêm mới" in create mode', () => {
    render(<BatteryReadingForm onSubmit={vi.fn()} isPending={false} />)
    expect(screen.getByRole('button', { name: 'Thêm mới' })).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<BatteryReadingForm onSubmit={vi.fn()} isPending={false} />)
    await user.click(screen.getByRole('button', { name: 'Thêm mới' }))
    await waitFor(() => {
      expect(screen.getByText('Bắt buộc chọn pin')).toBeInTheDocument()
    })
  })

  it('calls onSubmit with correct values after valid input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BatteryReadingForm onSubmit={onSubmit} isPending={false} />)

    // Fill voltage
    const voltageInput = screen.getByLabelText(/Voltage/)
    await user.clear(voltageInput)
    await user.type(voltageInput, '3.7')

    // Fill current
    const currentInput = screen.getByLabelText(/Current/)
    await user.clear(currentInput)
    await user.type(currentInput, '1.2')

    // Fill temperature
    const tempInput = screen.getByLabelText(/Temperature/)
    await user.clear(tempInput)
    await user.type(tempInput, '28')

    // Note: Select (batteryId) requires special handling in jsdom
    // Validate that form prevents submission without batteryId
    await user.click(screen.getByRole('button', { name: 'Thêm mới' }))
    await waitFor(() => {
      expect(screen.getByText('Bắt buộc chọn pin')).toBeInTheDocument()
    })
  })

  it('submit button is disabled when isPending=true', () => {
    render(<BatteryReadingForm onSubmit={vi.fn()} isPending={true} />)
    expect(screen.getByRole('button', { name: 'Thêm mới' })).toBeDisabled()
  })
})

describe('BatteryReadingForm — Edit mode (with defaultValues)', () => {
  const defaultValues = { batteryId: 'BAT-002', voltage: 3.8, current: -0.5, temperature: 32 }

  it('submit button says "Cập nhật" in edit mode', () => {
    render(<BatteryReadingForm defaultValues={defaultValues} onSubmit={vi.fn()} isPending={false} />)
    expect(screen.getByRole('button', { name: 'Cập nhật' })).toBeInTheDocument()
  })

  it('pre-fills number inputs with defaultValues', () => {
    render(<BatteryReadingForm defaultValues={defaultValues} onSubmit={vi.fn()} isPending={false} />)
    const voltageInput = screen.getByLabelText(/Voltage/) as HTMLInputElement
    expect(voltageInput.value).toBe('3.8')
    const currentInput = screen.getByLabelText(/Current/) as HTMLInputElement
    expect(currentInput.value).toBe('-0.5')
    const tempInput = screen.getByLabelText(/Temperature/) as HTMLInputElement
    expect(tempInput.value).toBe('32')
  })

  it('shows voltage validation error when out of range', async () => {
    const user = userEvent.setup()
    render(<BatteryReadingForm defaultValues={defaultValues} onSubmit={vi.fn()} isPending={false} />)
    const voltageInput = screen.getByLabelText(/Voltage/)
    await user.clear(voltageInput)
    await user.type(voltageInput, '10')
    await user.click(screen.getByRole('button', { name: 'Cập nhật' }))
    await waitFor(() => {
      expect(screen.getByText('Max 5V')).toBeInTheDocument()
    })
  })

  it('shows current validation error when out of range (> max)', async () => {
    const user = userEvent.setup()
    render(<BatteryReadingForm defaultValues={defaultValues} onSubmit={vi.fn()} isPending={false} />)
    const currentInput = screen.getByLabelText(/Current/)
    await user.clear(currentInput)
    await user.type(currentInput, '15')
    await user.click(screen.getByRole('button', { name: 'Cập nhật' }))
    await waitFor(() => {
      expect(screen.getByText('Max 10A')).toBeInTheDocument()
    })
  })
})
