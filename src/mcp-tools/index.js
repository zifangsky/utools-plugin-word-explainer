import { buildMessages } from '../prompt-template/index.js'

export function createExplainWordHandler (aiClient, modelPreference) {
  return async function explainWord (params, ctx) {
    const raw = typeof params.word === 'string' ? params.word : ''
    const word = raw.trim()
    if (!word) {
      throw new Error('请提供要查询的英文单词')
    }

    const model = modelPreference.getPreferredModel() || undefined
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
      await aiClient.queryWordStream(messages, model, (chunk) => {
        content += chunk
      })
    } finally {
      clearInterval(interval)
    }

    ctx.sendProgress?.({ progress: 100, total: 100 })

    return { word, content }
  }
}
