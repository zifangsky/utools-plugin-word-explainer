import { useState, useEffect, useMemo, useCallback } from 'react'
import { getHistoryRecords, getDetailRecord } from '../query-history/index.js'
import { MarkdownView } from '../markdown-view/index.jsx'
import './index.css'

function getDb () {
  return window.utools ? window.utools.db : null
}

const TIME_OPTIONS = [
  { value: '1d', label: '1天' },
  { value: '3d', label: '3天' },
  { value: '7d', label: '7天' },
  { value: '15d', label: '15天' },
  { value: '30d', label: '30天' },
  { value: 'all', label: '全部' }
]

function formatTime (isoString) {
  try {
    const d = new Date(isoString)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${mm}-${dd} ${hh}:${min}`
  } catch {
    return isoString
  }
}

export function HistoryView () {
  const [records, setRecords] = useState([])
  const [timeFilter, setTimeFilter] = useState('7d')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detailContent, setDetailContent] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [playingWord, setPlayingWord] = useState(null)

  // 加载记录
  useEffect(() => {
    const db = getDb()
    if (!db) return
    const result = getHistoryRecords(db, timeFilter)
    setRecords(result)
    // 切换筛选时清空选中
    setSelectedId(null)
    setDetailContent(null)
  }, [timeFilter])

  // 搜索过滤（前端过滤）
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records
    const q = searchQuery.trim().toLowerCase()
    return records.filter(r => r.word.toLowerCase().includes(q))
  }, [records, searchQuery])

  // 选中单词加载详情
  const handleSelect = useCallback((record) => {
    setSelectedId(record.detailDocId)
    setLoadingDetail(true)
    setDetailContent(null)

    const db = getDb()
    if (!db) {
      setLoadingDetail(false)
      return
    }

    const doc = getDetailRecord(db, record.detailDocId)
    if (doc && doc.content) {
      setDetailContent(doc.content)
    }
    setLoadingDetail(false)
  }, [])

  const handleSearch = useCallback(() => {
    // 搜索通过 useMemo 实时过滤
  }, [])

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const handlePlay = useCallback((word, e) => {
    e.stopPropagation()
    if (!window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.onstart = () => setPlayingWord(word)
    utterance.onend = () => setPlayingWord(null)
    utterance.onerror = () => setPlayingWord(null)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [])

  return (
    <div className="history-view" data-testid="history-view">
      {/* 左栏 */}
      <div className="history-left" data-testid="history-left">
        {/* 搜索 + 筛选 */}
        <div className="history-left-header">
          <div className="history-search-row">
            <input
              type="text"
              className="history-search-input"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              data-testid="history-search-input"
            />
            <button
              className="history-search-btn"
              onClick={handleSearch}
              data-testid="history-search-btn"
            >
              搜索
            </button>
            <select
              className="history-filter-select"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              data-testid="time-filter-select"
            >
              {TIME_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        {/* 单词卡片列表 */}
        <div className="history-card-list">
          {filteredRecords.length === 0 && (
            <div className="history-empty">暂无查词记录</div>
          )}
          {filteredRecords.map((rec) => (
            <div
              key={rec.detailDocId}
              className={`history-card ${selectedId === rec.detailDocId ? 'selected' : ''}`}
              onClick={() => handleSelect(rec)}
              data-selected={selectedId === rec.detailDocId ? 'true' : 'false'}
            >
              <div className="history-card-header">
                <span className="history-card-word">{rec.word}</span>
                {rec.phonetic && <span className="history-card-phonetic">{rec.phonetic}</span>}
                <button
                  className={`history-card-play ${playingWord === rec.word ? 'playing' : ''}`}
                  title="播放读音"
                  onClick={(e) => handlePlay(rec.word, e)}
                  data-testid="history-card-play"
                >
                  ▶
                </button>
              </div>
              <div className="history-card-meanings">
                {(rec.chineseMeanings || []).join(';')}
              </div>
              <div className="history-card-time">{formatTime(rec.timestamp)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 右栏 */}
      <div className="history-right" data-testid="history-right">
        {loadingDetail && <div className="history-right-loading">加载中...</div>}
        {!loadingDetail && !detailContent && (
          <div className="history-right-placeholder">请选择一个单词查看详情</div>
        )}
        {!loadingDetail && detailContent && (
          <div className="history-right-content">
            <MarkdownView content={detailContent} />
          </div>
        )}
      </div>
    </div>
  )
}
