import { describe, it, expect } from 'vitest'
import { buildMessages } from './index.js'

describe('buildMessages', () => {
  it('返回包含单条 user 消息的数组', () => {
    const messages = buildMessages('ephemeral')
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
  })

  it('消息内容包含要查询的单词', () => {
    const messages = buildMessages('serendipity')
    expect(messages[0].content).toContain('serendipity')
  })

  it('消息内容包含 7 板块格式要求', () => {
    const messages = buildMessages('test')
    const content = messages[0].content
    const sections = ['词义解析', '词性用法', '语境应用', '常见搭配', '词源故事', '记忆技巧', '同义词辨析']
    for (const section of sections) {
      expect(content).toContain(section)
    }
  })

  it('消息内容包含输出格式约束', () => {
    const messages = buildMessages('test')
    const content = messages[0].content
    expect(content).toContain('---')
    expect(content).toContain('**')
  })

  it('消息内容包含结构化 JSON 摘要输出指令', () => {
    const messages = buildMessages('test')
    const content = messages[0].content
    expect(content).toContain('===JSON===')
    expect(content).toContain('"word"')
    expect(content).toContain('"phonetic"')
    expect(content).toContain('"chineseMeanings"')
  })
})
