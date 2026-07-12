import { useState, useEffect } from 'react'
import { useWordQuery } from '../use-word-query/index.js'
import { MarkdownView } from '../markdown-view/index.jsx'
import { HistoryView } from '../history-view/index.jsx'
import { getPreferredModel, setPreferredModel } from '../model-preference/index.js'
import { getSaveQueryHistory, setSaveQueryHistory } from '../history-preference/index.js'
import './index.css'

const VIEW_MAIN = 'main'
const VIEW_SETTINGS = 'settings'
const VIEW_HISTORY = 'history'

function BackIcon () {
  return (
    <svg
      className="back-icon"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
    >
      <path d="M631.04 161.941333a42.666667 42.666667 0 0 1 63.061333 57.386667l-2.474666 2.730667-289.962667 292.245333 289.706667 287.402667a42.666667 42.666667 0 0 1 2.730666 57.6l-2.474666 2.752a42.666667 42.666667 0 0 1-57.6 2.709333l-2.752-2.474667-320-317.44a42.666667 42.666667 0 0 1-2.709334-57.6l2.474667-2.752 320-322.56z" />
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

  useEffect(() => {
    const preferred = getPreferredModel()
    if (preferred) setSelectedModel(preferred)

    if (window.utools && window.utools.allAiModels) {
      window.utools.allAiModels().then(list => {
        setModels(list || [])
      }).catch(() => {})
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

  if (currentView === VIEW_SETTINGS) {
    return (
      <div className="main-page">
        <header className="main-header">
          <button className="back-btn" onClick={() => setCurrentView(VIEW_MAIN)}>
            <BackIcon />
            返回
          </button>
        </header>
        <div className="settings-panel">
          <h1 className="settings-title">设置</h1>
          <label className="setting-label">AI 模型选择</label>
          <select
            className="model-select"
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
          >
            <option value="">默认模型</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}{m.description ? ` — ${m.description}` : ''}
              </option>
            ))}
          </select>
          <p className="setting-hint">选择用于生成单词解释的 AI 模型，偏好自动保存</p>
          <div className="setting-row">
            <label className="setting-label">保存查词历史记录</label>
            <label className="save-history-switch">
              <input
                type="checkbox"
                checked={saveEnabled}
                onChange={handleToggleSave}
                data-testid="save-history-toggle"
              />
              <span className="slider" />
            </label>
          </div>
          <p className="setting-hint">关闭后将不再自动保存新的查词记录（已有记录保留）</p>
        </div>
      </div>
    )
  }

  if (currentView === VIEW_HISTORY) {
    return (
      <div className="main-page">
        <header className="main-header">
          <button className="back-btn" onClick={() => setCurrentView(VIEW_MAIN)}>
            <BackIcon />
            返回
          </button>
        </header>
        <HistoryView />
      </div>
    )
  }

  return (
    <div className="main-page">
      <header className="main-header">
        <h1>英语单词详解</h1>
        <div className="header-actions">
          <button className="history-btn" onClick={() => setCurrentView(VIEW_HISTORY)} title="查词历史">📖</button>
          <button className="gear-btn" onClick={() => setCurrentView(VIEW_SETTINGS)} title="设置">⚙</button>
        </div>
      </header>
      <div className="search-bar">
        <input
          type="text"
          placeholder="输入英文单词..."
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
        />
        <button onClick={handleQuery} disabled={loading}>
          {loading ? '查询中...' : '查询'}
        </button>
      </div>
      <div className="result-area">
        {error && <div className="error-msg">{error}</div>}
        {result && (
          <div className="result-content">
            <MarkdownView content={result} />
          </div>
        )}
      </div>
    </div>
  )
}
