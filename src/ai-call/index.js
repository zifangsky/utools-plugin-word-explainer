export async function queryWord (messages, model) {
  const option = { messages }
  if (model) {
    option.model = model
  }
  const result = await window.utools.ai(option)
  return result.content || ''
}

export async function queryWordStream (messages, model, onChunk) {
  const option = { messages }
  if (model) {
    option.model = model
  }

  await window.utools.ai(option, (chunk) => {
    if (chunk && chunk.content) {
      onChunk(chunk.content)
    }
  })
}
