const FLOMO_ENDPOINT_KEY = 'flomoApiEndpoint'
const FLOMO_TAGS_KEY = 'flomoTags'
const DEFAULT_TAGS = '#English/vocabulary'

export function getFlomoApiEndpoint () {
  return window.utools.dbStorage.getItem(FLOMO_ENDPOINT_KEY) || ''
}

export function setFlomoApiEndpoint (endpoint) {
  window.utools.dbStorage.setItem(FLOMO_ENDPOINT_KEY, endpoint)
}

export function getFlomoTags () {
  const stored = window.utools.dbStorage.getItem(FLOMO_TAGS_KEY)
  if (stored === null) return DEFAULT_TAGS
  return stored.trim()
}

export function setFlomoTags (tags) {
  const trimmed = tags == null ? '' : tags.trim()
  window.utools.dbStorage.setItem(FLOMO_TAGS_KEY, trimmed)
}

export function buildFlomoContent (word, result, tags) {
  const tagsPrefix = tags ? tags + ' ' : ''
  return tagsPrefix + '**' + word + ' 单词详解**\n\n' + result
}

export async function syncToFlomo (word, result) {
  const endpoint = getFlomoApiEndpoint()
  if (!endpoint) {
    return { success: false, message: '请先在设置中配置 flomo API 端点' }
  }

  const tags = getFlomoTags()
  const content = buildFlomoContent(word, result, tags)

  try {
    const res = await window.services.sendToFlomo(endpoint, {
      content,
      content_type: 'markdown'
    })

    if (res.ok) {
      return { success: true }
    }

    return { success: false, message: '同步失败，请检查 API 端点配置' }
  } catch (_err) {
    return { success: false, message: '同步失败，请检查 API 端点配置' }
  }
}
