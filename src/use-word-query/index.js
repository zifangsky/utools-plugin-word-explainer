import { useState, useCallback } from 'react'
import { buildMessages } from '../prompt-template/index.js'
import { queryWordStream } from '../ai-call/index.js'

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
    } catch (e) {
      setError(e.message || '查询失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, result, query }
}
