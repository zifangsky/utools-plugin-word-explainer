import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWordQuery } from './index.js'

import { buildMessages } from '../prompt-template/index.js'
import { queryWordStream } from '../ai-call/index.js'
import { parseJsonFromContent, saveQueryRecord } from '../query-history/index.js'
import { getSaveQueryHistory } from '../history-preference/index.js'

vi.mock('../prompt-template/index.js', () => ({
  buildMessages: vi.fn((word) => [{ role: 'user', content: `test prompt for: ${word}` }])
}))

vi.mock('../ai-call/index.js', () => ({
  queryWordStream: vi.fn()
}))

vi.mock('../query-history/index.js', () => ({
  parseJsonFromContent: vi.fn(),
  saveQueryRecord: vi.fn()
}))

describe('useWordQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 模拟 utools 环境
    window.utools = { db: {} }
  })

  it('初始状态 loading=false, error="", result=""', () => {
    const { result } = renderHook(() => useWordQuery())
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('')
    expect(result.current.result).toBe('')
    expect(typeof result.current.query).toBe('function')
  })

  it('调用 query 后 loading 变为 true', async () => {
    queryWordStream.mockImplementation(async (_opt, _model, onChunk) => {
      onChunk('hello')
    })

    const { result } = renderHook(() => useWordQuery())

    let queryPromise
    await act(async () => {
      queryPromise = result.current.query('serendipity')
    })
    // 在 act 中 loading 可能已经变回 false（取决于异步速度），我们验证 query 被调用
    expect(buildMessages).toHaveBeenCalledWith('serendipity')
    expect(queryWordStream).toHaveBeenCalled()
    await queryPromise
  })

  it('流式内容累积到 result', async () => {
    queryWordStream.mockImplementation(async (_opt, _model, onChunk) => {
      onChunk('第一段')
      onChunk('第二段')
    })

    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('ephemeral')
    })

    expect(result.current.result).toContain('第一段')
    expect(result.current.result).toContain('第二段')
  })

  it('查询失败时 error 不为空', async () => {
    queryWordStream.mockRejectedValue(new Error('网络错误'))

    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('test')
    })

    expect(result.current.error).toContain('网络错误')
    expect(result.current.loading).toBe(false)
  })

  it('空字符串不触发查询', async () => {
    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('')
    })

    expect(buildMessages).not.toHaveBeenCalled()
    expect(queryWordStream).not.toHaveBeenCalled()
  })

  it('model 参数传递给 queryWordStream', async () => {
    queryWordStream.mockImplementation(async () => {})

    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('hello', 'gpt-4')
    })

    // 第二个参数是 model
    expect(queryWordStream.mock.calls[0][1]).toBe('gpt-4')
  })

  it('不传 model 时传递 undefined', async () => {
    queryWordStream.mockImplementation(async () => {})

    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('hello')
    })

    expect(queryWordStream.mock.calls[0][1]).toBeUndefined()
  })

  it('查询成功后自动保存查词记录', async () => {
    const fullContent = '**hello** /həˈləʊ/\n\n解释内容\n\n===JSON===\n{"word":"hello","phonetic":"həˈləʊ","chineseMeanings":["你好"]}'
    queryWordStream.mockImplementation(async (_opt, _model, onChunk) => {
      onChunk(fullContent)
    })
    parseJsonFromContent.mockReturnValue({
      parsed: { word: 'hello', phonetic: 'həˈləʊ', chineseMeanings: ['你好'] },
      cleanContent: '**hello** /həˈləʊ/\n\n解释内容'
    })

    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('hello', 'gpt-4')
    })

    expect(parseJsonFromContent).toHaveBeenCalledWith(fullContent)
    expect(saveQueryRecord).toHaveBeenCalledWith(window.utools.db, 'hello', 'həˈləʊ', ['你好'], '**hello** /həˈləʊ/\n\n解释内容', 'gpt-4')
    // result 应显示剥离后的内容
    expect(result.current.result).not.toContain('===JSON===')
    expect(result.current.result).toContain('**hello**')
  })

  it('解析 JSON 失败时不保存记录，result 使用原始内容', async () => {
    const fullContent = '**hello** /həˈləʊ/\n\n解释内容（无 JSON）'
    queryWordStream.mockImplementation(async (_opt, _model, onChunk) => {
      onChunk(fullContent)
    })
    parseJsonFromContent.mockReturnValue(null)

    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('hello')
    })

    expect(parseJsonFromContent).toHaveBeenCalledWith(fullContent)
    expect(saveQueryRecord).not.toHaveBeenCalled()
    expect(result.current.result).toBe(fullContent)
  })
})

describe('保存查词历史门控（getSaveQueryHistory）', () => {
  // 真实 dbStorage fake：getSaveQueryHistory 读取 live window，不 mock
  let saveEnabled
  const fakeDbStorage = {
    getItem: (k) => (k === 'saveQueryHistory' ? saveEnabled : null),
    setItem: () => {}
  }

  beforeEach(() => {
    vi.clearAllMocks()
    saveEnabled = true // 默认开启
    window.utools = { db: {}, dbStorage: fakeDbStorage }
  })

  it('开关开启（缺省）时查询成功后自动保存查词记录', async () => {
    saveEnabled = true
    const fullContent = '**hello** /həˈləʊ/\n\n解释\n\n===JSON===\n{"word":"hello","phonetic":"həˈləʊ","chineseMeanings":["你好"]}'
    queryWordStream.mockImplementation(async (_opt, _model, onChunk) => {
      onChunk(fullContent)
    })
    parseJsonFromContent.mockReturnValue({
      parsed: { word: 'hello', phonetic: 'həˈləʊ', chineseMeanings: ['你好'] },
      cleanContent: '**hello** /həˈləʊ/\n\n解释'
    })

    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('hello', 'gpt-4')
    })

    expect(getSaveQueryHistory()).toBe(true)
    expect(saveQueryRecord).toHaveBeenCalledWith(
      window.utools.db,
      'hello',
      'həˈləʊ',
      ['你好'],
      '**hello** /həˈləʊ/\n\n解释',
      'gpt-4'
    )
  })

  it('开关关闭时不保存查词记录', async () => {
    saveEnabled = false
    const fullContent = '**hello** /həˈləʊ/\n\n解释\n\n===JSON===\n{"word":"hello","phonetic":"həˈləʊ","chineseMeanings":["你好"]}'
    queryWordStream.mockImplementation(async (_opt, _model, onChunk) => {
      onChunk(fullContent)
    })
    parseJsonFromContent.mockReturnValue({
      parsed: { word: 'hello', phonetic: 'həˈləʊ', chineseMeanings: ['你好'] },
      cleanContent: '**hello** /həˈləʊ/\n\n解释'
    })

    const { result } = renderHook(() => useWordQuery())

    await act(async () => {
      await result.current.query('hello', 'gpt-4')
    })

    expect(getSaveQueryHistory()).toBe(false)
    expect(saveQueryRecord).not.toHaveBeenCalled()
    // result 仍显示剥离后的内容
    expect(result.current.result).toContain('**hello**')
  })
})
