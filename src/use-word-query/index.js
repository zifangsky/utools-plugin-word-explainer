import { useState, useCallback } from 'react'
import { buildMessages } from '../prompt-template/index.js'
import { queryWordStream } from '../ai-call/index.js'
import { parseJsonFromContent, saveQueryRecord } from '../query-history/index.js'
import { getSaveQueryHistory } from '../history-preference/index.js'

/**
 * 归一化查词输入：去除首尾空格并转为小写（首字母大写、误输空格均可正常查询）。
 * @param {string} word
 * @returns {string}
 */
export function normalizeWord (word) {
  return (word || '').trim().toLowerCase()
}

export function useWordQuery () {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const query = useCallback(async (word, model) => {
    const normalized = normalizeWord(word)
    if (!normalized) return

    setLoading(true)
    setError('')
    setResult('')

    try {
      const messages = buildMessages(normalized)
      let fullContent = ''

      await queryWordStream(messages, model || undefined, (chunk) => {
        fullContent += chunk
        setResult(fullContent)
      })

      // 流式完成后，尝试提取 JSON 摘要并自动保存
      const parsed = parseJsonFromContent(fullContent)
      if (parsed) {
        const db = window.utools ? window.utools.db : null
        if (db && getSaveQueryHistory()) {
          saveQueryRecord(db, normalized, parsed.parsed.phonetic, parsed.parsed.chineseMeanings, parsed.cleanContent, model || undefined)
        }
        setResult(parsed.cleanContent)
      }
    } catch (e) {
      setError(e.message || '查询失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, result, query }
}
