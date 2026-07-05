import { useState, useEffect } from 'react'
import { useWordQuery } from '../use-word-query/index.js'
import { MarkdownView } from '../markdown-view/index.jsx'
import { HistoryView } from '../history-view/index.jsx'
import { getPreferredModel, setPreferredModel } from '../model-preference/index.js'
import './index.css'

const VIEW_MAIN = 'main'
const VIEW_SETTINGS = 'settings'
const VIEW_HISTORY = 'history'

// 尝试导入 HistoryView，如果失败会在这里抛出
export default function MainPage () {
  const [word, setWord] = useState('')
  const { loading, error, result, query } = useWordQuery()
  const [currentView, setCurrentView] = useState(VIEW_MAIN)
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')

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

  if (currentView === VIEW_SETTINGS) {
    return (
      <div className="main-page">
        <header className="main-header">
          <button className="back-btn" onClick={() => setCurrentView(VIEW_MAIN)}>← 返回</button>
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
        </div>
      </div>
    )
  }

  if (currentView === VIEW_HISTORY) {
    return (
      <div className="main-page">
        <header className="main-header">
          <button className="back-btn" onClick={() => setCurrentView(VIEW_MAIN)}>← 返回</button>
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
