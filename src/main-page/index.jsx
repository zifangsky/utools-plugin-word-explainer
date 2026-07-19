import { useState, useEffect, useRef } from 'react'
import { useWordQuery } from '../use-word-query/index.js'
import { MarkdownView } from '../markdown-view/index.jsx'
import { HistoryView } from '../history-view/index.jsx'
import { getPreferredModel, setPreferredModel } from '../model-preference/index.js'
import { getSaveQueryHistory, setSaveQueryHistory } from '../history-preference/index.js'
import {
  syncToFlomo,
  getFlomoApiEndpoint,
  getFlomoTags,
  setFlomoApiEndpoint,
  setFlomoTags
} from '../sync/index.js'
import flomoIcon from '../../assets/flomo_favicon.ico'
import './index.css'

const VIEW_MAIN = 'main'
const VIEW_SETTINGS = 'settings'
const VIEW_HISTORY = 'history'

function BackIcon () {
  return (
    <svg
      className='back-icon'
      viewBox='0 0 800 800'
      version='1.0'
      xmlns='http://www.w3.org/2000/svg'
      preserveAspectRatio='xMidYMid meet'
      width='16'
      height='16'
      fill='currentColor'
    >
      <g transform='translate(106.309616,701.457782) scale(0.075135,-0.075135)' stroke='none'>
        <path d='M4993 6800 c-24 -5 -73 -23 -110 -41 -64 -30 -117 -81 -858 -828 -936 -943 -1273 -1286 -1416 -1441 -262 -285 -290 -329 -297 -465 -5 -88 9 -145 55 -225 15 -27 282 -302 657 -680 348 -349 776 -781 952 -960 867 -881 832 -846 906 -885 359 -189 749 120 583 460 -13 28 -66 98 -116 155 -103 117 -1557 1575 -1907 1912 l-224 215 304 299 c166 165 386 380 488 480 102 99 284 277 405 395 121 118 378 369 572 558 446 434 487 483 513 619 15 75 3 149 -36 229 -33 69 -129 156 -203 184 -63 25 -198 34 -268 19z m208 -130 c100 -27 179 -135 179 -245 0 -126 1 -124 -855 -955 -191 -185 -921 -900 -1222 -1195 l-213 -210 0 -49 0 -49 183 -176 c519 -500 1623 -1600 1903 -1897 84 -88 162 -180 174 -204 70 -138 11 -282 -138 -334 l-43 -15 -77 74 -77 75 50 -2 c61 -4 71 20 15 35 -57 14 -88 69 -55 97 25 21 17 30 -27 27 -38 -2 -43 -5 -50 -34 -10 -39 -18 -41 -44 -11 -13 15 -20 35 -18 58 2 40 -10 60 -37 60 -11 0 -19 9 -21 23 -4 27 -44 32 -42 4 1 -9 -3 -17 -8 -17 -14 0 -119 106 -112 113 3 3 22 3 41 0 30 -5 35 -3 32 12 -5 23 -55 38 -82 24 -35 -20 -69 18 -91 99 -15 59 -22 72 -39 72 -17 0 -19 -4 -13 -38 4 -20 10 -55 13 -77 l5 -40 -49 52 c-27 29 -62 73 -78 98 -17 26 -37 45 -47 45 -23 0 -23 -22 2 -62 19 -32 28 -99 13 -97 -5 1 -82 79 -173 173 -91 94 -511 521 -935 950 -423 428 -780 793 -792 810 -50 74 -53 177 -8 265 49 98 483 548 1853 1923 381 382 581 575 612 592 79 43 173 52 271 26z m-767 -4763 c5 -27 4 -37 -3 -32 -6 3 -11 22 -11 42 0 44 5 41 14 -10z m112 -111 c-3 -11 0 -27 7 -35 8 -10 9 -13 1 -10 -7 2 -28 24 -48 47 -25 31 -36 53 -36 75 l1 32 40 -45 c28 -30 39 -50 35 -64z m62 41 c5 -24 -15 -21 -28 4 -10 18 -9 20 7 17 10 -2 19 -11 21 -21z m69 -69 c18 -18 33 -39 33 -47 0 -16 -54 31 -71 62 -15 27 2 20 38 -15z m-73 -14 c24 -9 59 -72 51 -92 -6 -14 -12 -11 -41 22 -19 22 -34 48 -34 58 0 20 1 21 24 12z m174 -80 c12 -8 22 -25 22 -36 0 -21 -2 -20 -30 7 -44 42 -38 62 8 29z m80 -5 c-2 -6 -8 -10 -13 -10 -5 0 -11 4 -13 10 -2 6 4 11 13 11 9 0 15 -5 13 -11z m-124 -50 c28 -33 32 -44 15 -54 -20 -13 -75 56 -62 78 8 14 21 7 47 -24z m128 -46 c24 -22 23 -35 -4 -31 -15 2 -24 11 -26 26 -4 26 5 28 30 5z m121 -17 c6 -16 -2 -28 -14 -20 -12 7 -11 34 0 34 5 0 11 -6 14 -14z m-160 -39 c13 -39 2 -45 -28 -17 -31 29 -33 53 -3 48 13 -2 25 -14 31 -31z m124 -23 c14 -13 14 -17 2 -24 -14 -9 -29 5 -29 28 0 16 8 15 27 -4z m-54 -41 c4 -20 5 -39 3 -40 -2 -2 -16 6 -30 19 -30 25 -27 58 4 58 12 0 19 -11 23 -37z m157 -58 c45 -45 51 -55 33 -55 -41 0 -153 40 -153 55 0 9 9 15 21 15 12 0 23 8 26 20 3 11 8 20 12 20 4 0 31 -25 61 -55z' />
        <path d='M4917 6415 c-9 -9 -17 -21 -17 -27 0 -6 -23 -9 -57 -7 -87 4 -183 -18 -183 -41 0 -6 26 -10 61 -10 60 0 60 0 57 -27 -2 -21 -10 -29 -35 -35 -18 -5 -40 -20 -50 -34 -14 -22 -21 -24 -55 -19 -21 4 -61 4 -88 0 -40 -6 -50 -11 -50 -26 0 -14 7 -19 25 -19 22 0 25 -4 25 -34 0 -30 -4 -35 -29 -41 -28 -6 -46 -27 -34 -39 4 -3 22 -3 40 0 31 6 33 4 33 -21 0 -30 16 -65 30 -65 5 0 10 26 12 58 l3 57 38 3 c32 3 37 0 37 -17 0 -31 27 -25 34 7 4 18 17 32 36 41 43 19 40 44 -5 39 -37 -4 -47 10 -21 31 10 9 20 9 33 3 22 -12 53 2 53 23 0 11 13 15 49 15 l50 0 3 -47 c2 -36 7 -49 20 -51 14 -3 17 6 20 50 2 44 6 53 23 56 55 8 65 13 65 33 0 20 -4 21 -45 17 l-45 -6 0 32 c0 31 2 33 52 42 39 7 54 14 56 27 3 16 -2 18 -47 16 -40 -2 -54 1 -64 15 -13 17 -14 17 -30 1z m-67 -78 c0 -2 -9 -12 -20 -22 -19 -18 -20 -17 -20 3 0 15 6 22 20 22 11 0 20 -2 20 -3z m60 -29 c0 -31 -2 -33 -36 -35 l-37 -2 34 35 c18 19 34 34 36 34 2 0 3 -15 3 -32z m-242 -145 c-5 -24 -52 -40 -72 -24 -25 21 -8 41 36 41 32 0 39 -3 36 -17z' />
      </g>
    </svg>
  )
}

// 尝试导入 HistoryView，如果失败会在这里抛出
export default function MainPage () {
  const [word, setWord] = useState('')
  const { loading, error, result, query } = useWordQuery()
  const [currentView, setCurrentView] = useState(VIEW_MAIN)
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')
  const [saveEnabled, setSaveEnabled] = useState(() => getSaveQueryHistory())
  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const [endpoint, setEndpoint] = useState(() => getFlomoApiEndpoint())
  const [tags, setTags] = useState(() => getFlomoTags())
  const timeoutRef = useRef(null)

  useEffect(() => {
    const preferred = getPreferredModel()
    if (preferred) setSelectedModel(preferred)

    if (window.utools && window.utools.allAiModels) {
      window.utools.allAiModels().then(list => {
        setModels(list || [])
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleQuery = () => {
    const trimmed = word.trim()
    if (!trimmed) return
    query(trimmed, selectedModel || undefined)
  }

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId)
    setPreferredModel(modelId)
  }

  const handleToggleSave = (e) => {
    const next = e.target.checked
    setSaveEnabled(next)
    setSaveQueryHistory(next)
  }

  const handleSyncFlomo = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setSyncStatus('syncing')
    setSyncMessage('')
    const res = await syncToFlomo(word, result)
    if (res.success) {
      setSyncStatus('success')
      timeoutRef.current = setTimeout(() => setSyncStatus('idle'), 2000)
    } else {
      setSyncStatus('error')
      setSyncMessage(res.message || '同步失败')
      timeoutRef.current = setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  if (currentView === VIEW_SETTINGS) {
    return (
      <div className='main-page'>
        <header className='main-header'>
          <button className='back-btn' onClick={() => setCurrentView(VIEW_MAIN)}>
            <BackIcon />
            返回
          </button>
        </header>
        <div className='settings-panel'>
          <h1 className='settings-title'>设置</h1>

          <div className='settings-card'>
            <h2 className='settings-card-title'>基本设置</h2>
            <label className='setting-label'>AI 模型选择</label>
            <select
              className='model-select'
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              <option value=''>默认模型</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}{m.description ? ` — ${m.description}` : ''}
                </option>
              ))}
            </select>
            <p className='setting-hint'>选择用于生成单词解释的 AI 模型，偏好自动保存</p>
            <div className='setting-row'>
              <label className='setting-label'>保存查词历史记录</label>
              <label className='save-history-switch'>
                <input
                  type='checkbox'
                  checked={saveEnabled}
                  onChange={handleToggleSave}
                  data-testid='save-history-toggle'
                />
                <span className='slider' />
              </label>
            </div>
            <p className='setting-hint'>关闭后将不再自动保存新的查词记录（已有记录保留）</p>
          </div>

          <div className='settings-card'>
            <h2 className='settings-card-title'>同步到其他笔记应用</h2>
            <label className='setting-label'>flomo API 端点</label>
            <input
              className='sync-input'
              type='text'
              placeholder='请输入 flomo API 端点'
              value={endpoint}
              onChange={(e) => { setEndpoint(e.target.value); setFlomoApiEndpoint(e.target.value) }}
            />
            <p className='setting-hint'>向 flomo 新增笔记的 API 端点地址</p>
            <label className='setting-label'>笔记标签</label>
            <input
              className='sync-input'
              type='text'
              placeholder='多个标签以空格分隔，选填'
              value={tags}
              onChange={(e) => { setTags(e.target.value); setFlomoTags(e.target.value) }}
            />
            <p className='setting-hint'>笔记最前面的标签，默认 #English/vocabulary，多个标签以空格分隔</p>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === VIEW_HISTORY) {
    return (
      <div className='main-page'>
        <header className='main-header'>
          <button className='back-btn' onClick={() => setCurrentView(VIEW_MAIN)}>
            <BackIcon />
            返回
          </button>
        </header>
        <HistoryView />
      </div>
    )
  }

  return (
    <div className='main-page'>
      <header className='main-header'>
        <h1>英语单词详解</h1>
        <div className='header-actions'>
          <button className='history-btn' onClick={() => setCurrentView(VIEW_HISTORY)} title='查词历史'>📖</button>
          <button className='gear-btn' onClick={() => setCurrentView(VIEW_SETTINGS)} title='设置'>⚙</button>
        </div>
      </header>
      <div className='search-bar'>
        <input
          type='text'
          placeholder='输入英文单词...'
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
        />
        <button onClick={handleQuery} disabled={loading}>
          {loading ? '查询中...' : '查询'}
        </button>
      </div>
      <div className='result-area'>
        {error && <div className='error-msg'>{error}</div>}
        {result && !loading && !error && (
          <div className='result-with-actions'>
            <div className='result-content'>
              <MarkdownView content={result} />
            </div>
            <div className='result-actions'>
              {endpoint && (
                <button
                  className={`sync-flomo-btn ${syncStatus}`}
                  data-testid='sync-flomo-btn'
                  onClick={handleSyncFlomo}
                  disabled={syncStatus === 'syncing'}
                  title={syncStatus === 'syncing' ? '同步中...' : syncStatus === 'success' ? '已同步' : syncStatus === 'error' ? syncMessage : '同步到 flomo'}
                >
                  <img src={flomoIcon} alt='flomo' className='sync-flomo-icon' />
                </button>
              )}
            </div>
          </div>
        )}
        {result && (loading || error) && (
          <div className='result-content'>
            <MarkdownView content={result} />
          </div>
        )}
      </div>
    </div>
  )
}
