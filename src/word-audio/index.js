import { useCallback, useState } from 'react'
/* global SpeechSynthesisUtterance */

/**
 * 英文单词朗读 Hook —— 基于浏览器 SpeechSynthesis，主界面与查词历史共用。
 * @returns {{ playingWord: string|null, play: (word: string, e?: Event) => void }}
 */
export function useWordAudio () {
  const [playingWord, setPlayingWord] = useState(null)

  const play = useCallback((word, e) => {
    // 卡片内播放时阻止冒泡，避免连带触发卡片选中
    if (e && e.stopPropagation) e.stopPropagation()
    if (!word || !window.speechSynthesis) return

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.onstart = () => setPlayingWord(word)
    utterance.onend = () => setPlayingWord(null)
    utterance.onerror = () => setPlayingWord(null)
    // 先取消上一条，避免连点叠音
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [])

  return { playingWord, play }
}
