import { memo, useMemo } from 'react'

function renderInline (text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function renderNodes (nodes, level) {
  if (!nodes || nodes.length === 0) return null
  return (
    <ul className={`md-list md-list-level-${level}`}>
      {nodes.map((node, i) => (
        <li key={i}>
          <span className="md-li-content">{renderInline(node.content)}</span>
          {renderNodes(node.children, level + 1)}
        </li>
      ))}
    </ul>
  )
}

function renderListBlock (items) {
  // Stack-based tree builder: each list item becomes a node,
  // deeper-indented items become children of the previous item.
  const root = { children: [], indent: -2 }
  const stack = [root]

  for (const item of items) {
    const node = { content: item.content, children: [], indent: item.indent }

    while (stack.length > 0 && stack[stack.length - 1].indent >= item.indent) {
      stack.pop()
    }

    stack[stack.length - 1].children.push(node)
    stack.push(node)
  }

  return renderNodes(root.children, 0)
}

function parseBlocks (text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // --- 分割线
    if (trimmed === '---') {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // 空行
    if (trimmed === '') {
      i++
      continue
    }

    // 无序列表项：以 "- " 开头（允许前导空格表示缩进）
    const listMatch = line.match(/^(\s*)-\s+(.*)/)
    if (listMatch) {
      const items = []
      while (i < lines.length) {
        const lm = lines[i].match(/^(\s*)-\s+(.*)/)
        if (!lm) break
        items.push({ indent: lm[1].length, content: lm[2] })
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }

    // 普通段落（连续的文本行直到遇到空行、分割线或列表项）
    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      lines[i].trim() !== '---' &&
      !/^(\s*)-\s/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', lines: paraLines })
    }
  }

  return blocks
}

export const MarkdownView = memo(function MarkdownView ({ content }) {
  const text = typeof content === 'string' ? content : ''

  const elements = useMemo(() => {
    const blocks = parseBlocks(text)
    return blocks.map((block, idx) => {
      switch (block.type) {
        case 'hr':
          return <hr key={idx} className="md-hr" />

        case 'list':
          return <div key={idx} className="md-list-wrapper">{renderListBlock(block.items)}</div>

        case 'paragraph': {
          const paraText = block.lines.join('\n')
          return <p key={idx} className="md-paragraph">{renderInline(paraText)}</p>
        }

        default:
          return null
      }
    })
  }, [text])

  return <div className="markdown-view">{elements}</div>
})
