import { describe, it, expect, vi } from 'vitest'
import { queryWord, queryWordStream } from './index.js'

describe('queryWord', () => {
  it('调用 utools.ai 并返回 content 文本', async () => {
    const mockAi = vi.fn().mockResolvedValue({ content: 'mock markdown result' })
    globalThis.window = { utools: { ai: mockAi } }

    const result = await queryWord([{ role: 'user', content: 'hello' }])
    expect(result).toBe('mock markdown result')
  })

  it('将 messages 数组传递给 utools.ai', async () => {
    const mockAi = vi.fn().mockResolvedValue({ content: 'result' })
    globalThis.window = { utools: { ai: mockAi } }

    const messages = [{ role: 'system', content: 'sys' }, { role: 'user', content: 'hello' }]
    await queryWord(messages)

    expect(mockAi).toHaveBeenCalledWith(
      expect.objectContaining({
        messages
      })
    )
  })

  it('不传 model 时 option.model 为空', async () => {
    const mockAi = vi.fn().mockResolvedValue({ content: 'result' })
    globalThis.window = { utools: { ai: mockAi } }

    await queryWord([{ role: 'user', content: 'test' }])
    const callArg = mockAi.mock.calls[0][0]
    expect(callArg.model).toBeUndefined()
  })

  it('传入 model 时 option.model 为指定值', async () => {
    const mockAi = vi.fn().mockResolvedValue({ content: 'result' })
    globalThis.window = { utools: { ai: mockAi } }

    await queryWord([{ role: 'user', content: 'test' }], 'gpt-4')
    const callArg = mockAi.mock.calls[0][0]
    expect(callArg.model).toBe('gpt-4')
  })
})

describe('queryWordStream', () => {
  it('将 streamCallback 作为第二个参数传递给 utools.ai', async () => {
    const mockAi = vi.fn().mockResolvedValue(undefined)
    globalThis.window = { utools: { ai: mockAi } }

    const onChunk = vi.fn()
    const messages = [{ role: 'user', content: 'hello' }]

    await queryWordStream(messages, undefined, onChunk)

    expect(mockAi).toHaveBeenCalledWith(
      expect.objectContaining({ messages }),
      expect.any(Function)
    )
  })

  it('每次收到 chunk.content 时调用 onChunk 回调', async () => {
    let streamCallback = null
    const mockAi = vi.fn((_, cb) => {
      streamCallback = cb
      return Promise.resolve()
    })
    globalThis.window = { utools: { ai: mockAi } }

    const onChunk = vi.fn()
    const promise = queryWordStream([{ role: 'user', content: 'hi' }], undefined, onChunk)

    streamCallback({ content: '第一部分' })
    streamCallback({ content: '第二部分' })
    streamCallback({ content: '' })
    streamCallback({})
    await promise

    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(onChunk).toHaveBeenCalledWith('第一部分')
    expect(onChunk).toHaveBeenCalledWith('第二部分')
  })

  it('传入 model 时 option.model 为指定值', async () => {
    const mockAi = vi.fn().mockResolvedValue(undefined)
    globalThis.window = { utools: { ai: mockAi } }

    await queryWordStream([{ role: 'user', content: 'test' }], 'deepseek', vi.fn())

    expect(mockAi).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'deepseek' }),
      expect.any(Function)
    )
  })
})
