import { useState, useCallback } from 'react'
import { buildMessages } from '../prompt-template/index.js'
import { queryWordStream } from '../ai-call/index.js'
import { parseJsonFromContent, saveQueryRecord } from '../query-history/index.js'
import { getSaveQueryHistory } from '../history-preference/index.js'

/** 单词长度上限（与匹配指令 `maxLength` 取值一致） */
export const WORD_MAX_LENGTH = 100

/** 允许的字符集：字母、连字符、撇号（覆盖 `well-known`、`don't` 这类词） */
const WORD_CHARS_PATTERN = /^[a-z'-]+$/
/** 至少含一个字母，排除 `-`、`--`、`''` 之类无意义的纯符号输入 */
const HAS_LETTER_PATTERN = /[a-z]/

/**
 * 归一化查词输入：去除首尾空格并转为小写（首字母大写、误输空格均可正常查询）。
 * @param {string} word
 * @returns {string}
 */
export function normalizeWord (word) {
  return (word || '').trim().toLowerCase()
}

/**
 * 校验归一化后的词是否为合法英文单词：允许字母、连字符与撇号，且不超过长度上限。
 * 口径比匹配指令的纯字母正则更宽——匹配指令受 uTools 选择器约束，首页手输无此限制。
 * @param {string} word 已归一化的词
 * @returns {string} 错误提示；合法或空串时为 ''
 */
export function validateWord (word) {
  if (!word) return ''
  if (word.length > WORD_MAX_LENGTH) return `单词过长（最多 ${WORD_MAX_LENGTH} 个字符）`
  if (!WORD_CHARS_PATTERN.test(word) || !HAS_LETTER_PATTERN.test(word)) {
    return '请输入英文单词（可含连字符或撇号）'
  }
  return ''
}

export function useWordQuery () {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const query = useCallback(async (word, model) => {
    const normalized = normalizeWord(word)
    if (!normalized) return

    const invalidReason = validateWord(normalized)
    if (invalidReason) {
      setError(invalidReason)
      // 上一次的查询结果已与当前输入无关，必须一并清空
      setResult('')
      return
    }

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
