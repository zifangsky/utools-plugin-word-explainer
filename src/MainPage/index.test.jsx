import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, fireEvent, screen } from '@testing-library/react'
import MainPage from './index.jsx'

import { useWordQuery } from '../use-word-query/index.js'
import { getPreferredModel, setPreferredModel } from '../model-preference/index.js'
import { setSaveQueryHistory } from '../history-preference/index.js'

vi.mock('../use-word-query/index.js', () => ({
  useWordQuery: vi.fn()
}))

vi.mock('../model-preference/index.js', () => ({
  getPreferredModel: vi.fn(() => null),
  setPreferredModel: vi.fn()
}))

vi.mock('../history-preference/index.js', () => ({
  getSaveQueryHistory: vi.fn(() => true),
  setSaveQueryHistory: vi.fn()
}))

vi.mock('../history-view/index.jsx', () => ({
  HistoryView: () => <div data-testid='history-view-mock'>查词历史</div>
}))

function setupUseWordQuery (overrides = {}) {
  useWordQuery.mockReturnValue({
    loading: false,
    error: '',
    result: '',
    query: vi.fn(),
    ...overrides
  })
}

function setupWindowUtools () {
  globalThis.window = {
    ...globalThis.window,
    utools: {
      allAiModels: vi.fn().mockResolvedValue([]),
      onPluginEnter: vi.fn(),
      onPluginOut: vi.fn()
    }
  }
}

describe('MainPage 主界面', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupUseWordQuery()
    setupWindowUtools()
  })

  it('渲染标题和输入框', () => {
    render(<MainPage />)
    expect(screen.getByText('英语单词详解')).not.toBeNull()
    expect(screen.getByPlaceholderText('输入英文单词...')).not.toBeNull()
    expect(screen.getByText('查询')).not.toBeNull()
  })

  it('点击查询按钮触发 query 调用', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage />)
    const input = screen.getByPlaceholderText('输入英文单词...')
    fireEvent.change(input, { target: { value: 'ephemeral' } })
    fireEvent.click(screen.getByText('查询'))

    expect(query).toHaveBeenCalledWith('ephemeral', undefined)
  })

  it('空输入不触发查询', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage />)
    fireEvent.click(screen.getByText('查询'))

    expect(query).not.toHaveBeenCalled()
  })

  it('按 Enter 键触发查询', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage />)
    const input = screen.getByPlaceholderText('输入英文单词...')
    fireEvent.change(input, { target: { value: 'serendipity' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(query).toHaveBeenCalledWith('serendipity', undefined)
  })

  it('loading 时按钮禁用', () => {
    setupUseWordQuery({ loading: true })

    render(<MainPage />)
    const btn = screen.getByText('查询中...')
    expect(btn.disabled).toBe(true)
  })

  it('有 result 时渲染 MarkdownView', () => {
    setupUseWordQuery({ result: '**hello** world' })

    const { container } = render(<MainPage />)
    expect(container.querySelector('.markdown-view')).not.toBeNull()
    expect(container.querySelector('strong')).not.toBeNull()
  })

  it('有 error 时显示错误信息', () => {
    setupUseWordQuery({ error: '网络连接失败' })

    render(<MainPage />)
    expect(screen.getByText('网络连接失败')).not.toBeNull()
  })

  it('选择模型后调用 setPreferredModel', async () => {
    // 使用同步 resolve 的 mock 让 models 在首次渲染即可用
    const models = [{ id: 'model-a', label: 'Model A' }, { id: 'model-b', label: 'Model B' }]
    window.utools.allAiModels = vi.fn().mockImplementation(() => ({
      then: (cb) => { cb(models); return { catch: () => {} } }
    }))

    const { container } = render(<MainPage />)
    fireEvent.click(container.querySelector('.gear-btn'))

    // 此时 models 已经同步加载
    const select = container.querySelector('.model-select')
    fireEvent.change(select, { target: { value: 'model-b' } })

    expect(setPreferredModel).toHaveBeenCalledWith('model-b')
  })

  it('选择默认模型时清空偏好', () => {
    const { container } = render(<MainPage />)
    fireEvent.click(container.querySelector('.gear-btn'))
    const select = container.querySelector('.model-select')
    fireEvent.change(select, { target: { value: '' } })

    expect(setPreferredModel).toHaveBeenCalledWith('')
  })
})

describe('MainPage 设置面板', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupUseWordQuery()
    setupWindowUtools()
    getPreferredModel.mockReturnValue('saved-model')
  })

  it('设置页返回按钮显示 SVG 图标', () => {
    render(<MainPage />)
    fireEvent.click(screen.getByTitle('设置'))

    const backBtn = screen.getByRole('button', { name: /返回/ })
    expect(backBtn.querySelector('.back-icon')).not.toBeNull()
  })

  it('返回图标使用清理版 SVG（currentColor + viewBox 0 0 800 800 + 双 path）', () => {
    render(<MainPage />)
    fireEvent.click(screen.getByTitle('设置'))

    const backBtn = screen.getByRole('button', { name: /返回/ })
    const icon = backBtn.querySelector('.back-icon')
    expect(icon).not.toBeNull()
    expect(icon.getAttribute('viewBox')).toBe('0 0 800 800')
    expect(icon.getAttribute('fill')).toBe('currentColor')
    const paths = icon.querySelectorAll('path')
    expect(paths.length).toBe(2)
  })

  it('点击齿轮按钮切换到设置页面', () => {
    render(<MainPage />)
    fireEvent.click(screen.getByTitle('设置'))

    expect(screen.getByText('AI 模型选择')).not.toBeNull()
    expect(screen.getByText('返回')).not.toBeNull()
  })

  it('点击返回按钮回到主界面', () => {
    render(<MainPage />)
    fireEvent.click(screen.getByTitle('设置'))
    fireEvent.click(screen.getByText('返回'))

    expect(screen.getByPlaceholderText('输入英文单词...')).not.toBeNull()
  })

  it('设置页面渲染「保存查词历史记录」开关且默认开启', () => {
    render(<MainPage />)
    fireEvent.click(screen.getByTitle('设置'))

    expect(screen.getByText('保存查词历史记录')).toBeInTheDocument()
    const toggle = screen.getByTestId('save-history-toggle')
    expect(toggle).toBeChecked()
  })

  it('关闭开关时调用 setSaveQueryHistory(false)', () => {
    render(<MainPage />)
    fireEvent.click(screen.getByTitle('设置'))

    const toggle = screen.getByTestId('save-history-toggle')
    fireEvent.click(toggle)

    expect(setSaveQueryHistory).toHaveBeenCalledWith(false)
  })
})

describe('MainPage 历史面板', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupUseWordQuery()
    setupWindowUtools()
  })

  it('主界面渲染历史按钮', () => {
    render(<MainPage />)
    expect(screen.getByTitle('查词历史')).not.toBeNull()
  })

  it('点击历史按钮切换到历史面板', () => {
    render(<MainPage />)
    fireEvent.click(screen.getByTitle('查词历史'))

    expect(screen.getByTestId('history-view-mock')).not.toBeNull()
    expect(screen.getByText('返回')).not.toBeNull()
  })

  it('点击历史面板返回按钮回到主界面', () => {
    render(<MainPage />)
    fireEvent.click(screen.getByTitle('查词历史'))
    fireEvent.click(screen.getByText('返回'))

    expect(screen.getByPlaceholderText('输入英文单词...')).not.toBeNull()
  })
})
