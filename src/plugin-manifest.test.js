import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// 路径相对项目根（vitest 的 cwd 即 vite.config 所在目录）
const manifest = JSON.parse(readFileSync('public/plugin.json', 'utf8'))

// 解析 "/body/flags" 形式的正则字面量字符串（uTools 要求 exclude 为该形式）
function parseRegexLiteral (literal) {
  const matched = /^\/(.+)\/([gimuy]*)$/.exec(literal)
  if (!matched) throw new Error(`不是合法的正则字面量: ${literal}`)
  return new RegExp(matched[1], matched[2])
}

const wordMatchFeature = manifest.features.find((f) => f.code === 'wordMatch')
const overCmd = wordMatchFeature.cmds.find(
  (cmd) => typeof cmd === 'object' && cmd.type === 'over'
)

// uTools 侧 over 型的实际判定：长度落在 [minLength, maxLength] 且未被 exclude 命中
function overHits (text) {
  if (text.length < overCmd.minLength || text.length > overCmd.maxLength) return false
  return !parseRegexLiteral(overCmd.exclude).test(text)
}

// features[].cmds 中的字符串关键词 —— 由 uTools 按「不区分大小写的精确等值」匹配
const featureKeywords = manifest.features
  .flatMap((f) => f.cmds)
  .filter((cmd) => typeof cmd === 'string')

describe('plugin.json — wordMatch 匹配指令', () => {
  it('over 指令存在，长度区间为 2~100', () => {
    expect(overCmd).toBeDefined()
    expect(overCmd.label).toBe('单词详解')
    expect(overCmd.minLength).toBe(2)
    expect(overCmd.maxLength).toBe(100)
  })

  it('exclude 为合法的正则字面量', () => {
    expect(() => parseRegexLiteral(overCmd.exclude)).not.toThrow()
  })

  describe('与功能指令关键词不重叠（避免候补出现重复条目）', () => {
    it('cmds 中每个纯 ASCII 关键词都被 exclude 排除', () => {
      const asciiKeywords = featureKeywords.filter((kw) => /^[a-zA-Z]+$/.test(kw))
      expect(asciiKeywords.length).toBeGreaterThan(0)

      for (const keyword of asciiKeywords) {
        expect(
          overHits(keyword),
          `功能指令关键词「${keyword}」会同时命中匹配指令，候补将出现两条；须将其加入 exclude`
        ).toBe(false)
      }
    })

    it('关键词的大小写变体同样被排除（功能指令为不区分大小写匹配）', () => {
      for (const keyword of ['explain', 'word', 'vocabulary']) {
        const variants = [keyword.toUpperCase(), keyword[0].toUpperCase() + keyword.slice(1)]
        for (const variant of variants) {
          expect(overHits(variant), `${variant} 应与 ${keyword} 一致被排除`).toBe(false)
        }
      }
    })

    it('非 ASCII 关键词由通配的非字母规则覆盖', () => {
      for (const keyword of featureKeywords.filter((kw) => !/^[a-zA-Z]+$/.test(kw))) {
        expect(overHits(keyword), `关键词「${keyword}」应被非字母规则排除`).toBe(false)
      }
    })
  })

  describe('普通单词仍触发匹配指令', () => {
    it.each(['ephemeral', 'hello', 'ab', 'a'.repeat(100)])('%s 触发', (word) => {
      expect(overHits(word)).toBe(true)
    })
  })

  describe('边界与非字母输入不触发', () => {
    it.each(['a', 'I', '', 'a'.repeat(101), '你好', '查词', 'hello world', 'abc123', 'well-known', ' words'])(
      '%s 不触发',
      (text) => {
        expect(overHits(text)).toBe(false)
      }
    )
  })
})
