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
 * 封装同步按钮的状态机、网络调用和定时器生命周期。
 *
 * @param {string} word - 当前单词
 * @param {string} content - 详解正文
 * @returns {{ endpoint, syncStatus, syncMessage, handleSync, resetSync, buildTitle }}
 */
export function useFlomoSync (word, content) {
  const endpointRef = useRef(null)
  if (endpointRef.current === null) {
    endpointRef.current = safeGetEndpoint()
  }

  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const timeoutRef = useRef(null)
  const wordRef = useRef(word)
  const contentRef = useRef(content)
  wordRef.current = word
  contentRef.current = content

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleSync = useCallback(async () => {
    const w = wordRef.current
    const c = contentRef.current
    if (!w || !c) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setSyncStatus('syncing')
    setSyncMessage('')

    const res = await syncToFlomo(w, c)
    if (res.success) {
      setSyncStatus('success')
      timeoutRef.current = setTimeout(() => setSyncStatus('idle'), 2000)
    } else {
      setSyncStatus('error')
      setSyncMessage(res.message || '同步失败')
      timeoutRef.current = setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }, []) // 使用 ref 避免依赖 word/content 变化

  const resetSync = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setSyncStatus('idle')
    setSyncMessage('')
  }, [])

  const buildTitle = useCallback(() => {
    if (syncStatus === 'syncing') return '同步中...'
    if (syncStatus === 'success') return '已同步'
    if (syncStatus === 'error') return syncMessage || '同步失败'
    return '同步到 flomo'
  }, [syncStatus, syncMessage])

  return {
    endpoint: endpointRef.current,
    syncStatus,
    syncMessage,
    handleSync,
    resetSync,
    buildTitle
  }
}
