import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LocationProvider, useLocation } from './LocationContext'

function Probe() {
  const { location, setLocation } = useLocation()
  return (
    <div>
      <span data-testid="name">{location?.name ?? 'none'}</span>
      <button onClick={() => setLocation({ name: 'Lyon', latitude: 45.75, longitude: 4.85 })}>set</button>
    </div>
  )
}

describe('LocationContext', () => {
  it('shares and updates the selected location', () => {
    render(
      <LocationProvider>
        <Probe />
      </LocationProvider>,
    )
    expect(screen.getByTestId('name')).toHaveTextContent('none')
    act(() => { screen.getByText('set').click() })
    expect(screen.getByTestId('name')).toHaveTextContent('Lyon')
  })

  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow()
    spy.mockRestore()
  })
})
