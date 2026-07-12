import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSaveQueryHistory, setSaveQueryHistory } from './index.js'

describe('history preference', () => {
  const store = {}
  const mockDbStorage = {
    setItem: vi.fn((k, v) => { store[k] = v }),
    getItem: vi.fn((k) => (k in store ? store[k] : null))
  }

  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k]
    vi.clearAllMocks()
    globalThis.window = { utools: { dbStorage: mockDbStorage } }
  })

  describe('getSaveQueryHistory', () => {
    it('无存储时缺省返回 true', () => {
      expect(getSaveQueryHistory()).toBe(true)
      expect(mockDbStorage.getItem).toHaveBeenCalledWith('saveQueryHistory')
    })

    it('存储为 false 时返回 false', () => {
      mockDbStorage.getItem.mockReturnValue(false)
      expect(getSaveQueryHistory()).toBe(false)
    })

    it('存储为字符串 "false" 时返回 false', () => {
      mockDbStorage.getItem.mockReturnValue('false')
      expect(getSaveQueryHistory()).toBe(false)
    })
  })

  describe('setSaveQueryHistory', () => {
    it('写入 false 后读取返回 false', () => {
      setSaveQueryHistory(false)
      expect(mockDbStorage.setItem).toHaveBeenCalledWith('saveQueryHistory', false)
      mockDbStorage.getItem.mockReturnValue(false)
      expect(getSaveQueryHistory()).toBe(false)
    })

    it('写入 true 后读取返回 true', () => {
      setSaveQueryHistory(true)
      expect(mockDbStorage.setItem).toHaveBeenCalledWith('saveQueryHistory', true)
      mockDbStorage.getItem.mockReturnValue(true)
      expect(getSaveQueryHistory()).toBe(true)
    })
  })
})
