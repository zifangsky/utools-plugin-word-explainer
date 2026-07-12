const STORAGE_KEY = 'saveQueryHistory'

export function getSaveQueryHistory () {
  const dbStorage = window.utools && window.utools.dbStorage
  const val = dbStorage ? dbStorage.getItem(STORAGE_KEY) : null
  if (val === null || val === undefined) return true
  return val === true || val === 'true'
}

export function setSaveQueryHistory (enabled) {
  const dbStorage = window.utools && window.utools.dbStorage
  if (dbStorage) {
    dbStorage.setItem(STORAGE_KEY, enabled)
  }
}
