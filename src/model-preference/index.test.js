import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPreferredModel, setPreferredModel } from './index.js'

describe('model preference', () => {
  const mockDbStorage = {
    setItem: vi.fn(),
    getItem: vi.fn()
  }

  beforeEach(() => {
    globalThis.window = { utools: { dbStorage: mockDbStorage } }
    vi.clearAllMocks()
  })

  describe('getPreferredModel', () => {
    it('返回存储的 modelId', () => {
      mockDbStorage.getItem.mockReturnValue('deepseek-chat')
      expect(getPreferredModel()).toBe('deepseek-chat')
    })

    it('无存储时返回 null', () => {
      mockDbStorage.getItem.mockReturnValue(null)
      expect(getPreferredModel()).toBeNull()
    })

    it('使用固定 key 读取', () => {
      getPreferredModel()
      expect(mockDbStorage.getItem).toHaveBeenCalledWith('preferredModel')
    })
  })

  describe('setPreferredModel', () => {
    it('将 modelId 写入存储', () => {
      setPreferredModel('gpt-4')
      expect(mockDbStorage.setItem).toHaveBeenCalledWith('preferredModel', 'gpt-4')
    })
  })
})
