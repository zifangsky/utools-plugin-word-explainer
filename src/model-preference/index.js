const STORAGE_KEY = 'preferredModel'

export function getPreferredModel () {
  return window.utools.dbStorage.getItem(STORAGE_KEY) || null
}

export function setPreferredModel (modelId) {
  window.utools.dbStorage.setItem(STORAGE_KEY, modelId)
}
