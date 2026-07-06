import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryView } from './index.jsx'
import * as queryHistory from '../query-history/index.js'

vi.mock('../query-history/index.js', () => ({
  getHistoryRecords: vi.fn(),
  getDetailRecord: vi.fn()
}))

vi.mock('../markdown-view/index.jsx', () => ({
  MarkdownView: vi.fn(({ content }) => <div data-testid="markdown-view">{content}</div>)
}))

const mockRecords = [
  { word: 'hello', phonetic: '/həˈləʊ/', chineseMeanings: ['你好', '喂'], timestamp: '2026-06-18T10:00:00.000Z', detailDocId: 'detail/ts_hello' },
  { word: 'world', phonetic: '/wɜːld/', chineseMeanings: ['世界'], timestamp: '2026-06-17T10:00:00.000Z', detailDocId: 'detail/ts_world' }
]

beforeEach(() => {
  vi.clearAllMocks()
  // 模拟 uTools 环境，使组件内的 getDb() 能返回 db 对象
  globalThis.window = {
    ...globalThis.window,
    utools: { db: {} }
  }
  queryHistory.getHistoryRecords.mockReturnValue(mockRecords)
  queryHistory.getDetailRecord.mockReturnValue(null)
})

describe('HistoryView', () => {
  it('渲染左右分栏布局', () => {
    render(<HistoryView />)
    expect(screen.getByTestId('history-view')).toBeInTheDocument()
    expect(screen.getByTestId('history-left')).toBeInTheDocument()
    expect(screen.getByTestId('history-right')).toBeInTheDocument()
  })

  it('默认加载最近 7 天的记录', () => {
    render(<HistoryView />)
    expect(queryHistory.getHistoryRecords).toHaveBeenCalledWith(expect.anything(), '7d')
  })

  it('左栏显示单词卡片列表', () => {
    render(<HistoryView />)
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('/həˈləʊ/')).toBeInTheDocument()
    expect(screen.getByText('你好;喂')).toBeInTheDocument()
    expect(screen.getByText('world')).toBeInTheDocument()
    expect(screen.getByText('/wɜːld/')).toBeInTheDocument()
  })

  it('未选中时右栏显示占位文字', () => {
    render(<HistoryView />)
    expect(screen.getByText(/请选择一个单词查看详情/)).toBeInTheDocument()
  })

  it('点击单词卡片后加载详情到右栏', () => {
    const detailDoc = { word: 'hello', content: '## 完整解释内容', timestamp: '2026-06-18T10:00:00.000Z' }
    queryHistory.getDetailRecord.mockReturnValue(detailDoc)

    render(<HistoryView />)

    fireEvent.click(screen.getByText('hello'))

    // handleSelect 是同步调用，直接断言
    expect(queryHistory.getDetailRecord).toHaveBeenCalledWith(expect.anything(), 'detail/ts_hello')

    // 右栏显示详情
    expect(screen.getByTestId('markdown-view')).toHaveTextContent('完整解释内容')
    // 占位文字消失
    expect(screen.queryByText(/请选择一个单词查看详情/)).not.toBeInTheDocument()
  })

  it('选中卡片高亮', () => {
    render(<HistoryView />)
    const card = screen.getByText('hello').closest('[data-selected]')
    expect(card).not.toBeNull()

    // 未选中时不高亮
    expect(card.getAttribute('data-selected')).toBe('false')

    // 点击后高亮
    fireEvent.click(screen.getByText('hello'))
    expect(card.getAttribute('data-selected')).toBe('true')
  })

  it('时间筛选下拉框切换时重新加载', () => {
    render(<HistoryView />)

    const select = screen.getByTestId('time-filter-select')
    fireEvent.change(select, { target: { value: '1d' } })

    expect(queryHistory.getHistoryRecords).toHaveBeenCalledWith(expect.anything(), '1d')
  })

  it('搜索框过滤单词列表', () => {
    render(<HistoryView />)

    const searchInput = screen.getByTestId('history-search-input')
    const searchBtn = screen.getByTestId('history-search-btn')

    fireEvent.change(searchInput, { target: { value: 'hello' } })
    fireEvent.click(searchBtn)

    // 只显示 hello，不显示 world
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.queryByText('world')).not.toBeInTheDocument()
  })

  it('搜索框为空时显示全部', () => {
    render(<HistoryView />)

    const searchBtn = screen.getByTestId('history-search-btn')
    fireEvent.click(searchBtn)

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('world')).toBeInTheDocument()
  })
})
