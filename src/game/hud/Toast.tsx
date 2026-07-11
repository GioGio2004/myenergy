import { useEffect } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'

// Fallback surface for engine rejections (UI normally disables illegal actions
// with the reason shown). Timer clears UI state only — never game state.
export function Toast() {
  const { lang, lastRejection, clearRejection } = useStore()
  useEffect(() => {
    if (!lastRejection) return
    const id = setTimeout(clearRejection, 2600)
    return () => clearTimeout(id)
  }, [lastRejection, clearRejection])
  if (!lastRejection) return null
  return <div className="toast">⚠️ {t(lastRejection, lang)}</div>
}
