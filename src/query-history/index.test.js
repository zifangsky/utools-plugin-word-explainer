import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseJsonFromContent,
  saveQueryRecord,
  getHistoryRecords,
  getDetailRecord
} from './index.js'

// --- parseJsonFromContent ---

describe('parseJsonFromContent', () => {
  it('提取 ===JSON=== 标记后的 JSON 并返回剥离后的内容', () => {
    const input = `**hello** /həˈləʊ/ (英)

**1、词义解析**
- 中文：你好
- 中文：喂

===JSON===
{"word":"hello","phonetic":"həˈləʊ","chineseMeanings":["你好","喂"]}`
    const result = parseJsonFromContent(input)
    expect(result).not.toBeNull()
    expect(result.parsed.word).toBe('hello')
    expect(result.parsed.phonetic).toBe('həˈləʊ')
    expect(result.parsed.chineseMeanings).toEqual(['你好', '喂'])
    expect(result.cleanContent).not.toContain('===JSON===')
    expect(result.cleanContent).toContain('**hello**')
    expect(result.cleanContent).toContain('中文：你好')
  })

  it('无 ===JSON=== 标记时返回 null 和原内容', () => {
    const input = '**hello** /həˈləʊ/ (英)\n\n一些解释内容'
    const result = parseJsonFromContent(input)
    expect(result).toBeNull()
  })

  it('===JSON=== 后 JSON 格式异常时返回 null 和原内容', () => {
    const input = 'some content\n\n===JSON===\n{invalid json!!!}'
    const result = parseJsonFromContent(input)
    expect(result).toBeNull()
  })

  it('===JSON=== 后没有内容时返回 null', () => {
    const input = 'some content\n\n===JSON==='
    const result = parseJsonFromContent(input)
    expect(result).toBeNull()
  })

  it('空字符串输入返回 null', () => {
    expect(parseJsonFromContent('')).toBeNull()
  })
})

// --- saveQueryRecord / getHistoryRecords / getDetailRecord ---

function createMockDb () {
  const store = new Map()
  return {
    get: vi.fn((id) => store.get(id) ?? null),
    put: vi.fn((doc) => {
      // 记录 _rev 供后续 get 返回
      const existing = store.get(doc._id) ?? {}
      const rev = existing._rev ? String(Number(existing._rev) + 1) : '1'
      const saved = { ...doc, _rev: rev }
      store.set(doc._id, saved)
      return { ok: true, id: doc._id, rev }
    }),
    remove: vi.fn((doc) => {
      const id = typeof doc === 'string' ? doc : doc._id
      store.delete(id)
      return { ok: true, id }
    }),
    allDocs: vi.fn((prefix) => {
      const docs = []
      for (const [id, doc] of store) {
        if (typeof prefix === 'string' && !id.startsWith(prefix)) continue
        docs.push(doc)
      }
      return docs
    }),
    // test helper
    _store: store,
    _setDoc (doc) {
      store.set(doc._id, doc)
    }
  }
}

beforeEach(() => {
  vi.resetModules()
})

describe('saveQueryRecord / getHistoryRecords / getDetailRecord', () => {
  it('首次保存时创建 history_summary 和 detail 文档', () => {
    const mockDb = createMockDb()
    const { detailDocId } = saveQueryRecord(mockDb, 'hello', 'həˈləʊ', ['你好', '喂'], 'full content here', 'model-x')

    // 验证 detail 文档被创建
    expect(mockDb.put).toHaveBeenCalled()
    const detailPut = mockDb.put.mock.calls.find(c => c[0]._id && c[0]._id.startsWith('detail/'))
    expect(detailPut).toBeDefined()
    expect(detailPut[0].word).toBe('hello')
    expect(detailPut[0].content).toBe('full content here')
    expect(detailPut[0].model).toBe('model-x')

    // 验证 history_summary 被创建
    const summaryPut = mockDb.put.mock.calls.find(c => c[0]._id === 'history_summary')
    expect(summaryPut).toBeDefined()
    expect(summaryPut[0].records).toHaveLength(1)
    expect(summaryPut[0].records[0].word).toBe('hello')
    expect(summaryPut[0].records[0].detailDocId).toBe(detailDocId)
  })

  it('同词再次查询时覆盖已有记录并移至最前', () => {
    const mockDb = createMockDb()
    const ts1 = '2026-06-18T10:00:00.000Z'
    const oldDetailId = `detail/${ts1}_hello`

    // 预先创建 history_summary 包含 hello
    mockDb._setDoc({
      _id: 'history_summary',
      _rev: '1',
      records: [
        { word: 'hello', phonetic: '/həˈləʊ/', chineseMeanings: ['你好'], timestamp: ts1, detailDocId: oldDetailId },
        { word: 'world', phonetic: '/wɜːld/', chineseMeanings: ['世界'], timestamp: '2026-06-17T10:00:00.000Z', detailDocId: 'detail/ts_world' }
      ]
    })
    // 预先创建旧 detail doc
    mockDb._setDoc({ _id: oldDetailId, _rev: '1', word: 'hello', content: 'old content' })

    saveQueryRecord(mockDb, 'hello', '/həˈləʊ/', ['你好', '喂'], 'new content', 'model-y')

    // 验证旧的 detail doc 被删除
    expect(mockDb.remove).toHaveBeenCalledWith(expect.objectContaining({ _id: oldDetailId }))

    // 验证新的 detail doc 被创建
    const newDetailCalls = mockDb.put.mock.calls.filter(c => c[0]._id && c[0]._id.startsWith('detail/') && c[0].content === 'new content')
    expect(newDetailCalls.length).toBeGreaterThanOrEqual(1)

    // 验证 history_summary 中 hello 在第一条，且 timestamp 更新
    const summaryCalls = mockDb.put.mock.calls.filter(c => c[0]._id === 'history_summary')
    const latestSummary = summaryCalls[summaryCalls.length - 1][0]
    expect(latestSummary.records[0].word).toBe('hello')
    expect(latestSummary.records[0].timestamp).not.toBe(ts1)
    expect(latestSummary.records[0].chineseMeanings).toEqual(['你好', '喂'])
    // world 在第二位
    expect(latestSummary.records[1].word).toBe('world')
    expect(latestSummary.records).toHaveLength(2)
  })

  it('超过 5000 条时删除最旧的摘要和对应的 detail 文档', () => {
    const mockDb = createMockDb()
    const records = []
    for (let i = 0; i < 5000; i++) {
      const ts = new Date(2026, 0, i + 1).toISOString()
      records.push({
        word: `word${i}`,
        phonetic: '/test/',
        chineseMeanings: [`含义${i}`],
        timestamp: ts,
        detailDocId: `detail/${ts}_word${i}`
      })
      mockDb._setDoc({ _id: `detail/${ts}_word${i}`, _rev: '1', word: `word${i}`, content: 'x' })
    }
    // 模拟真实 DB 顺序：最新在前（与 saveQueryRecord 存储顺序一致）
    records.reverse()
    mockDb._setDoc({ _id: 'history_summary', _rev: '1', records })

    saveQueryRecord(mockDb, 'newword', '/new/', ['新词'], 'new content', 'model-z')

    // 验证 history_summary 仍为 5000 条
    const summaryCalls = mockDb.put.mock.calls.filter(c => c[0]._id === 'history_summary')
    const latestSummary = summaryCalls[summaryCalls.length - 1][0]
    expect(latestSummary.records).toHaveLength(5000)

    // 验证第一条是 newword（最新），最后一条不是 word0（最旧的被删除）
    expect(latestSummary.records[0].word).toBe('newword')
    const lastWord = latestSummary.records[4999].word
    expect(lastWord).not.toBe('word0')
    expect(lastWord).toBe('word1') // word0 被移除，word1 变成最末

    // 验证最旧的 detail 文档被删除（使用动态时间戳避免时区偏移）
    const oldestTs = new Date(2026, 0, 1).toISOString()
    expect(mockDb.remove).toHaveBeenCalledWith(expect.objectContaining({ _id: `detail/${oldestTs}_word0` }))
  })

  it('getHistoryRecords 返回全部记录', () => {
    const mockDb = createMockDb()
    mockDb._setDoc({
      _id: 'history_summary',
      _rev: '1',
      records: [
        { word: 'hello', timestamp: '2026-06-18T10:00:00.000Z' },
        { word: 'world', timestamp: '2026-06-17T10:00:00.000Z' }
      ]
    })

    const records = getHistoryRecords(mockDb, 'all')
    expect(records).toHaveLength(2)
    expect(records[0].word).toBe('hello')
  })

  it('getHistoryRecords 按时间筛选 7d', () => {
    const mockDb = createMockDb()
    const now = Date.now()
    const oneDay = 86400000
    mockDb._setDoc({
      _id: 'history_summary',
      _rev: '1',
      records: [
        { word: 'recent', timestamp: new Date(now).toISOString() },
        { word: 'old', timestamp: new Date(now - 10 * oneDay).toISOString() },
        { word: 'weekold', timestamp: new Date(now - 5 * oneDay).toISOString() }
      ]
    })

    const records = getHistoryRecords(mockDb, '7d')
    expect(records).toHaveLength(2)
    expect(records[0].word).toBe('recent')
    expect(records[1].word).toBe('weekold')
  })

  it('getHistoryRecords 无 history_summary 时返回空数组', () => {
    const mockDb = createMockDb()
    const records = getHistoryRecords(mockDb, 'all')
    expect(records).toEqual([])
  })

  it('getDetailRecord 返回指定文档', () => {
    const mockDb = createMockDb()
    mockDb._setDoc({ _id: 'detail/ts_hello', _rev: '1', word: 'hello', content: 'full content' })

    const doc = getDetailRecord(mockDb, 'detail/ts_hello')
    expect(doc).not.toBeNull()
    expect(doc.word).toBe('hello')
    expect(doc.content).toBe('full content')
  })

  it('getDetailRecord 文档不存在时返回 null', () => {
    const mockDb = createMockDb()
    expect(getDetailRecord(mockDb, 'detail/nonexistent')).toBeNull()
  })
})
