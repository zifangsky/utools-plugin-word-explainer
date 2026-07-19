import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getFlomoApiEndpoint,
  setFlomoApiEndpoint,
  getFlomoTags,
  setFlomoTags,
  buildFlomoContent,
  syncToFlomo
} from './index.js'

describe('flomo preferences', () => {
  const mockDbStorage = {
    setItem: vi.fn(),
    getItem: vi.fn()
  }

  beforeEach(() => {
    globalThis.window = { utools: { dbStorage: mockDbStorage } }
    vi.clearAllMocks()
  })

  describe('getFlomoApiEndpoint', () => {
    it('返回存储的端点 URL', () => {
      mockDbStorage.getItem.mockReturnValue('https://flomoapp.com/api/v1/notes')
      expect(getFlomoApiEndpoint()).toBe('https://flomoapp.com/api/v1/notes')
    })

    it('无存储时返回空字符串', () => {
      mockDbStorage.getItem.mockReturnValue(null)
      expect(getFlomoApiEndpoint()).toBe('')
    })

    it('使用固定 key flomoApiEndpoint 读取', () => {
      getFlomoApiEndpoint()
      expect(mockDbStorage.getItem).toHaveBeenCalledWith('flomoApiEndpoint')
    })
  })

  describe('setFlomoApiEndpoint', () => {
    it('将端点 URL 写入存储', () => {
      setFlomoApiEndpoint('https://example.com/flomo')
      expect(mockDbStorage.setItem).toHaveBeenCalledWith('flomoApiEndpoint', 'https://example.com/flomo')
    })
  })

  describe('getFlomoTags', () => {
    it('返回存储的标签', () => {
      mockDbStorage.getItem.mockReturnValue('#English/vocabulary')
      expect(getFlomoTags()).toBe('#English/vocabulary')
    })

    it('无存储时返回默认值 #English/vocabulary', () => {
      mockDbStorage.getItem.mockReturnValue(null)
      expect(getFlomoTags()).toBe('#English/vocabulary')
    })

    it('存储值前导/尾随空白被 trim', () => {
      mockDbStorage.getItem.mockReturnValue('  #test  ')
      expect(getFlomoTags()).toBe('#test')
    })

    it('使用固定 key flomoTags 读取', () => {
      getFlomoTags()
      expect(mockDbStorage.getItem).toHaveBeenCalledWith('flomoTags')
    })
  })

  describe('setFlomoTags', () => {
    it('将标签写入存储并 trim', () => {
      setFlomoTags('  #tag1 #tag2  ')
      expect(mockDbStorage.setItem).toHaveBeenCalledWith('flomoTags', '#tag1 #tag2')
    })

    it('空字符串直接写入', () => {
      setFlomoTags('')
      expect(mockDbStorage.setItem).toHaveBeenCalledWith('flomoTags', '')
    })
  })
})

describe('buildFlomoContent', () => {
  it('含标签时：标签后空格 + 加粗标题 + 空行 + 正文', () => {
    const result = buildFlomoContent('notification', '通知 /ˌnəʊtɪfɪˈkeɪʃn/', '#English/vocabulary')
    expect(result).toBe('#English/vocabulary **notification 单词详解**\n\n通知 /ˌnəʊtɪfɪˈkeɪʃn/')
  })

  it('无标签（空字符串）时：仅加粗标题，无标签前缀', () => {
    const result = buildFlomoContent('notification', '通知 /ˌnəʊtɪfɪˈkeɪʃn/', '')
    expect(result).toBe('**notification 单词详解**\n\n通知 /ˌnəʊtɪfɪˈkeɪʃn/')
  })

  it('无标签（null/undefined 同视为空）时：仅加粗标题', () => {
    const result = buildFlomoContent('notification', '通知 /ˌnəʊtɪfɪˈkeɪʃn/', null)
    expect(result).toBe('**notification 单词详解**\n\n通知 /ˌnəʊtɪfɪˈkeɪʃn/')
  })

  it('多个标签时：标签之间空格分隔', () => {
    const result = buildFlomoContent('serendipity', '意外发现珍宝的本领', '#English #vocabulary')
    expect(result).toBe('#English #vocabulary **serendipity 单词详解**\n\n意外发现珍宝的本领')
  })

  it('正文为空字符串也能正常构建', () => {
    const result = buildFlomoContent('test', '', '#tag')
    expect(result).toBe('#tag **test 单词详解**\n\n')
  })

  it('正文含 markdown 特殊字符不被修改', () => {
    const result = buildFlomoContent('md', '**bold** #tag in text', '')
    expect(result).toBe('**md 单词详解**\n\n**bold** #tag in text')
  })
})

describe('syncToFlomo', () => {
  let mockSendToFlomo

  beforeEach(() => {
    mockSendToFlomo = vi.fn()
    globalThis.window = {
      utools: {
        dbStorage: {
          getItem: vi.fn(),
          setItem: vi.fn()
        }
      },
      services: {
        sendToFlomo: mockSendToFlomo
      }
    }
  })

  it('端点为空时返回失败结果', async () => {
    window.utools.dbStorage.getItem.mockImplementation((key) => {
      if (key === 'flomoApiEndpoint') return null
      if (key === 'flomoTags') return '#English/vocabulary'
      return null
    })

    const result = await syncToFlomo('hello', '详解内容')
    expect(result).toEqual({
      success: false,
      message: '请先在设置中配置 flomo API 端点'
    })
    expect(mockSendToFlomo).not.toHaveBeenCalled()
  })

  it('端点有效时调用 window.services.sendToFlomo 并返回成功', async () => {
    window.utools.dbStorage.getItem.mockImplementation((key) => {
      if (key === 'flomoApiEndpoint') return 'https://flomoapp.com/api/notes'
      if (key === 'flomoTags') return '#English/vocabulary'
      return null
    })
    mockSendToFlomo.mockResolvedValue({ ok: true, status: 200, body: 'ok' })

    const result = await syncToFlomo('hello', '详解内容')

    expect(result).toEqual({ success: true })
    expect(mockSendToFlomo).toHaveBeenCalledWith(
      'https://flomoapp.com/api/notes',
      {
        content: '#English/vocabulary **hello 单词详解**\n\n详解内容',
        content_type: 'markdown'
      }
    )
  })

  it('preload 返回失败时返回错误结果', async () => {
    window.utools.dbStorage.getItem.mockImplementation((key) => {
      if (key === 'flomoApiEndpoint') return 'https://flomoapp.com/api/notes'
      if (key === 'flomoTags') return '#test'
      return null
    })
    mockSendToFlomo.mockResolvedValue({ ok: false, error: 'Network error' })

    const result = await syncToFlomo('hello', '详解内容')

    expect(result).toEqual({
      success: false,
      message: '同步失败，请检查 API 端点配置'
    })
  })

  it('preload 抛出异常时返回错误结果', async () => {
    window.utools.dbStorage.getItem.mockImplementation((key) => {
      if (key === 'flomoApiEndpoint') return 'https://flomoapp.com/api/notes'
      if (key === 'flomoTags') return '#test'
      return null
    })
    mockSendToFlomo.mockRejectedValue(new Error('timeout'))

    const result = await syncToFlomo('hello', '详解内容')

    expect(result).toEqual({
      success: false,
      message: '同步失败，请检查 API 端点配置'
    })
  })
})
