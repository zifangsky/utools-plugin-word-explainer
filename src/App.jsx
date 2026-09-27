import { useEffect, useState } from 'react'
import MainPage from './main-page'

export default function App () {
  const [visible, setVisible] = useState(true)
  const [enterAction, setEnterAction] = useState(null)

  useEffect(() => {
    if (window.utools) {
      window.utools.onPluginEnter((action) => {
        setEnterAction(action)
        setVisible(true)
      })
      window.utools.onPluginOut(() => {
        setVisible(false)
      })
    }
  }, [])

  if (!visible) return null

  return <MainPage enterAction={enterAction} />
}
