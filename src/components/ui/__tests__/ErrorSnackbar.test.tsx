import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnackbarProvider, useSnackbar } from '../ErrorSnackbar'
import { ConnectError, Code } from '@connectrpc/connect'

function ErrorTrigger({ err }: { err: unknown }) {
  const { showError } = useSnackbar()
  return <button onClick={() => showError(err)}>trigger</button>
}

function SuccessTrigger({ msg }: { msg: string }) {
  const { showSuccess } = useSnackbar()
  return <button onClick={() => showSuccess(msg)}>trigger</button>
}

describe('SnackbarProvider', () => {
  it('shows a ConnectError message', async () => {
    const err = new ConnectError('budget not found', Code.NotFound)
    render(<SnackbarProvider><ErrorTrigger err={err} /></SnackbarProvider>)
    await userEvent.click(screen.getByRole('button'))
    // ConnectError.message includes the status code prefix, e.g. "[not_found] budget not found"
    expect(await screen.findByText(/budget not found/)).toBeInTheDocument()
  })

  it('shows a regular Error message', async () => {
    const err = new Error('something broke')
    render(<SnackbarProvider><ErrorTrigger err={err} /></SnackbarProvider>)
    await userEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('something broke')).toBeInTheDocument()
  })

  it('shows a fallback message for unknown error types', async () => {
    render(<SnackbarProvider><ErrorTrigger err={{ code: 42 }} /></SnackbarProvider>)
    await userEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('shows a success message', async () => {
    render(<SnackbarProvider><SuccessTrigger msg="Budget created!" /></SnackbarProvider>)
    await userEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('Budget created!')).toBeInTheDocument()
  })

  it('throws when useSnackbar is called outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    function Orphan() {
      useSnackbar()
      return null
    }
    expect(() => render(<Orphan />)).toThrow('useSnackbar must be used inside SnackbarProvider')
    jest.restoreAllMocks()
  })
})
