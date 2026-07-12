import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownView } from './index.jsx'

describe('MarkdownView', () => {
  it('渲染加粗文本为 strong 元素', () => {
    const { container } = render(<MarkdownView content='**标题**' />)
    expect(container.querySelector('strong')).not.toBeNull()
    expect(container.querySelector('strong').textContent).toBe('标题')
  })

  it('渲染 --- 为分割线', () => {
    const { container } = render(<MarkdownView content={'段落1\n\n---\n\n段落2'} />)
    expect(container.querySelector('hr')).not.toBeNull()
  })

  it('渲染包含 7 板块标题的完整 markdown', () => {
    const md = '**1、词义解析**\n\n内容\n\n---\n\n**2、词性用法**\n\n内容'
    const { container } = render(<MarkdownView content={md} />)
    const strongs = container.querySelectorAll('strong')
    expect(strongs.length).toBeGreaterThanOrEqual(2)
    expect(container.querySelector('hr')).not.toBeNull()
  })

  it('保留纯文本段落', () => {
    const { container } = render(<MarkdownView content='这是一段普通文本' />)
    expect(container.textContent).toContain('这是一段普通文本')
  })

  it('渲染 - 开头的行转为无序列表', () => {
    const md = '- 项目1\n- 项目2\n- 项目3'
    const { container } = render(<MarkdownView content={md} />)
    expect(container.querySelector('ul')).not.toBeNull()
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(3)
    expect(items[0].textContent).toContain('项目1')
    expect(items[1].textContent).toContain('项目2')
    expect(items[2].textContent).toContain('项目3')
  })

  it('渲染嵌套缩进列表（两层）', () => {
    const md = '- 父项\n  - 子项1\n  - 子项2'
    const { container } = render(<MarkdownView content={md} />)
    const outerItems = container.querySelectorAll('.md-list-level-0 > li')
    expect(outerItems.length).toBe(1)
    expect(outerItems[0].textContent).toContain('父项')

    const innerItems = container.querySelectorAll('.md-list-level-1 > li')
    expect(innerItems.length).toBe(2)
    expect(innerItems[0].textContent).toContain('子项1')
    expect(innerItems[1].textContent).toContain('子项2')
  })

  it('渲染三层嵌套列表', () => {
    const md = '- 一级\n  - 二级\n    - 三级'
    const { container } = render(<MarkdownView content={md} />)
    expect(container.querySelector('.md-list-level-2')).not.toBeNull()
  })

  it('列表中含加粗文本', () => {
    const md = '- **意义1**：**（时间）** 描述'
    const { container } = render(<MarkdownView content={md} />)
    const strongs = container.querySelectorAll('li strong')
    expect(strongs.length).toBeGreaterThanOrEqual(2)
  })

  it('输入非字符串不报错', () => {
    const { container } = render(<MarkdownView content={null} />)
    expect(container.querySelector('.markdown-view')).not.toBeNull()
  })

  it('处理混合内容：段落 + 分割线 + 列表', () => {
    const md = `"ephemeral" 的核心含义是"短暂的"。

---

- **意义1**：**（时间）** 持续时间极短
  - 例句：The beauty is ephemeral.
  - 中文：美是短暂的。`
    const { container } = render(<MarkdownView content={md} />)
    expect(container.querySelector('hr')).not.toBeNull()
    expect(container.querySelector('ul')).not.toBeNull()
    expect(container.querySelector('p')).not.toBeNull()
  })
})
