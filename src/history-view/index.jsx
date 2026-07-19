import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
/* global SpeechSynthesisUtterance */
import { getHistoryRecords, getDetailRecord, deleteQueryRecords } from '../query-history/index.js'
import { MarkdownView } from '../markdown-view/index.jsx'
import { syncToFlomo, getFlomoApiEndpoint } from '../sync/index.js'
import flomoIcon from '../../assets/flomo_favicon.ico'
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
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [endpoint] = useState(() => getFlomoApiEndpoint())
  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const [selectedWord, setSelectedWord] = useState('')
  const timeoutRef = useRef(null)

  // 加载记录
  useEffect(() => {
    const db = getDb()
    if (!db) return
    const result = getHistoryRecords(db, timeFilter)
    setRecords(result)
    // 切换筛选时清空选中
    setSelectedId(null)
    setSelectedWord('')
    setDetailContent(null)
    setSyncStatus('idle')
    setSyncMessage('')
  }, [timeFilter])

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // 搜索过滤（前端过滤）
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records
    const q = searchQuery.trim().toLowerCase()
    return records.filter(r => r.word.toLowerCase().includes(q))
  }, [records, searchQuery])

  // 全选态：当前列表全部勾选时为真（兼容筛选/搜索变更）
  const allSelected = filteredRecords.length > 0 &&
    filteredRecords.every(r => selectedIds.has(r.detailDocId))

  // 选中单词加载详情
  const handleSelect = useCallback((record) => {
    setSelectedId(record.detailDocId)
    setSelectedWord(record.word)
    setLoadingDetail(true)
    setDetailContent(null)
    setSyncStatus('idle')
    setSyncMessage('')

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

  // 同步当前详情到 flomo
  const handleSyncFlomo = useCallback(async () => {
    if (!selectedWord || !detailContent) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setSyncStatus('syncing')
    setSyncMessage('')

    const res = await syncToFlomo(selectedWord, detailContent)
    if (res.success) {
      setSyncStatus('success')
      timeoutRef.current = setTimeout(() => setSyncStatus('idle'), 2000)
    } else {
      setSyncStatus('error')
      setSyncMessage(res.message || '同步失败')
      timeoutRef.current = setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }, [selectedWord, detailContent])

  // 勾选/取消单个卡片
  const toggleSelect = useCallback((detailDocId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(detailDocId)) next.delete(detailDocId)
      else next.add(detailDocId)
      return next
    })
  }, [])

  // 全选/取消全选当前列表
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allNow = filteredRecords.length > 0 &&
        filteredRecords.every(r => prev.has(r.detailDocId))
      if (allNow) return new Set()
      return new Set(filteredRecords.map(r => r.detailDocId))
    })
  }, [filteredRecords])

  // 批量删除（带二次确认）
  const handleDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    const ids = [...selectedIds]
    if (window.confirm(`确定删除 ${ids.length} 条记录吗？`)) {
      const db = getDb()
      if (db) {
        deleteQueryRecords(db, ids)
        const result = getHistoryRecords(db, timeFilter)
        setRecords(result)
      }
      setSelectedId(null)
      setSelectedWord('')
      setDetailContent(null)
      setSyncStatus('idle')
      setSyncMessage('')
      setSelectedIds(new Set())
    }
  }, [selectedIds, timeFilter])

  return (
    <div className='history-view' data-testid='history-view'>
      {/* 左栏 */}
      <div className='history-left' data-testid='history-left'>
        {/* 搜索 + 筛选 */}
        <div className='history-left-header'>
          <div className='history-search-row'>
            <input
              type='text'
              className='history-search-input'
              placeholder='搜索...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid='history-search-input'
            />
            <select
              className='history-filter-select'
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              data-testid='time-filter-select'
            >
              {TIME_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        {/* 单词卡片列表 */}
        <div className='history-card-list'>
          {filteredRecords.length === 0 && (
            <div className='history-empty'>暂无查词记录</div>
          )}
          {filteredRecords.map((rec) => (
            <div
              key={rec.detailDocId}
              className={`history-card ${selectedId === rec.detailDocId ? 'selected' : ''}`}
              onClick={() => handleSelect(rec)}
              data-selected={selectedId === rec.detailDocId ? 'true' : 'false'}
            >
              <div className='history-card-header'>
                <input
                  type='checkbox'
                  className='history-card-checkbox'
                  checked={selectedIds.has(rec.detailDocId)}
                  onChange={() => toggleSelect(rec.detailDocId)}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`select-${rec.detailDocId}`}
                />
                <span className='history-card-word'>{rec.word}</span>
                {rec.phonetic && <span className='history-card-phonetic'>{rec.phonetic}</span>}
                <button
                  className={`history-card-play ${playingWord === rec.word ? 'playing' : ''}`}
                  title='播放读音'
                  onClick={(e) => handlePlay(rec.word, e)}
                  data-testid='history-card-play'
                >
                  ▶
                </button>
              </div>
              <div className='history-card-meanings'>
                {(rec.chineseMeanings || []).join(';')}
              </div>
              <div className='history-card-time'>{formatTime(rec.timestamp)}</div>
            </div>
          ))}
        </div>
        {/* 底部操作栏 */}
        <div className='history-op-bar'>
          <label className='history-select-all'>
            <input
              type='checkbox'
              checked={allSelected}
              onChange={toggleSelectAll}
              data-testid='select-all-checkbox'
            />
            全选
          </label>
          <button
            className='history-del-btn'
            disabled={selectedIds.size === 0}
            onClick={handleDelete}
            data-testid='delete-selected-btn'
          >
            删除
          </button>
          <button
            className='history-practice-btn'
            disabled
            data-testid='practice-btn'
          >
            练习
          </button>
        </div>
      </div>

      {/* 右栏 */}
      <div className='history-right' data-testid='history-right'>
        {loadingDetail && <div className='history-right-loading'>加载中...</div>}
        {!loadingDetail && !detailContent && (
          <div className='history-right-placeholder'>请选择一个单词查看详情</div>
        )}
        {!loadingDetail && detailContent && (
          <div className='history-right-content' data-testid='history-right-content'>
            <div className='history-right-detail-row'>
              <div className='history-right-detail-markdown'>
                <MarkdownView content={detailContent} />
              </div>
              <div className='history-right-actions'>
                {endpoint && (
                  <button
                    className={`history-right-sync-flomo-btn ${syncStatus}`}
                    data-testid='history-sync-flomo-btn'
                    onClick={handleSyncFlomo}
                    disabled={syncStatus === 'syncing'}
                    title={syncStatus === 'syncing' ? '同步中...' : syncStatus === 'success' ? '已同步' : syncStatus === 'error' ? syncMessage : '同步到 flomo'}
                  >
                    <img src={flomoIcon} alt='flomo' className='sync-flomo-icon' />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
