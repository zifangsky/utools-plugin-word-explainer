import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, act } from '@testing-library/react'
import App from './App.jsx'

const mainPageMock = vi.hoisted(() => ({ calls: [] }))

vi.mock('./main-page', async () => {
  const React = await import('react')
  return {
    default: (props) => {
      mainPageMock.calls.push(props)
      return React.createElement('div', { 'data-testid': 'main-page-mock' })
    }
  }
})

function setupUtools () {
  const handlers = {}
  window.utools = {
    onPluginEnter: vi.fn((cb) => { handlers.onEnter = cb }),
    onPluginOut: vi.fn((cb) => { handlers.onOut = cb })
  }
  return handlers
}

describe('App 根组件', () => {
  beforeEach(() => {
    mainPageMock.calls.length = 0
  })

  afterEach(() => {
    delete window.utools
  })

  it('onPluginEnter 携带的进入动作被原样透传给 MainPage', () => {
    const handlers = setupUtools()
    const action = { code: 'explain-word', type: 'regex', payload: 'ephemeral' }

    render(<App />)
    act(() => { handlers.onEnter(action) })

    const last = mainPageMock.calls[mainPageMock.calls.length - 1]
    expect(last.enterAction).toEqual(action)
  })

  it('进入前 enterAction 为 null，主界面不会误触发自动查询', () => {
    setupUtools()

    render(<App />)

    expect(mainPageMock.calls[0].enterAction).toBeNull()
  })

  it('onPluginOut 后停止渲染 MainPage，再次进入后恢复渲染', () => {
    const handlers = setupUtools()

    render(<App />)
    expect(screen.getByTestId('main-page-mock')).toBeInTheDocument()

    act(() => { handlers.onOut() })
    expect(screen.queryByTestId('main-page-mock')).not.toBeInTheDocument()

    act(() => { handlers.onEnter({ code: 'explain-word', type: 'regex', payload: 'hello' }) })
    expect(screen.getByTestId('main-page-mock')).toBeInTheDocument()
  })
})
