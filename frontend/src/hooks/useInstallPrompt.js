// PWA install bridge. The browser fires `beforeinstallprompt` once, early in
// the page lifecycle — often before any modal mounts — so we capture it in a
// module-level store at import time and expose it via useSyncExternalStore.
// That way the deferred prompt survives the login -> dashboard transition and
// any component can offer "install the app" without missing the event.
import { useSyncExternalStore, useCallback } from 'react'

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ identifies as Mac but is touch-capable
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)

let deferredPrompt = null
let installed = isStandalone()
const subscribers = new Set()
const emit = () => subscribers.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // stop Chrome's mini-infobar; we drive the prompt ourselves
    deferredPrompt = e
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferredPrompt = null
    emit()
  })
}

function subscribe(cb) {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

// useSyncExternalStore needs a stable snapshot between emits, so cache it and
// only rebuild the object when a value actually changes.
let snapshot = { canInstall: false, installed }
function getSnapshot() {
  const canInstall = Boolean(deferredPrompt)
  if (canInstall !== snapshot.canInstall || installed !== snapshot.installed) {
    snapshot = { canInstall, installed }
  }
  return snapshot
}

export function useInstallPrompt() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  // Trigger the native install dialog. Resolves true if the user accepted.
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    if (outcome === 'accepted') installed = true
    emit()
    return outcome === 'accepted'
  }, [])

  return {
    canInstall: state.canInstall,
    installed: state.installed,
    promptInstall,
    isIOS: isIOS(),
    isStandalone: isStandalone(),
  }
}
