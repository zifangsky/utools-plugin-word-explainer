import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, fireEvent, screen, act } from '@testing-library/react'
import MainPage from './index.jsx'

import { useWordQuery } from '../use-word-query/index.js'
import { getPreferredModel, setPreferredModel } from '../model-preference/index.js'
import { setSaveQueryHistory } from '../history-preference/index.js'
import { syncToFlomo, getFlomoApiEndpoint, getFlomoTags } from '../sync/index.js'

// 保留真实的 normalizeWord（归一化契约由主界面与 Hook 共用），仅替掉 Hook
vi.mock('../use-word-query/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
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

vi.mock('../sync/index.js', () => ({
  syncToFlomo: vi.fn(),
  getFlomoApiEndpoint: vi.fn(() => ''),
  getFlomoTags: vi.fn(() => '#English/vocabulary'),
  setFlomoApiEndpoint: vi.fn(),
  setFlomoTags: vi.fn()
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
      // 同步 thenable：让「进入设置页 → 加载模型列表」在 act 内完成，避免逃逸的微任务更新
      allAiModels: vi.fn(() => {
        const models = []
        return { then: (resolve) => { resolve(models); return { catch: () => {} } } }
      }),
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

describe('MainPage 启动开销', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupUseWordQuery()
    setupWindowUtools()
    getPreferredModel.mockReturnValue(null)
  })

  it('主界面挂载时不请求 AI 模型列表（延迟到设置页）', () => {
    render(<MainPage />)

    expect(window.utools.allAiModels).not.toHaveBeenCalled()
  })

  it('主界面挂载时不读取 flomo 标签（延迟到设置页）', () => {
    render(<MainPage />)

    expect(getFlomoTags).not.toHaveBeenCalled()
  })

  it('进入设置页时才请求 AI 模型列表', () => {
    const { container } = render(<MainPage />)
    fireEvent.click(container.querySelector('.gear-btn'))

    expect(window.utools.allAiModels).toHaveBeenCalledTimes(1)
  })

  it('进入设置页时才读取 flomo 标签', () => {
    const { container } = render(<MainPage />)
    expect(getFlomoTags).not.toHaveBeenCalled()

    fireEvent.click(container.querySelector('.gear-btn'))

    expect(getFlomoTags).toHaveBeenCalledTimes(1)
  })
})

describe('MainPage flomo 同步', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupWindowUtools()
    getFlomoApiEndpoint.mockReturnValue('')
    getFlomoTags.mockReturnValue('#English/vocabulary')
    syncToFlomo.mockResolvedValue({ success: true })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('有查词结果 + 有端点 → flomo 同步按钮可见', () => {
    setupUseWordQuery({ result: '详解内容' })
    getFlomoApiEndpoint.mockReturnValue('https://flomoapp.com/api/notes')

    render(<MainPage />)
    expect(screen.getByTestId('sync-flomo-btn')).toBeInTheDocument()
  })

  it('有查词结果 + 无端点 → flomo 同步按钮不可见', () => {
    setupUseWordQuery({ result: '详解内容' })
    getFlomoApiEndpoint.mockReturnValue('')

    render(<MainPage />)
    expect(screen.queryByTestId('sync-flomo-btn')).not.toBeInTheDocument()
  })

  it('有查词结果 + loading 状态 → 同步按钮不可见', () => {
    setupUseWordQuery({ loading: true, result: '' })
    getFlomoApiEndpoint.mockReturnValue('https://flomoapp.com/api/notes')

    render(<MainPage />)
    expect(screen.queryByTestId('sync-flomo-btn')).not.toBeInTheDocument()
  })

  it('点击同步按钮 → syncToFlomo 被调用，按钮进入 syncing 态', async () => {
    setupUseWordQuery({ result: '详解内容' })
    getFlomoApiEndpoint.mockReturnValue('https://flomoapp.com/api/notes')

    // 延迟 resolve 让 syncing 状态可观测
    let resolveSync
    syncToFlomo.mockReturnValue(new Promise((resolve) => { resolveSync = resolve }))

    render(<MainPage />)
    fireEvent.change(screen.getByPlaceholderText('输入英文单词...'), { target: { value: 'test' } })
    const btn = screen.getByTestId('sync-flomo-btn')
    fireEvent.click(btn)

    expect(syncToFlomo).toHaveBeenCalledWith('test', '详解内容')
    expect(btn).toHaveClass('syncing')
    expect(screen.getByTestId('sync-status-text')).toHaveTextContent('同步中...')

    // resolve
    await act(async () => {
      resolveSync({ success: true })
    })
  })

  it('syncToFlomo 返回 success → 按钮短暂变绿后恢复', async () => {
    setupUseWordQuery({ result: '详解内容' })
    getFlomoApiEndpoint.mockReturnValue('https://flomoapp.com/api/notes')
    syncToFlomo.mockResolvedValue({ success: true })

    render(<MainPage />)
    fireEvent.change(screen.getByPlaceholderText('输入英文单词...'), { target: { value: 'test' } })
    fireEvent.click(screen.getByTestId('sync-flomo-btn'))

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // 2s 后恢复 idle，状态文字消失
    const btn = screen.getByTestId('sync-flomo-btn')
    expect(btn).toHaveClass('idle')
    expect(screen.queryByTestId('sync-status-text')).not.toBeInTheDocument()
  })

  it('syncToFlomo 返回 error → 按钮变红 + 显示错误消息，3s 后恢复', async () => {
    setupUseWordQuery({ result: '详解内容' })
    getFlomoApiEndpoint.mockReturnValue('https://flomoapp.com/api/notes')
    syncToFlomo.mockResolvedValue({ success: false, message: '网络不通' })

    render(<MainPage />)

    fireEvent.change(screen.getByPlaceholderText('输入英文单词...'), { target: { value: 'test' } })
    fireEvent.click(screen.getByTestId('sync-flomo-btn'))

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // 3s 后恢复
    const btn = screen.getByTestId('sync-flomo-btn')
    expect(btn).toHaveClass('idle')
    expect(screen.queryByTestId('sync-status-text')).not.toBeInTheDocument()
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

  it('设置页 flomo 标签输入框默认值为 #English/vocabulary', () => {
    getFlomoTags.mockReturnValue('#English/vocabulary')

    render(<MainPage />)
    fireEvent.click(screen.getByTitle('设置'))

    const tagsInput = screen.getByPlaceholderText('多个标签以空格分隔，选填')
    expect(tagsInput).toHaveValue('#English/vocabulary')
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

describe('MainPage 匹配指令进入', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupWindowUtools()
    getPreferredModel.mockReturnValue(null)
  })

  const overAction = (payload) => ({ code: 'wordMatch', type: 'over', payload })

  it('匹配指令进入 → 输入框预填该单词并自动发起查询', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage enterAction={overAction('ephemeral')} />)

    expect(screen.getByPlaceholderText('输入英文单词...')).toHaveValue('ephemeral')
    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith('ephemeral', undefined)
  })

  it('自动查询使用已保存的模型偏好', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })
    getPreferredModel.mockReturnValue('model-x')

    render(<MainPage enterAction={overAction('serendipity')} />)

    expect(query).toHaveBeenCalledWith('serendipity', 'model-x')
  })

  it('匹配数据为空 → 不发查询', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage enterAction={overAction('')} />)

    expect(query).not.toHaveBeenCalled()
  })

  it('功能指令进入 → 不自动查询且输入框为空', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage enterAction={{ code: 'explain', type: 'text', payload: '查词' }} />)

    expect(query).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('输入英文单词...')).toHaveValue('')
  })

  it('重复进入 → 以新的匹配数据再次查询', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    const { rerender } = render(<MainPage enterAction={overAction('alpha')} />)
    expect(query).toHaveBeenLastCalledWith('alpha', undefined)

    rerender(<MainPage enterAction={overAction('beta')} />)

    expect(query).toHaveBeenLastCalledWith('beta', undefined)
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('自动查询只读取一次模型偏好（避免重复的同步存储访问）', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage enterAction={overAction('ephemeral')} />)

    expect(query).toHaveBeenCalledTimes(1)
    expect(getPreferredModel).toHaveBeenCalledTimes(1)
  })

  it('匹配指令传入首字母大写单词 → 归一化为小写后查询', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage enterAction={overAction('Hello')} />)

    expect(query).toHaveBeenCalledWith('hello', undefined)
    expect(screen.getByPlaceholderText('输入英文单词...')).toHaveValue('hello')
  })
})

describe('MainPage 输入归一化', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupUseWordQuery()
    setupWindowUtools()
  })

  it('点击查询 → 转小写并去除首尾空格，输入框同步显示归一化结果', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage />)
    const input = screen.getByPlaceholderText('输入英文单词...')
    fireEvent.change(input, { target: { value: '  Hello  ' } })
    fireEvent.click(screen.getByText('查询'))

    expect(query).toHaveBeenCalledWith('hello', undefined)
    expect(input).toHaveValue('hello')
  })

  it('按 Enter 查询同样归一化', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage />)
    const input = screen.getByPlaceholderText('输入英文单词...')
    fireEvent.change(input, { target: { value: 'Ephemeral ' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(query).toHaveBeenCalledWith('ephemeral', undefined)
    expect(input).toHaveValue('ephemeral')
  })

  it('仅空格的输入不触发查询', () => {
    const query = vi.fn()
    setupUseWordQuery({ query })

    render(<MainPage />)
    fireEvent.change(screen.getByPlaceholderText('输入英文单词...'), { target: { value: '   ' } })
    fireEvent.click(screen.getByText('查询'))

    expect(query).not.toHaveBeenCalled()
  })
})

describe('MainPage 朗读单词', () => {
  const RESULT = '**ephemeral** /ɪˈfemərəl/ (英) /ɪˈfemərəl/ (美)\n\n---\n\n**1、词义解析**\n\n内容'
  let synth
  let spoken

  function setupSpeech () {
    spoken = []
    globalThis.SpeechSynthesisUtterance = class {
      constructor (text) {
        this.text = text
        spoken.push(this)
      }
    }
    synth = { speak: vi.fn(), cancel: vi.fn() }
    globalThis.window = { ...globalThis.window, speechSynthesis: synth }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupUseWordQuery()
    setupWindowUtools()
    setupSpeech()
  })

  it('朗读按钮内联在音标行（首个段落）末尾', () => {
    setupUseWordQuery({ result: RESULT })

    const { container } = render(<MainPage />)
    const btn = screen.getByTestId('result-play-btn')
    const firstParagraph = container.querySelector('.md-paragraph')

    expect(firstParagraph.contains(btn)).toBe(true)
    expect(firstParagraph.textContent).toContain('ɪˈfemərəl')
  })

  it('无查询结果时不渲染朗读按钮', () => {
    setupUseWordQuery({ result: '' })

    render(<MainPage />)
    expect(screen.queryByTestId('result-play-btn')).not.toBeInTheDocument()
  })

  it('流式输出中音标行已渲染即可朗读', () => {
    setupUseWordQuery({ loading: true, result: RESULT })

    render(<MainPage />)
    expect(screen.getByTestId('result-play-btn')).toBeInTheDocument()
  })

  it('点击朗读 → 以查询的单词朗读', () => {
    const query = vi.fn()
    setupUseWordQuery({ query, result: RESULT })

    render(<MainPage />)
    fireEvent.change(screen.getByPlaceholderText('输入英文单词...'), { target: { value: 'ephemeral' } })
    fireEvent.click(screen.getByText('查询'))
    fireEvent.click(screen.getByTestId('result-play-btn'))

    expect(spoken.length).toBe(1)
    expect(spoken[0].text).toBe('ephemeral')
    expect(spoken[0].lang).toBe('en-US')
    expect(synth.speak).toHaveBeenCalled()
  })

  it('查询后改写输入框不影响朗读对象（仍读结果对应的单词）', () => {
    const query = vi.fn()
    setupUseWordQuery({ query, result: RESULT })

    render(<MainPage />)
    const input = screen.getByPlaceholderText('输入英文单词...')
    fireEvent.change(input, { target: { value: 'ephemeral' } })
    fireEvent.click(screen.getByText('查询'))

    // 未再次查询，仅改写输入框
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.click(screen.getByTestId('result-play-btn'))

    expect(spoken[0].text).toBe('ephemeral')
  })

  it('非法单词的查询不改变朗读对象（仍读结果对应的单词）', () => {
    const query = vi.fn()
    setupUseWordQuery({ query, result: RESULT })

    render(<MainPage />)
    const input = screen.getByPlaceholderText('输入英文单词...')
    fireEvent.change(input, { target: { value: 'ephemeral' } })
    fireEvent.click(screen.getByText('查询'))

    // 非法输入被 Hook 拒绝，屏幕结果未更新 → 朗读对象应保持上一次查询的单词
    fireEvent.change(input, { target: { value: 'hello world' } })
    fireEvent.click(screen.getByText('查询'))
    fireEvent.click(screen.getByTestId('result-play-btn'))

    expect(spoken[0].text).toBe('ephemeral')
  })
})
