const SUMMARY_DOC_ID = 'history_summary'
const MAX_RECORDS = 5000

/**
 * 从 AI 响应内容中提取 ===JSON=== 标记后的结构化摘要。
 * @param {string} content - AI 返回的完整 Markdown 内容
 * @returns {{ parsed: { word: string, phonetic: string, chineseMeanings: string[] }, cleanContent: string } | null}
 */
export function parseJsonFromContent (content) {
  if (!content) return null

  const marker = '===JSON==='
  const markerIndex = content.lastIndexOf(marker)
  if (markerIndex === -1) return null

  const afterMarker = content.slice(markerIndex + marker.length).trim()
  if (!afterMarker) return null

  // 尝试从 marker 后解析第一行 JSON (可能跨多行，用 tryParse 兜底)
  let jsonStr = afterMarker
  // 找到第一个 { 和最后一个 }
  const braceStart = afterMarker.indexOf('{')
  const braceEnd = afterMarker.lastIndexOf('}')
  if (braceStart === -1 || braceEnd === -1 || braceEnd <= braceStart) return null
  jsonStr = afterMarker.slice(braceStart, braceEnd + 1)

  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.word || !parsed.phonetic || !Array.isArray(parsed.chineseMeanings)) {
      return null
    }
    const cleanContent = content.slice(0, markerIndex).trimEnd()
    return { parsed, cleanContent }
  } catch {
    return null
  }
}

/**
 * 生成 ISO 时间戳格式的文档 ID。
 * 使用 UTC 时间避免本地时区偏差。
 */
function generateDetailDocId (word) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  return `detail/${ts}_${word.toLowerCase()}`
}

/**
 * 保存一条查词记录。
 * @param {object} db - utools.db 接口（或 mock）
 * @param {string} word - 单词
 * @param {string} phonetic - 音标
 * @param {string[]} chineseMeanings - 中文含义数组
 * @param {string} content - 完整解释（已剥离 JSON）
 * @param {string} [model] - AI 模型
 * @returns {{ detailDocId: string }} 详情文档 ID
 */
export function saveQueryRecord (db, word, phonetic, chineseMeanings, content, model) {
  // 1. 创建详情文档
  const detailDocId = generateDetailDocId(word)
  const detailDoc = {
    _id: detailDocId,
    word,
    content,
    timestamp: new Date().toISOString(),
    model: model || ''
  }
  db.put(detailDoc)

  // 2. 读取现有摘要文档
  let summary = db.get(SUMMARY_DOC_ID)
  let records = []

  if (summary) {
    records = [...summary.records]
    // 查找是否已存在同词记录
    const existingIndex = records.findIndex(r => r.word === word)
    if (existingIndex !== -1) {
      // 删除旧的 detail 文档
      const oldDetailId = records[existingIndex].detailDocId
      const oldDoc = oldDetailId ? db.get(oldDetailId) : null
      if (oldDoc) {
        db.remove(oldDoc)
      }
      // 移除旧记录（后面会重新插入到最前）
      records.splice(existingIndex, 1)
    }
  }

  // 3. 将新记录插入最前
  records.unshift({
    word,
    phonetic,
    chineseMeanings,
    timestamp: new Date().toISOString(),
    detailDocId
  })

  // 4. 检查上限：超过 5000 条则删除最旧的
  if (records.length > MAX_RECORDS) {
    const removed = records.splice(MAX_RECORDS, records.length - MAX_RECORDS)
    // 删除对应的 detail 文档
    for (const rec of removed) {
      const oldDoc = rec.detailDocId ? db.get(rec.detailDocId) : null
      if (oldDoc) {
        db.remove(oldDoc)
      }
    }
  }

  // 5. 写回摘要文档
  const summaryDoc = summary
    ? { ...summary, records }
    : { _id: SUMMARY_DOC_ID, records }

  db.put(summaryDoc)

  return { detailDocId }
}

/**
 * 获取查词历史记录列表。
 * @param {object} db - utools.db 接口
 * @param {string} timeFilter - 时间筛选: 1d|3d|7d|15d|30d|all
 * @returns {Array} 记录数组（按时间倒序）
 */
export function getHistoryRecords (db, timeFilter = '7d') {
  const summary = db.get(SUMMARY_DOC_ID)
  if (!summary || !summary.records) return []

  const now = Date.now()
  const timeMap = {
    '1d': 1,
    '3d': 3,
    '7d': 7,
    '15d': 15,
    '30d': 30
  }

  const days = timeMap[timeFilter]
  if (!days || timeFilter === 'all') {
    return summary.records
  }

  const cutoff = now - days * 86400000
  return summary.records.filter(r => new Date(r.timestamp).getTime() >= cutoff)
}

/**
 * 获取指定详情文档。
 * @param {object} db - utools.db 接口
 * @param {string} detailDocId - 详情文档 ID
 * @returns {object|null}
 */
export function getDetailRecord (db, detailDocId) {
  return db.get(detailDocId)
}
