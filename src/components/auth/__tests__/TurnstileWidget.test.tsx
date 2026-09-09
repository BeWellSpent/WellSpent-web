import { createRef } from 'react'
import { render } from '@testing-library/react'
import { TurnstileWidget, type TurnstileWidgetHandle } from '../TurnstileWidget'

// next/script's real behavior (fetching + executing a remote script) doesn't
// happen in jsdom, so window.turnstile is simulated directly per test rather
// than relying on the actual <Script onLoad> firing.

afterEach(() => {
  delete (window as { turnstile?: unknown }).turnstile
})

describe('TurnstileWidget', () => {
  it('renders a container for the widget without crashing', () => {
    const { container } = render(<TurnstileWidget onToken={jest.fn()} />)
    expect(container).toBeTruthy()
  })

  it('renders into the container once window.turnstile is available, passing the site key', () => {
    const renderSpy = jest.fn().mockReturnValue('widget-id-1')
    window.turnstile = { render: renderSpy, reset: jest.fn() }

    render(<TurnstileWidget onToken={jest.fn()} />)

    expect(renderSpy).toHaveBeenCalledTimes(1)
    const [, options] = renderSpy.mock.calls[0]
    expect(options).toMatchObject({ sitekey: expect.any(String) })
  })

  it('invokes onToken with the token Turnstile reports via its callback', () => {
    let capturedCallback: ((token: string) => void) | undefined
    window.turnstile = {
      render: (_container, options) => {
        capturedCallback = options.callback
        return 'widget-id-1'
      },
      reset: jest.fn(),
    }
    const onToken = jest.fn()

    render(<TurnstileWidget onToken={onToken} />)
    capturedCallback?.('a-real-token')

    expect(onToken).toHaveBeenCalledWith('a-real-token')
  })

  it('reset() clears the token and resets the underlying Turnstile widget', () => {
    const resetSpy = jest.fn()
    window.turnstile = { render: () => 'widget-id-1', reset: resetSpy }
    const onToken = jest.fn()
    const ref = createRef<TurnstileWidgetHandle>()

    render(<TurnstileWidget ref={ref} onToken={onToken} />)
    ref.current?.reset()

    expect(resetSpy).toHaveBeenCalledWith('widget-id-1')
    expect(onToken).toHaveBeenCalledWith('')
  })

  it('reset() is a no-op (still clears the token) when no widget was ever rendered', () => {
    const onToken = jest.fn()
    const ref = createRef<TurnstileWidgetHandle>()

    render(<TurnstileWidget ref={ref} onToken={onToken} />)
    expect(() => ref.current?.reset()).not.toThrow()
    expect(onToken).toHaveBeenCalledWith('')
  })
})
