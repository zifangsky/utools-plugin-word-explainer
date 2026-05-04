import { useState, useEffect } from 'react'
import { useWordQuery } from '../use-word-query/index.js'
import { MarkdownView } from '../markdown-view/index.jsx'
import { getPreferredModel, setPreferredModel } from '../model-preference/index.js'
import './index.css'

export default function MainPage () {
  const [word, setWord] = useState('')
  const { loading, error, result, query } = useWordQuery()
  const [showSettings, setShowSettings] = useState(false)
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

  if (showSettings) {
    return (
      <div className="main-page">
        <header className="main-header">
          <button className="back-btn" onClick={() => setShowSettings(false)}>← 返回</button>
          <h1>设置</h1>
        </header>
        <div className="settings-panel">
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

  return (
    <div className="main-page">
      <header className="main-header">
        <h1>英语单词详解</h1>
        <button className="gear-btn" onClick={() => setShowSettings(true)} title="设置">⚙</button>
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
