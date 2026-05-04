import { describe, it, expect, vi } from 'vitest'
import { createAiAdapter, queryWord, queryWordStream } from './index.js'

describe('createAiAdapter → queryWord', () => {
  it('调用 client.ai 并返回 content 文本', async () => {
    const ai = vi.fn().mockResolvedValue({ content: 'mock markdown result' })
    const adapter = createAiAdapter({ ai })

    const result = await adapter.queryWord([{ role: 'user', content: 'hello' }])
    expect(result).toBe('mock markdown result')
  })

  it('将 messages 数组传递给 client.ai', async () => {
    const ai = vi.fn().mockResolvedValue({ content: 'result' })
    const adapter = createAiAdapter({ ai })

    const messages = [{ role: 'system', content: 'sys' }, { role: 'user', content: 'hello' }]
    await adapter.queryWord(messages)

    expect(ai).toHaveBeenCalledWith(expect.objectContaining({ messages }))
  })

  it('不传 model 时 option.model 为空', async () => {
    const ai = vi.fn().mockResolvedValue({ content: 'result' })
    const adapter = createAiAdapter({ ai })

    await adapter.queryWord([{ role: 'user', content: 'test' }])
    const callArg = ai.mock.calls[0][0]
    expect(callArg.model).toBeUndefined()
  })

  it('传入 model 时 option.model 为指定值', async () => {
    const ai = vi.fn().mockResolvedValue({ content: 'result' })
    const adapter = createAiAdapter({ ai })

    await adapter.queryWord([{ role: 'user', content: 'test' }], 'gpt-4')
    const callArg = ai.mock.calls[0][0]
    expect(callArg.model).toBe('gpt-4')
  })
})

describe('createAiAdapter → queryWordStream', () => {
  it('将 streamCallback 作为第二个参数传递给 client.ai', async () => {
    const ai = vi.fn().mockResolvedValue(undefined)
    const adapter = createAiAdapter({ ai })
    const onChunk = vi.fn()

    await adapter.queryWordStream([{ role: 'user', content: 'hello' }], undefined, onChunk)

    expect(ai).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [{ role: 'user', content: 'hello' }] }),
      expect.any(Function)
    )
  })

  it('每次收到 chunk.content 时调用 onChunk 回调', async () => {
    let streamCallback = null
    const ai = vi.fn((_opt, cb) => { streamCallback = cb; return Promise.resolve() })
    const adapter = createAiAdapter({ ai })
    const onChunk = vi.fn()

    const promise = adapter.queryWordStream([{ role: 'user', content: 'hi' }], undefined, onChunk)
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
    const ai = vi.fn().mockResolvedValue(undefined)
    const adapter = createAiAdapter({ ai })

    await adapter.queryWordStream([{ role: 'user', content: 'test' }], 'deepseek', vi.fn())

    expect(ai).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'deepseek' }),
      expect.any(Function)
    )
  })
})

describe('默认导出', () => {
  it('queryWord 不抛出错误（使用默认适配器）', async () => {
    const result = await queryWord([{ role: 'user', content: 'hi' }])
    expect(typeof result).toBe('string')
  })

  it('queryWordStream 不抛出错误（使用默认适配器）', async () => {
    await expect(
      queryWordStream([{ role: 'user', content: 'hi' }], undefined, vi.fn())
    ).resolves.toBeUndefined()
  })
})
