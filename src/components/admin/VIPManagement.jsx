import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

const DEFAULT_VIP_PACKAGES = [
  { id: 'gold', label: 'Gold', price: 500, color: '#C8A456', desc: 'Premium seating, welcome drink, dedicated server' },
  { id: 'platinum', label: 'Platinum', price: 1000, color: '#E5E4E2', desc: 'Gold + private lounge, champagne, custom menu' },
  { id: 'diamond', label: 'Diamond', price: 2000, color: '#B9F2FF', desc: 'Platinum + personal chef, limousine service, premium decor' },
  { id: 'royal', label: 'Royal', price: 5000, color: '#8A2BE2', desc: 'Diamond + exclusive hall, live entertainment, full concierge' }
]

const VIP_CONFIG_KEY = 'aisha_vip_config'

function loadVipConfig() {
  try {
    const raw = localStorage.getItem(VIP_CONFIG_KEY)
    return raw ? JSON.parse(raw) : { packages: DEFAULT_VIP_PACKAGES, conciergeFee: 300 }
  } catch { return { packages: DEFAULT_VIP_PACKAGES, conciergeFee: 300 } }
}

function saveVipConfig(config) {
  try {
    localStorage.setItem(VIP_CONFIG_KEY, JSON.stringify(config))
    window.dispatchEvent(new CustomEvent('vipConfigChanged'))
  } catch { /* ignore fallback */ }
}

export default function VIPManagement() {
  const { addToast } = useToast()
  const [vipConfig, setVipConfigState] = useState(loadVipConfig)
  const [vipDirty, setVipDirty] = useState(false)

  const updatePackagePrice = (id, newPrice) => {
    setVipConfigState(prev => {
      const next = {
        ...prev,
        packages: prev.packages.map(p => p.id === id ? { ...p, price: parseInt(newPrice) || 0 } : p)
      }
      saveVipConfig(next)
      return next
    })
    setVipDirty(true)
  }

  const updatePackageDesc = (id, newDesc) => {
    setVipConfigState(prev => {
      const next = {
        ...prev,
        packages: prev.packages.map(p => p.id === id ? { ...p, desc: newDesc } : p)
      }
      saveVipConfig(next)
      return next
    })
    setVipDirty(true)
  }

  const updateConciergeFee = (fee) => {
    setVipConfigState(prev => {
      const next = { ...prev, conciergeFee: parseInt(fee) || 0 }
      saveVipConfig(next)
      return next
    })
    setVipDirty(true)
  }

  const saveSettings = () => {
    saveVipConfig(vipConfig)
    setVipDirty(false)
    addToast('VIP settings saved successfully', 'success')
  }

  return (
    <>
      <div className="ph">
        <h2>VIP Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>(Package Pricing)</span></h2>
        <div className="ph-a">
          <button className="btn btn-gold btn-sm" onClick={saveSettings} disabled={!vipDirty}>
            <i className="fas fa-save"></i> {vipDirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>
      <div className="ftc glass">
        <table className="dt">
          <thead><tr><th>Package</th><th>Color</th><th>Price (GHS)</th><th>Description</th></tr></thead>
          <tbody>
            {vipConfig.packages.map(pkg => (
              <tr key={pkg.id}>
                <td>
                  <div className="uc">
                    <div className="ua" style={{ background: `${pkg.color}22`, color: pkg.color, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{pkg.label[0]}</div>
                    <div><div className="un">{pkg.label}</div></div>
                  </div>
                </td>
                <td><input type="color" value={pkg.color} disabled style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'not-allowed', padding: 0 }} /></td>
                <td><input type="number" className="s-input" value={pkg.price} onChange={e => updatePackagePrice(pkg.id, e.target.value)} min="0" step="100" style={{ width: 120 }} /></td>
                <td><input type="text" className="s-input" value={pkg.desc} onChange={e => updatePackageDesc(pkg.id, e.target.value)} style={{ width: '100%', minWidth: 300 }} /></td>
              </tr>
            ))}
            <tr>
              <td><div className="uc"><div className="ua" style={{ background: 'rgba(200,164,86,.12)', color: '#C8A456', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>C</div><div><div className="un">Concierge Fee</div></div></div></td>
              <td></td>
              <td><input type="number" className="s-input" value={vipConfig.conciergeFee} onChange={e => updateConciergeFee(e.target.value)} min="0" step="50" style={{ width: 120 }} /></td>
              <td style={{ color: 'var(--gray-500)', fontSize: '.85rem' }}>Additional charge for dedicated concierge service</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="pc glass" style={{ marginTop: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <i className="fas fa-info-circle" style={{ color: 'var(--gold)' }}></i>
        <span style={{ fontSize: '.85rem', color: 'var(--gray-400)' }}>
          Changes to VIP pricing take effect immediately on the public site after saving.
        </span>
      </div>
    </>
  )
}
