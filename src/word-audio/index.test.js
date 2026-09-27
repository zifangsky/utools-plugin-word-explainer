import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWordAudio } from './index.js'

// 记录被朗读的文本，供断言使用
let spoken

function setupSpeech () {
  spoken = []
  globalThis.SpeechSynthesisUtterance = class {
    constructor (text) {
      this.text = text
      spoken.push(this)
    }
  }
  globalThis.window = {
    ...globalThis.window,
    speechSynthesis: {
      speak: vi.fn(),
      cancel: vi.fn()
    }
  }
  return globalThis.window.speechSynthesis
}

describe('useWordAudio', () => {
  let synth

  beforeEach(() => {
    synth = setupSpeech()
  })

  it('初始 playingWord 为 null', () => {
    const { result } = renderHook(() => useWordAudio())
    expect(result.current.playingWord).toBeNull()
    expect(typeof result.current.play).toBe('function')
  })

  it('播放时以 en-US 朗读该单词，先 cancel 再 speak', () => {
    const { result } = renderHook(() => useWordAudio())

    act(() => {
      result.current.play('ephemeral')
    })

    expect(spoken.length).toBe(1)
    expect(spoken[0].text).toBe('ephemeral')
    expect(spoken[0].lang).toBe('en-US')
    expect(synth.speak).toHaveBeenCalledWith(spoken[0])
    expect(synth.cancel).toHaveBeenCalled()
    // cancel 必须先于 speak，避免叠音
    expect(synth.cancel.mock.invocationCallOrder[0])
      .toBeLessThan(synth.speak.mock.invocationCallOrder[0])
  })

  it('朗读开始后 playingWord 为该单词，结束后复位', () => {
    const { result } = renderHook(() => useWordAudio())

    act(() => {
      result.current.play('hello')
    })
    expect(result.current.playingWord).toBeNull()

    act(() => {
      spoken[0].onstart()
    })
    expect(result.current.playingWord).toBe('hello')

    act(() => {
      spoken[0].onend()
    })
    expect(result.current.playingWord).toBeNull()
  })

  it('朗读出错时复位 playingWord', () => {
    const { result } = renderHook(() => useWordAudio())

    act(() => {
      result.current.play('hello')
    })
    act(() => {
      spoken[0].onstart()
    })
    act(() => {
      spoken[0].onerror()
    })

    expect(result.current.playingWord).toBeNull()
  })

  it('传入事件对象时阻止冒泡（避免触发卡片选中）', () => {
    const { result } = renderHook(() => useWordAudio())
    const e = { stopPropagation: vi.fn() }

    act(() => {
      result.current.play('hello', e)
    })

    expect(e.stopPropagation).toHaveBeenCalled()
  })

  it('空单词不触发朗读', () => {
    const { result } = renderHook(() => useWordAudio())

    act(() => {
      result.current.play('')
    })

    expect(synth.speak).not.toHaveBeenCalled()
    expect(synth.cancel).not.toHaveBeenCalled()
  })

  it('环境不支持语音合成时不报错且不改变 playingWord', () => {
    globalThis.window = { ...globalThis.window, speechSynthesis: undefined }
    const { result } = renderHook(() => useWordAudio())

    expect(() => {
      act(() => {
        result.current.play('hello')
      })
    }).not.toThrow()
    expect(result.current.playingWord).toBeNull()
  })
})
