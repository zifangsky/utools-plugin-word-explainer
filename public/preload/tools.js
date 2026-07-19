const { buildMessages } = require('./prompt.js')

// NOTE: preload 与 src 运行在不同运行时 (CJS vs ESM)，无法共享模块。
// getPreferredModel / queryWordStream 在此内联实现，与 src/model-preference、
// src/ai-call 语义完全一致。任一修改 MUST 同步另一侧（原则 4）。
function createExplainWordHandler () {
  const STORAGE_KEY = 'preferredModel'

  function getPreferredModel () {
    return window.utools.dbStorage.getItem(STORAGE_KEY) || null
  }

  function queryWordStream (messages, model, onChunk) {
    const option = { messages }
    if (model) option.model = model

    return new Promise((resolve, reject) => {
      window.utools.ai(option, (chunk) => {
        if (chunk && chunk.content) onChunk(chunk.content)
      }).then(resolve).catch(reject)
    })
  }

  return async function explainWord (params, ctx) {
    const raw = typeof params.word === 'string' ? params.word : ''
    const word = raw.trim()
    if (!word) {
      throw new Error('请提供要查询的英文单词')
    }

    const model = getPreferredModel() || undefined
    const messages = buildMessages(word)

    const startTime = Date.now()
    let content = ''

    const interval = setInterval(() => {
      if (!ctx.sendProgress) return
      const elapsed = Date.now() - startTime
      const progress = Math.min(Math.round(elapsed / 15000 * 100), 99)
      ctx.sendProgress({ progress, total: 100, message: '单词解释生成中...' })
    }, 2000)

    try {
      await queryWordStream(messages, model, (chunk) => {
        content += chunk
      })
    } finally {
      clearInterval(interval)
    }

    ctx.sendProgress?.({ progress: 100, total: 100 })

    return { word, content }
  }
}

window.utools.registerTool('explain_word', createExplainWordHandler())
