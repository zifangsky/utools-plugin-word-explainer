import { useEffect, useState } from 'react'
import MainPage from './MainPage'

export default function App () {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (window.utools) {
      window.utools.onPluginEnter(() => {
        setVisible(true)
      })
      window.utools.onPluginOut(() => {
        setVisible(false)
      })
    }
  }, [])

  if (!visible) return null

  return <MainPage />
}
