import { useInstallPrompt } from '../hooks/useInstallPrompt'
import AppIcon from './AppIcons'

// "Download the app" modal. The PWA installs natively on Android and desktop
// Chrome/Edge (one prompt covers both); iOS Safari has no programmatic install,
// so we show the Add-to-Home-Screen steps instead.
export default function InstallApp({ onClose }) {
  const { canInstall, installed, promptInstall, isIOS } = useInstallPrompt()

  async function install() {
    const ok = await promptInstall()
    if (ok) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal install-modal" onClick={(e) => e.stopPropagation()}>
        <button className="install-close" onClick={onClose} aria-label="Close">×</button>

        <div className="install-head">
          <div className="install-badge"><AppIcon name="download" size={30} /></div>
          <h2>Get the Milestone app</h2>
          <p className="install-sub">
            Install Milestone for a full-screen, app-like experience that launches straight from
            your home screen — and keeps working offline.
          </p>
        </div>

        {installed ? (
          <div className="install-done">✅ Milestone is already installed on this device.</div>
        ) : (
          <>
            {canInstall && (
              <button className="btn-primary install-cta" onClick={install}>
                Install Milestone
              </button>
            )}

            <div className="install-grid">
              <div className="install-card">
                <div className="install-card-icon"><AppIcon name="mobile" size={26} /></div>
                <div className="install-card-name">Android</div>
                <p>
                  {canInstall
                    ? 'Tap “Install Milestone” above to add it to your home screen.'
                    : 'Open this page in Chrome, then choose menu (⋮) → “Install app”.'}
                </p>
              </div>

              <div className={`install-card ${isIOS ? 'highlight' : ''}`}>
                <div className="install-card-icon"><AppIcon name="apple" size={26} /></div>
                <div className="install-card-name">iPhone &amp; iPad</div>
                <p>
                  In Safari, tap the Share button <b>↑</b>, then pick <b>“Add to Home Screen”</b>.
                </p>
              </div>

              <div className="install-card">
                <div className="install-card-icon"><AppIcon name="laptop" size={26} /></div>
                <div className="install-card-name">Windows &amp; Mac</div>
                <p>
                  {canInstall
                    ? 'Click “Install Milestone” above, or use the install icon in the address bar.'
                    : 'In Chrome or Edge, click the install icon ⊕ in the address bar.'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
