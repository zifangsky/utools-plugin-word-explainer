import { useState, useCallback } from 'react'
import { buildMessages } from '../prompt-template/index.js'
import { queryWordStream } from '../ai-call/index.js'
import { parseJsonFromContent, saveQueryRecord } from '../query-history/index.js'

export function useWordQuery () {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const query = useCallback(async (word, model) => {
    const trimmed = (word || '').trim()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setResult('')

    try {
      const messages = buildMessages(trimmed)
      let fullContent = ''

      await queryWordStream(messages, model || undefined, (chunk) => {
        fullContent += chunk
        setResult(fullContent)
      })

      // 流式完成后，尝试提取 JSON 摘要并自动保存
      const parsed = parseJsonFromContent(fullContent)
      if (parsed) {
        const db = window.utools ? window.utools.db : null
        if (db) {
          saveQueryRecord(db, trimmed, parsed.parsed.phonetic, parsed.parsed.chineseMeanings, parsed.cleanContent, model || undefined)
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
