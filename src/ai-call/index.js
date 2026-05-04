export function createAiAdapter (client) {
  async function queryWord (messages, model) {
    const option = { messages }
    if (model) {
      option.model = model
    }
    const result = await client.ai(option)
    return result.content || ''
  }

  async function queryWordStream (messages, model, onChunk) {
    const option = { messages }
    if (model) {
      option.model = model
    }

    await client.ai(option, (chunk) => {
      if (chunk && chunk.content) {
        onChunk(chunk.content)
      }
    })
  }

  return { queryWord, queryWordStream }
}

const defaultAdapter = typeof window !== 'undefined' && window.utools
  ? createAiAdapter(window.utools)
  : createAiAdapter({ ai: () => Promise.resolve({ content: '' }) })

export const queryWord = (messages, model) => defaultAdapter.queryWord(messages, model)
export const queryWordStream = (messages, model, onChunk) => defaultAdapter.queryWordStream(messages, model, onChunk)
