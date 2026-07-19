import { useState, useRef, useEffect, useCallback } from 'react'
import { syncToFlomo, getFlomoApiEndpoint } from './index.js'

function safeGetEndpoint () {
  try {
    return getFlomoApiEndpoint()
  } catch (_) {
    return ''
  }
}

/**
 * flomo 同步状态管理 Hook
 *
 * @param {string} word - 当前单词
 * @param {string} content - 详解正文
 * @returns {{ endpoint, syncStatus, syncMessage, handleSync, resetSync }}
 */
export function useFlomoSync (word, content) {
  const endpointRef = useRef(null)
  if (endpointRef.current === null) {
    endpointRef.current = safeGetEndpoint()
  }

  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // 纯闭包捕获 word/content — 与 main-page 内联代码模式完全一致
  const handleSync = async () => {
    if (!word || !content) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setSyncStatus('syncing')
    setSyncMessage('')

    const res = await syncToFlomo(word, content)
    if (res.success) {
      setSyncStatus('success')
      timeoutRef.current = setTimeout(() => setSyncStatus('idle'), 2000)
    } else {
      setSyncStatus('error')
      setSyncMessage(res.message || '同步失败')
      timeoutRef.current = setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  const resetSync = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setSyncStatus('idle')
    setSyncMessage('')
  }, [])

  return {
    endpoint: endpointRef.current,
    syncStatus,
    syncMessage,
    handleSync,
    resetSync
  }
}
