import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createExplainWordHandler } from './index.js'

vi.mock('../prompt-template/index.js', () => ({
  buildMessages: vi.fn()
}))

import { buildMessages } from '../prompt-template/index.js'

describe('createExplainWordHandler', () => {
  let aiClient
  let modelPreference
  let handler

  beforeEach(() => {
    vi.clearAllMocks()
    buildMessages.mockReturnValue([{ role: 'user', content: 'explain: test' }])
    aiClient = { queryWordStream: vi.fn() }
    modelPreference = { getPreferredModel: vi.fn(() => null) }
    handler = createExplainWordHandler(aiClient, modelPreference)
  })

  describe('基本功能', () => {
    it('返回 { word, content } 结构化对象', async () => {
      aiClient.queryWordStream.mockImplementation(async (_msgs, _model, onChunk) => {
        onChunk('第一部分')
        onChunk('第二部分')
      })

      const result = await handler({ word: 'ephemeral' }, {})

      expect(result).toEqual({ word: 'ephemeral', content: '第一部分第二部分' })
    })

    it('空 word 参数抛出错误', async () => {
      await expect(handler({ word: '' }, {})).rejects.toThrow('请提供要查询的英文单词')
      await expect(handler({ word: '  ' }, {})).rejects.toThrow('请提供要查询的英文单词')
    })

    it('params 中无 word 字段时抛出错误', async () => {
      await expect(handler({}, {})).rejects.toThrow('请提供要查询的英文单词')
    })
  })

  describe('参数透传', () => {
    it('将 word 传给 buildMessages 构建提示词', async () => {
      aiClient.queryWordStream.mockImplementation(async () => {})

      await handler({ word: 'serendipity' }, {})

      expect(buildMessages).toHaveBeenCalledWith('serendipity')
    })

    it('从 modelPreference 读取偏好模型并传给 aiClient', async () => {
      modelPreference.getPreferredModel.mockReturnValue('gpt-4')
      aiClient.queryWordStream.mockImplementation(async () => {})

      await handler({ word: 'test' }, {})

      expect(modelPreference.getPreferredModel).toHaveBeenCalled()
      expect(aiClient.queryWordStream).toHaveBeenCalledWith(
        [{ role: 'user', content: 'explain: test' }],
        'gpt-4',
        expect.any(Function)
      )
    })

    it('无偏好模型时 model 传 undefined', async () => {
      modelPreference.getPreferredModel.mockReturnValue(null)
      aiClient.queryWordStream.mockImplementation(async () => {})

      await handler({ word: 'test' }, {})

      expect(aiClient.queryWordStream).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        expect.any(Function)
      )
    })
  })

  describe('流式拼接', () => {
    it('将多次 onChunk 回调正确拼接为 content', async () => {
      aiClient.queryWordStream.mockImplementation(async (_msgs, _model, onChunk) => {
        onChunk('**1、词义解析**')
        onChunk('\n\n---\n\n')
        onChunk('**2、词性用法**')
      })

      const result = await handler({ word: 'test' }, {})

      expect(result.content).toBe('**1、词义解析**\n\n---\n\n**2、词性用法**')
      expect(result.word).toBe('test')
    })

    it('AI 未返回任何内容时 content 为空字符串', async () => {
      aiClient.queryWordStream.mockImplementation(async () => {})

      const result = await handler({ word: 'test' }, {})

      expect(result).toEqual({ word: 'test', content: '' })
    })
  })

  describe('进度上报', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('sendProgress 不存在时不报错', async () => {
      aiClient.queryWordStream.mockImplementation(async () => {})

      await expect(handler({ word: 'test' }, {})).resolves.toBeDefined()
    })

    it('流式完成时上报 progress: 100', async () => {
      const sendProgress = vi.fn()
      aiClient.queryWordStream.mockImplementation(async (_msgs, _model, onChunk) => {
        onChunk('data')
      })

      await handler({ word: 'test' }, { sendProgress })

      expect(sendProgress).toHaveBeenCalledWith({ progress: 100, total: 100 })
    })

    it('AI 调用失败时清除定时器不泄漏', async () => {
      const sendProgress = vi.fn()
      aiClient.queryWordStream.mockRejectedValue(new Error('API 调用失败'))

      await expect(
        handler({ word: 'test' }, { sendProgress })
      ).rejects.toThrow('API 调用失败')

      // 推进 10s，不应再有 sendProgress 调用
      vi.advanceTimersByTime(10000)
      const callCountAfterError = sendProgress.mock.calls.length

      vi.advanceTimersByTime(10000)
      expect(sendProgress.mock.calls.length).toBe(callCountAfterError)
    })
  })

  describe('错误处理', () => {
    it('aiClient 抛出的错误直接透传', async () => {
      aiClient.queryWordStream.mockRejectedValue(new Error('网络连接失败'))

      await expect(handler({ word: 'test' }, {})).rejects.toThrow('网络连接失败')
    })

    it('错误对象为非 Error 实例时也能抛出', async () => {
      aiClient.queryWordStream.mockRejectedValue('未知错误字符串')

      await expect(handler({ word: 'test' }, {})).rejects.toBe('未知错误字符串')
    })
  })
})
