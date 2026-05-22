import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { dataService } from '../../lib/dataService'
import { sanitizeHtml } from '../../lib/sanitize'
import { useNavigate } from 'react-router-dom'
import '../../styles/admin.css'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
  try { localStorage.setItem(VIP_CONFIG_KEY, JSON.stringify(config)) } catch {}
}

const pages = [
  { id: 'overview', label: 'Overview', icon: 'fa-th-large' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-line' },
  { id: 'users', label: 'Users', icon: 'fa-users' },
  { id: 'restaurants', label: 'Restaurants', icon: 'fa-utensils' },
  { id: 'venues', label: 'Venues', icon: 'fa-building' },
  { id: 'menu', label: 'Menu & Food', icon: 'fa-hamburger' },
  { id: 'orders', label: 'Orders', icon: 'fa-shopping-bag' },
  { id: 'bookings', label: 'Bookings', icon: 'fa-calendar-check' },
  { id: 'events', label: 'Events', icon: 'fa-star' },
  { id: 'vip', label: 'VIP Management', icon: 'fa-crown' },
  { id: 'payments', label: 'Payments', icon: 'fa-credit-card' },
  { id: 'promotions', label: 'Promotions', icon: 'fa-tags' },
  { id: 'complaints', label: 'Complaints', icon: 'fa-exclamation-triangle' },
  { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
  { id: 'settings', label: 'Settings', icon: 'fa-cog' }
]

const navSections = [
  { title: 'Main', items: ['overview', 'analytics'] },
  { title: 'Management', items: ['users', 'restaurants', 'venues', 'menu', 'orders', 'bookings', 'events', 'vip'] },
  { title: 'Finance', items: ['payments', 'promotions'] },
  { title: 'System', items: ['complaints', 'notifications', 'settings'] }
]

const COLORS = ['#C8A456', '#E8853D', '#34D399', '#60A5FA']

const stCls = (s) => {
  if (!s) return 'inactive'
  const st = s.toLowerCase()
  if (['active', 'confirmed', 'paid', 'completed', 'delivered'].includes(st)) return 'active'
  if (['pending', 'maintenance', 'in-progress', 'preparing', 'in_transit', 'ready'].includes(st)) return 'pending'
  return 'inactive'
}

const prCl = { Critical: 'var(--red)', High: 'var(--orange)', Medium: 'var(--gold)', Low: 'var(--blue)' }

const renderAvatar = (seed, sz = 30) => (
  <div className="ua"><img src={`https://picsum.photos/seed/${seed}/${sz * 2}/${sz * 2}.jpg`} alt="" loading="lazy" /></div>
)

function toastAction(label, fn) {
  return <button title={label} onClick={fn}>
    <i className={`fas fa-${label === 'Edit' ? 'pen' : label === 'View' ? 'eye' : 'trash'}`}></i>
  </button>
}

function Modal({ isOpen, onClose, title, subtitle, children }) {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [isOpen])
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [onClose])
  return (
    <div className={`mo${isOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="md"><button className="mx" onClick={onClose}><i className="fas fa-times"></i></button>{title && <h3>{title}</h3>}{subtitle && <p className="ms">{subtitle}</p>}{children}</div>
    </div>
  )
}

function ViewModal({ item, onClose }) {
  if (!item) return null
  const fields = Object.entries(item).filter(([k]) => !['id', 'img', 'icon', 'color'].includes(k))
  return (
    <div className="mo open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="md" style={{ maxWidth: '520px' }}>
        <button className="mx" onClick={onClose}><i className="fas fa-times"></i></button>
        <h3>{item.name || item.title || item.code || 'Details'}</h3>
        <p className="ms" style={{ marginBottom: '18px' }}>Viewing details</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {fields.map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--glass)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem' }}>
              <span style={{ color: 'var(--gray-500)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
              <span style={{ color: 'var(--gray-200)', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{String(val ?? '\u2014')}</span>
            </div>
          ))}
        </div>
        <div className="ma" style={{ marginTop: '18px' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

const stTabs = [
  {
    id: 'general', icon: 'fa-cog', label: 'General',
    content: () => <>
      <h3>General Settings</h3>
      <SettingRow label="Platform Name" desc="Displayed across the platform" control={<input className="s-input" defaultValue="Aisha Events Centre" readOnly />} />
      <SettingRow label="Support Email" desc="Customer support contact" control={<input className="s-input" defaultValue="support@aisha.events" type="email" />} />
      <SettingRow label="Default Currency" desc="Platform transaction currency" control={<select className="s-input" style={{ width: '140px' }}><option>GHS - Ghana Cedis</option><option>USD - Dollar</option></select>} />
      <SettingRow label="Maintenance Mode" desc="Temporarily disable the platform" control={<Toggle />} />
      <SettingRow label="Allow Registration" desc="Enable new user sign-ups" control={<Toggle defaultChecked />} />
    </>
  },
  {
    id: 'payments', icon: 'fa-credit-card', label: 'Payments',
    content: () => <>
      <h3>Payment Settings</h3>
      <SettingRow label="Paystack Public Key" desc="Your Paystack integration key" control={<input className="s-input" style={{ fontFamily: 'monospace' }} defaultValue={import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'Not configured'} readOnly />} />
      <SettingRow label="Default Commission Rate" desc="Applied to all listings" control={<input className="s-input" type="number" defaultValue={15} style={{ width: '70px', textAlign: 'center' }} />} />
      <SettingRow label="Auto-Payout" desc="Automatically process payouts" control={<Toggle defaultChecked />} />
    </>
  },
  {
    id: 'notifications', icon: 'fa-bell', label: 'Notifications',
    content: () => <>
      <h3>Notification Preferences</h3>
      <SettingRow label="Booking Confirmations" desc="Notify users on confirmation" control={<Toggle defaultChecked />} />
      <SettingRow label="Order Updates" desc="Push for order status changes" control={<Toggle defaultChecked />} />
      <SettingRow label="Payment Alerts" desc="Successful/failed payment notifications" control={<Toggle defaultChecked />} />
      <SettingRow label="Promotional Emails" desc="Marketing and promo emails" control={<Toggle />} />
      <SettingRow label="Admin Complaint Alerts" desc="Instant notification for complaints" control={<Toggle defaultChecked />} />
    </>
  },
  {
    id: 'security', icon: 'fa-shield-alt', label: 'Security',
    content: () => <>
      <h3>Security Settings</h3>
      <SettingRow label="Two-Factor Authentication" desc="Require 2FA for admin logins" control={<Toggle defaultChecked />} />
      <SettingRow label="Session Timeout" desc="Auto-logout after inactivity" control={<select className="s-input" style={{ width: '130px' }}><option>15 minutes</option><option selected>30 minutes</option><option>1 hour</option><option>2 hours</option></select>} />
      <SettingRow label="Max Login Attempts" desc="Lock after failed attempts" control={<input className="s-input" type="number" defaultValue={5} style={{ width: '70px', textAlign: 'center' }} />} />
    </>
  },
  {
    id: 'appearance', icon: 'fa-palette', label: 'Appearance',
    content: () => <>
      <h3>Appearance Settings</h3>
      <SettingRow label="Dark Mode" desc="Toggle dark/light theme" control={<Toggle defaultChecked />} />
       <SettingRow label="Primary Color" desc="Main brand accent color" control={<input type="color" defaultValue="#C8A456" style={{ width: '40px', height: '34px', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', padding: '2px' }} />} />
      <SettingRow label="Compact Mode" desc="Reduce spacing for denser layout" control={<Toggle />} />
    </>
  }
]

function Toggle({ defaultChecked }) {
  return (
    <label className="tsw">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span className="sl"></span>
    </label>
  )
}

function SettingRow({ label, desc, control }) {
  return (
    <div className="sr">
      <div className="sri"><div className="srl">{label}</div><div className="srd">{desc}</div></div>
      {control}
    </div>
  )
}

const fm = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

const parseAmount = (s) => {
  if (typeof s === 'number') return s
  return parseFloat((s || '0').replace(/,/g, '')) || 0
}

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [mobOpen, setMobOpen] = useState(false)
  const [modals, setModals] = useState({})
  const [editItem, setEditItem] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [userFilter, setUserFilter] = useState({ search: '', role: '', status: '' })
  const [restFilter, setRestFilter] = useState({ search: '', status: '' })
  const [venFilter, setVenFilter] = useState({ search: '', type: '' })
  const [menuFilter, setMenuFilter] = useState({ search: '', category: '' })
  const [settingsTab, setSettingsTab] = useState('general')

  const [d, setD] = useState({
    restaurants: [], venues: [], meals: [], events: [],
    orders: [], bookings: [], payments: [],
    promotions: [], complaints: [], notifications: [],
    users: [], activities: [], recentBookings: []
  })
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [restaurants, venues, meals, events, orders, bookings, payments, promotions, complaints, notifications, users, activities, recentBookings] = await Promise.all([
      dataService.fetchRestaurants(), dataService.fetchVenues(), dataService.fetchMeals(), dataService.fetchEvents(),
      dataService.fetchOrders(), dataService.fetchBookings(), dataService.fetchPayments(),
      dataService.fetchPromotions(), dataService.fetchComplaints(),
      dataService.fetchNotifications(), dataService.fetchUsers(), dataService.fetchActivities(), dataService.fetchRecentBookings()
    ])
    setD({ restaurants, venues, meals, events, orders, bookings, payments, promotions, complaints, notifications, users, activities, recentBookings })
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleExport = (filename, headers, data, mapRowFn) => {
    try {
      const csvContent = [
        headers.join(','),
        ...data.map(item => mapRowFn(item).map(val => {
          const escaped = String(val ?? '').replace(/"/g, '""')
          return `"${escaped}"`
        }).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      addToast('Data exported successfully!', 'success')
    } catch (err) {
      addToast(`Export failed: ${err.message}`, 'error')
    }
  }

  // Computed stats
  const totalRevenue = d.payments.reduce((s, p) => s + (p.status === 'completed' ? parseAmount(p.amount) : 0), 0)
  const activeUsers = d.users.filter(u => u.status === 'active').length
  const confirmedBookings = d.bookings.filter(b => b.status !== 'cancelled')
  const pendingOrders = d.orders.filter(o => ['Pending', 'Preparing', 'In Transit'].includes(o.status))
  const pendingComplaints = d.complaints.filter(c => c.status !== 'resolved')

  // Computed chart data
  const revenueByMonth = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const map = {}
    months.forEach(m => { map[m] = { Restaurants: 0, Venues: 0 } })
    d.payments.forEach(p => {
      const m = months[new Date(p.date).getMonth()]
      if (m && map[m]) {
        const amt = parseAmount(p.amount)
        if (p.service?.toLowerCase().includes('restaurant')) map[m].Restaurants += amt
        else if (p.service?.toLowerCase().includes('venue')) map[m].Venues += amt
        else map[m].Restaurants += amt * 0.6; map[m].Venues += amt * 0.4
      }
    })
    return months.map(name => ({
      name,
      Restaurants: +(map[name].Restaurants / 1000000).toFixed(1),
      Venues: +(map[name].Venues / 1000000).toFixed(1)
    }))
  })()

  const serviceDistData = [
    { name: 'Restaurant Bookings', value: d.bookings.filter(b => b.type === 'Restaurant').length || 1 },
    { name: 'Venue Bookings', value: d.bookings.filter(b => b.type === 'Venue').length || 1 },
    { name: 'Food Orders', value: d.orders.length || 1 },
    { name: 'Event Tickets', value: d.bookings.filter(b => b.type === 'Event').length || 1 }
  ]

  const userGrowthData = (() => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
    return months.map(m => ({ name: m, users: Math.max(50, d.users.length + Math.floor(Math.random() * 50)) }))
  })()

  const cuisineData = (() => {
    const map = {}
    d.meals.forEach(m => {
      const c = m.category || 'Other'
      map[c] = (map[c] || 0) + (m.orders || 0)
    })
    return Object.entries(map).slice(0, 6).map(([name, orders]) => ({ name, orders }))
  })()

  const peakHoursData = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM', '12AM'].map(h => ({
    name: h, bookings: Math.max(1, Math.floor(Math.random() * 100))
  }))

  const openModal = (id) => setModals(prev => ({ ...prev, [id]: true }))
  const closeModal = (id) => setModals(prev => ({ ...prev, [id]: false }))
  const go = (page) => { setCurrentPage(page); setMobOpen(false) }
  const toggleSidebar = () => { if (window.innerWidth <= 768) setMobOpen(prev => !prev); else setCollapsed(prev => !prev) }
  const closeMob = () => setMobOpen(false)

  const handleCreate = (mid, label, creatorFn) => async (e) => {
    e.preventDefault()
    const form = e.target
    const fd = new FormData(form)
    const data = Object.fromEntries(fd.entries())
    delete data.image
    const fileInput = form.querySelector('input[type="file"]')
    let imageUrl = ''
    if (fileInput?.files?.[0]) {
      try {
        imageUrl = await dataService.uploadImage(label.toLowerCase().replace(/\s+/g, '-'), fileInput.files[0])
      } catch { addToast('Image upload failed', 'error') }
    }
    if (imageUrl) data.image_url = imageUrl
    try {
      await creatorFn(data)
      addToast(`${label} created successfully`, 'success')
      closeModal(mid)
      form.reset()
      loadData()
    } catch (err) {
      addToast(`Failed: ${err.message || err}`, 'error')
    }
  }

  const handleUpdate = (mid, label, updateFn) => async (e) => {
    e.preventDefault()
    const form = e.target
    const fd = new FormData(form)
    const data = Object.fromEntries(fd.entries())
    delete data.image
    const fileInput = form.querySelector('input[type="file"]')
    let imageUrl = ''
    if (fileInput?.files?.[0]) {
      try {
        imageUrl = await dataService.uploadImage(label.toLowerCase().replace(/\s+/g, '-'), fileInput.files[0])
      } catch { addToast('Image upload failed', 'error') }
    }
    if (imageUrl) data.image_url = imageUrl
    try {
      await updateFn(editItem.id, data)
      addToast(`${label} updated successfully`, 'success')
      setEditItem(null)
      closeModal(mid)
      loadData()
    } catch (err) {
      addToast(`Failed: ${err.message || err}`, 'error')
    }
  }

  const handleDelete = async (id, label, deleteFn) => {
    try {
      await deleteFn(id)
      addToast(`${label} deleted`, 'success')
      loadData()
    } catch { addToast(`Failed to delete ${label}`, 'error') }
  }

  const handleAction = async (id, label, action, actionFn) => {
    try {
      await actionFn(id)
      addToast(`${label} ${action}`, 'success')
      loadData()
    } catch { addToast(`Failed to ${action} ${label}`, 'error') }
  }

  const filteredUsers = d.users.filter(u => {
    const ms = !userFilter.search || u.name.toLowerCase().includes(userFilter.search.toLowerCase()) || u.email.toLowerCase().includes(userFilter.search.toLowerCase())
    const mr = !userFilter.role || u.role === userFilter.role
    const ms2 = !userFilter.status || u.status === userFilter.status
    return ms && mr && ms2
  })

  const filteredRests = d.restaurants.filter(r => {
    const ms = !restFilter.search || r.name.toLowerCase().includes(restFilter.search.toLowerCase()) || r.cuisine.toLowerCase().includes(restFilter.search.toLowerCase())
    const ms2 = !restFilter.status || r.status === restFilter.status
    return ms && ms2
  })

  useEffect(() => { document.body.style.overflow = mobOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [mobOpen])

  if (loading) {
    return (
      <div className="dashboard">
        <div className="main" style={{ marginLeft: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
            <div style={{ color: 'var(--gray-400)', fontSize: '.85rem' }}>Loading dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  function Overview() {
    return (
      <>
        <div className="ov-grid">
          <div className="sc glass"><div className="si" style={{ background: 'rgba(200,164,86,.12)', color: 'var(--gold)' }}><i className="fas fa-cedi-sign"></i></div><div className="sv">GH₵{fm(totalRevenue)}</div><div className="sl">Total Revenue</div><span className={`sch ${totalRevenue > 0 ? 'up' : ''}`}><i className={`fas fa-arrow-${totalRevenue > 0 ? 'up' : 'right'}`}></i> From payments</span><i className="fas fa-wallet sbi"></i></div>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)' }}><i className="fas fa-users"></i></div><div className="sv">{d.users.length}</div><div className="sl">Total Users</div><span className="sch up"><i className="fas fa-arrow-up"></i> {activeUsers} active</span><i className="fas fa-user-group sbi"></i></div>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(96,165,250,.12)', color: 'var(--blue)' }}><i className="fas fa-utensils"></i></div><div className="sv">{confirmedBookings.length}</div><div className="sl">Total Bookings</div><span className="sch up"><i className="fas fa-arrow-up"></i> {confirmedBookings.filter(b => b.status === 'confirmed').length} confirmed</span><i className="fas fa-calendar sbi"></i></div>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(232,133,61,.12)', color: 'var(--orange)' }}><i className="fas fa-shopping-bag"></i></div><div className="sv">{d.orders.length}</div><div className="sl">Food Orders</div><span className={`sch ${pendingOrders.length > 0 ? 'up' : ''}`}><i className="fas fa-arrow-up"></i> {pendingOrders.length} active</span><i className="fas fa-bag-shopping sbi"></i></div>
        </div>
        <div className="ch-grid">
          <div className="cc glass">
            <div className="ch-h"><div><div className="ch-t">Revenue Overview</div><div className="ch-st">Monthly revenue across services</div></div></div>
            <div className="ch-cv">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByMonth}>
                  <defs><linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C8A456" stopOpacity={0.25}/><stop offset="95%" stopColor="#C8A456" stopOpacity={0}/></linearGradient><linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E8853D" stopOpacity={0.2}/><stop offset="95%" stopColor="#E8853D" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="var(--gray-500)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--gray-500)" tick={{ fontSize: 11 }} tickFormatter={(v) => v + 'M'} />
                  <Tooltip contentStyle={{ background: 'var(--black-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="Restaurants" stroke="#C8A456" fill="url(#colorR)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Venues" stroke="#E8853D" fill="url(#colorV)" strokeWidth={2} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="cc glass">
            <div className="ch-h"><div><div className="ch-t">Revenue by Service</div><div className="ch-st">Distribution breakdown</div></div></div>
            <div className="ch-cv">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceDistData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={0}>
                    {serviceDistData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bt-grid">
          <div className="tc glass">
            <div className="t-h"><div className="t-t">Recent Bookings</div></div>
            <table className="dt"><thead><tr><th>Guest</th><th>Service</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {d.recentBookings.map((b, i) => (
                  <tr key={i}>
                    <td><div className="uc">{renderAvatar(`rb${i}`)}<div><div className="un">{b.guest}</div></div></div></td>
                    <td>{b.service}</td><td>{b.date}</td><td><span className="amt">GH₵{b.amount}</span></td>
                    <td><span className={`sb2 ${stCls(b.status)}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tc glass">
            <div className="t-h"><div className="t-t">Recent Activity</div></div>
            {d.activities.map((a, i) => (
              <div key={i} className="ai">
                <div className="ai-ic" style={{ background: a.bg, color: a.fg }}><i className={`fas ${a.icon}`}></i></div>
                <div><div className="ai-t" dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.text) }} /><div className="ai-tm">{a.time}</div></div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  function Analytics() {
    return (
      <>
        <div className="ov-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(200,164,86,.12)', color: 'var(--gold)' }}><i className="fas fa-eye"></i></div><div className="sv">{d.users.length * 37}</div><div className="sl">Page Views</div><span className="sch up"><i className="fas fa-arrow-up"></i> 24%</span></div>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)' }}><i className="fas fa-clock"></i></div><div className="sv">4m 32s</div><div className="sl">Avg Session</div><span className="sch up"><i className="fas fa-arrow-up"></i> 11%</span></div>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(96,165,250,.12)', color: 'var(--blue)' }}><i className="fas fa-percentage"></i></div><div className="sv">{d.orders.length > 0 ? ((d.bookings.length / (d.users.length || 1)) * 100).toFixed(1) : 0}%</div><div className="sl">Conversion Rate</div><span className="sch up"><i className="fas fa-arrow-up"></i> 0.6%</span></div>
        </div>
        <div className="ch-grid">
          <div className="cc glass">
            <div className="ch-h"><div><div className="ch-t">User Growth Trend</div></div></div>
            <div className="ch-cv">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs><linearGradient id="colorU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="var(--gray-500)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--gray-500)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--black-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="users" stroke="#34D399" fill="url(#colorU)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="cc glass">
            <div className="ch-h"><div><div className="ch-t">Top Categories</div></div></div>
            <div className="ch-cv">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cuisineData.length ? cuisineData : [{ name: 'No Data', orders: 1 }]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" stroke="var(--gray-500)" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" stroke="var(--gray-500)" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ background: 'var(--black-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Bar dataKey="orders" fill="#C8A456" radius={[0, 6, 6, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="cc glass" style={{ marginTop: '18px' }}>
          <div className="ch-h"><div><div className="ch-t">Peak Booking Hours</div></div></div>
          <div className="ch-cv" style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="var(--gray-500)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--gray-500)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--black-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                <Bar dataKey="bookings" fill="#C8A456" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    )
  }

  function Users() {
    return (
      <>
        <div className="ph">
          <h2>User Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.users.length} total)</span></h2>
          <div className="ph-a">
            <button className="btn btn-outline btn-sm" onClick={() => handleExport('Aisha_Users', ['User ID', 'Name', 'Email', 'Role', 'Status', 'Joined Date'], filteredUsers, u => [u.id, u.name, u.email, u.role, u.status, u.joined])}><i className="fas fa-download"></i> Export</button>
            <button className="btn btn-gold btn-sm" onClick={() => openModal('addUserM')}><i className="fas fa-plus"></i> Add User</button>
          </div>
        </div>
        <div className="fb">
          <input type="text" placeholder="Search users..." value={userFilter.search} onChange={(e) => setUserFilter(prev => ({ ...prev, search: e.target.value }))} />
          <select value={userFilter.role} onChange={(e) => setUserFilter(prev => ({ ...prev, role: e.target.value }))}><option value="">All Roles</option><option>Customer</option><option>Driver</option><option>Admin</option></select>
          <select value={userFilter.status} onChange={(e) => setUserFilter(prev => ({ ...prev, status: e.target.value }))}><option value="">All Status</option><option>active</option><option>inactive</option><option>suspended</option></select>
        </div>
        <div className="ftc glass">
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No users found</div>
          ) : (
            <table className="dt"><thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Bookings</th><th>Spent</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td><div className="uc">{renderAvatar(u.id)}<div><div className="un">{u.name}</div><div className="ue">{u.email}</div></div></div></td>
                    <td style={{ fontWeight: 500, color: 'var(--gray-200)' }}>{u.role}</td>
                    <td>{u.joined}</td><td>{u.bookings || '\u2014'}</td>
                    <td><span className="amt">GH₵{u.spent}</span></td>
                    <td><span className={`sb2 ${stCls(u.status)}`}>{u.status}</span></td>
                    <td><div className="ta"><button title="View" onClick={() => setViewItem(u)}><i className="fas fa-eye"></i></button>{toastAction('Edit', () => addToast(`Editing ${u.name}`, 'info'))}<button className="del" onClick={() => addToast(`${u.name} suspended`, 'error')}><i className="fas fa-ban"></i></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="tp"><span className="pi">Showing {filteredUsers.length} of {d.users.length} users</span></div>
        </div>
        <Modal isOpen={modals.addUserM} onClose={() => closeModal('addUserM')} title="Add New User" subtitle="Create a new user account">
          <form onSubmit={(e) => hAdd(e, 'addUserM', 'User')}>
            <div className="fg"><div className="fgp"><label>First Name</label><input type="text" required /></div><div className="fgp"><label>Last Name</label><input type="text" required /></div></div>
            <div className="fgp"><label>Email</label><input type="email" required /></div>
            <div className="fg"><div className="fgp"><label>Role</label><select><option>Customer</option><option>Driver</option><option>Admin</option></select></div></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => closeModal('addUserM')}>Cancel</button><button type="submit" className="btn btn-gold">Create User</button></div>
          </form>
        </Modal>
      </>
    )
  }

  function RestaurantsSection() {
    return (
      <>
        <div className="ph"><h2>Restaurant Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.restaurants.length} total)</span></h2><div className="ph-a"><button className="btn btn-gold btn-sm" onClick={() => openModal('addRestM')}><i className="fas fa-plus"></i> Add Restaurant</button></div></div>
        <div className="fb">
          <input type="text" placeholder="Search restaurants..." value={restFilter.search} onChange={(e) => setRestFilter(prev => ({ ...prev, search: e.target.value }))} />
          <select value={restFilter.status} onChange={(e) => setRestFilter(prev => ({ ...prev, status: e.target.value }))}><option value="">All Status</option><option>active</option><option>pending</option><option>inactive</option></select>
        </div>
        <div className="ftc glass">
          {filteredRests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No restaurants found</div>
          ) : (
            <table className="dt"><thead><tr><th>Restaurant</th><th>Cuisine</th><th>Rating</th><th>Tables</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredRests.map(r => (
                  <tr key={r.id}>
                    <td><div className="uc">{renderAvatar(r.id)}<div><div className="un">{r.name}</div></div></div></td>
                    <td>{r.cuisine}</td>
                    <td><span style={{ color: 'var(--gold)', fontWeight: 600 }}>{r.rating ? <><i className="fas fa-star" style={{ fontSize: '.68rem' }}></i> {r.rating}</> : '\u2014'}</span></td>
                    <td>{r.tables}</td><td><span className="amt">GH₵{r.revenue}</span></td>
                    <td><span className={`sb2 ${stCls(r.status)}`}>{r.status}</span></td>
                    <td><div className="ta">
                      <button title="View" onClick={() => setViewItem(r)}><i className="fas fa-eye"></i></button>
                      <button title="Edit" onClick={() => { setEditItem({ ...r }); openModal('editRestM') }}><i className="fas fa-pen"></i></button>
                      <button className="del" onClick={() => handleDelete(r.id, r.name, dataService.deleteRestaurant)}><i className="fas fa-trash"></i></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Modal isOpen={modals.addRestM} onClose={() => closeModal('addRestM')} title="Add Restaurant" subtitle="Register a new restaurant">
          <form onSubmit={handleCreate('addRestM', 'Restaurant', (data) => dataService.createRestaurant(data))}>
            <div className="fgp"><label>Name</label><input name="name" type="text" required /></div>
            <div className="fg"><div className="fgp"><label>Cuisine</label><select name="cuisine"><option>African Fusion</option><option>Mediterranean</option><option>Italian</option><option>Asian</option><option>Grill</option></select></div><div className="fgp"><label>Price Range</label><select name="price"><option>Budget</option><option>Moderate</option><option selected>Premium</option><option>Luxury</option></select></div></div>
            <div className="fgp"><label>Location</label><input name="location" type="text" required /></div>
            <div className="fg"><div className="fgp"><label>Tables</label><input name="tables" type="number" min="1" defaultValue={10} required /></div><div className="fgp"><label>Image</label><input name="image" type="file" accept="image/*" /></div></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => closeModal('addRestM')}>Cancel</button><button type="submit" className="btn btn-gold">Add Restaurant</button></div>
          </form>
        </Modal>
        <Modal isOpen={modals.editRestM} onClose={() => { setEditItem(null); closeModal('editRestM') }} title="Edit Restaurant" subtitle="Update restaurant details">
          <form key={editItem?.id || 'new-rest'} onSubmit={handleUpdate('editRestM', 'Restaurant', (id, data) => dataService.updateRestaurant(id, data))}>
            <div className="fgp"><label>Name</label><input name="name" type="text" defaultValue={editItem?.name || ''} required /></div>
            <div className="fg"><div className="fgp"><label>Cuisine</label><select name="cuisine" defaultValue={editItem?.cuisine || ''}><option>African Fusion</option><option>Mediterranean</option><option>Italian</option><option>Asian</option><option>Grill</option></select></div><div className="fgp"><label>Price Range</label><select name="price" defaultValue={editItem?.price || 'Premium'}><option>Budget</option><option>Moderate</option><option>Premium</option><option>Luxury</option></select></div></div>
            <div className="fgp"><label>Location</label><input name="location" type="text" defaultValue={editItem?.location || ''} required /></div>
            <div className="fg"><div className="fgp"><label>Tables</label><input name="tables" type="number" min="1" defaultValue={editItem?.tables || 10} required /></div><div className="fgp"><label>Image</label><input name="image" type="file" accept="image/*" /></div></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => { setEditItem(null); closeModal('editRestM') }}>Cancel</button><button type="submit" className="btn btn-gold">Save Changes</button></div>
          </form>
        </Modal>
      </>
    )
  }

  const filteredVens = d.venues.filter(v => {
    const ms = !venFilter.search || v.name.toLowerCase().includes(venFilter.search.toLowerCase()) || v.type.toLowerCase().includes(venFilter.search.toLowerCase())
    const mt = !venFilter.type || v.type === venFilter.type
    return ms && mt
  })

  function VenuesSection() {
    return (
      <>
        <div className="ph"><h2>Venue Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.venues.length} total)</span></h2><div className="ph-a"><button className="btn btn-gold btn-sm" onClick={() => openModal('addVenM')}><i className="fas fa-plus"></i> Add Venue</button></div></div>
        <div className="fb"><input type="text" placeholder="Search venues..." value={venFilter.search} onChange={(e) => setVenFilter(prev => ({ ...prev, search: e.target.value }))} /><select value={venFilter.type} onChange={(e) => setVenFilter(prev => ({ ...prev, type: e.target.value }))}><option value="">All Types</option><option>Wedding Hall</option><option>Conference</option><option>Lounge</option><option>Outdoor</option></select></div>
        <div className="ftc glass">
          {filteredVens.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No venues found</div>
          ) : (
            <table className="dt"><thead><tr><th>Venue</th><th>Type</th><th>Capacity</th><th>Price</th><th>Bookings</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredVens.map(v => (
                  <tr key={v.id}>
                    <td><div className="uc">{renderAvatar(v.id)}<div><div className="un">{v.name}</div></div></div></td>
                    <td>{v.type}</td><td>{v.capacity} Guests</td><td><span className="amt">GH₵{v.price}</span></td><td>{v.bookings}</td>
                    <td><span className={`sb2 ${stCls(v.status)}`}>{v.status}</span></td>
                    <td><div className="ta">
                      <button title="View" onClick={() => setViewItem(v)}><i className="fas fa-eye"></i></button>
                      <button title="Edit" onClick={() => { setEditItem({ ...v }); openModal('editVenM') }}><i className="fas fa-pen"></i></button>
                      <button className="del" onClick={() => handleDelete(v.id, v.name, dataService.deleteVenue)}><i className="fas fa-trash"></i></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Modal isOpen={modals.addVenM} onClose={() => closeModal('addVenM')} title="Add Venue" subtitle="Register a new event venue">
          <form onSubmit={handleCreate('addVenM', 'Venue', (data) => dataService.createVenue(data))}>
            <div className="fgp"><label>Venue Name</label><input name="name" type="text" required /></div>
            <div className="fg"><div className="fgp"><label>Type</label><select name="type"><option>Wedding Hall</option><option>Conference</option><option>Lounge</option><option>Outdoor</option><option>Ballroom</option></select></div><div className="fgp"><label>Capacity</label><input name="capacity" type="number" min="1" required /></div></div>
            <div className="fgp"><label>Location</label><input name="location" type="text" required /></div>
            <div className="fg"><div className="fgp"><label>Price per Event (GHS)</label><input name="price" type="number" required /></div><div className="fgp"><label>Image</label><input name="image" type="file" accept="image/*" /></div></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => closeModal('addVenM')}>Cancel</button><button type="submit" className="btn btn-gold">Add Venue</button></div>
          </form>
        </Modal>
        <Modal isOpen={modals.editVenM} onClose={() => { setEditItem(null); closeModal('editVenM') }} title="Edit Venue" subtitle="Update venue details">
          <form key={editItem?.id || 'new-ven'} onSubmit={handleUpdate('editVenM', 'Venue', (id, data) => dataService.updateVenue(id, data))}>
            <div className="fgp"><label>Venue Name</label><input name="name" type="text" defaultValue={editItem?.name || ''} required /></div>
            <div className="fg"><div className="fgp"><label>Type</label><select name="type" defaultValue={editItem?.type || ''}><option>Wedding Hall</option><option>Conference</option><option>Lounge</option><option>Outdoor</option><option>Ballroom</option></select></div><div className="fgp"><label>Capacity</label><input name="capacity" type="number" min="1" defaultValue={editItem?.capacity || ''} required /></div></div>
            <div className="fgp"><label>Location</label><input name="location" type="text" defaultValue={editItem?.location || ''} required /></div>
            <div className="fg"><div className="fgp"><label>Price per Event (GHS)</label><input name="price" type="number" defaultValue={editItem?.price ? parseFloat(String(editItem.price).replace(/,/g, '')) : ''} required /></div><div className="fgp"><label>Image</label><input name="image" type="file" accept="image/*" /></div></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => { setEditItem(null); closeModal('editVenM') }}>Cancel</button><button type="submit" className="btn btn-gold">Save Changes</button></div>
          </form>
        </Modal>
      </>
    )
  }

  const filteredMeals = d.meals.filter(m => {
    const ms = !menuFilter.search || m.name.toLowerCase().includes(menuFilter.search.toLowerCase()) || m.restaurant?.toLowerCase().includes(menuFilter.search.toLowerCase())
    const mc = !menuFilter.category || m.category === menuFilter.category
    return ms && mc
  })

  function MenuSection() {
    return (
      <>
        <div className="ph"><h2>Menu & Food Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.meals.length} items)</span></h2><div className="ph-a"><button className="btn btn-gold btn-sm" onClick={() => openModal('addFoodM')}><i className="fas fa-plus"></i> Add Food Item</button></div></div>
        <div className="fb"><input type="text" placeholder="Search food items..." value={menuFilter.search} onChange={(e) => setMenuFilter(prev => ({ ...prev, search: e.target.value }))} /><select value={menuFilter.category} onChange={(e) => setMenuFilter(prev => ({ ...prev, category: e.target.value }))}><option value="">All Categories</option><option>Main Course</option><option>Appetizers</option><option>Desserts</option><option>Drinks</option></select></div>
        <div className="ftc glass">
          {filteredMeals.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No menu items found</div>
          ) : (
            <table className="dt"><thead><tr><th>Item</th><th>Category</th><th>Restaurant</th><th>Price</th><th>Orders</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredMeals.map(f => (
                  <tr key={f.id}>
                    <td><div className="uc">{renderAvatar(f.id, 26)}<div><div className="un">{f.name}</div></div></div></td>
                    <td>{f.category}</td><td>{f.restaurant}</td><td><span className="amt">GH₵{f.price}</span></td><td>{f.orders}</td>
                    <td><span style={{ color: 'var(--gold)', fontWeight: 600 }}>{f.rating ? <><i className="fas fa-star" style={{ fontSize: '.68rem' }}></i> {f.rating}</> : '\u2014'}</span></td>
                    <td><span className={`sb2 ${stCls(f.status)}`}>{f.status}</span></td>
                    <td><div className="ta">
                      <button title="Edit" onClick={() => { setEditItem({ ...f }); openModal('editFoodM') }}><i className="fas fa-pen"></i></button>
                      <button className="del" onClick={() => handleDelete(f.id, f.name, dataService.deleteMeal)}><i className="fas fa-trash"></i></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Modal isOpen={modals.addFoodM} onClose={() => closeModal('addFoodM')} title="Add Food Item" subtitle="Add a new menu item">
          <form onSubmit={handleCreate('addFoodM', 'Food item', (data) => dataService.createMeal(data))}>
            <div className="fgp"><label>Item Name</label><input name="name" type="text" required /></div>
            <div className="fg"><div className="fgp"><label>Category</label><select name="category"><option>Appetizers</option><option>Main Course</option><option>Desserts</option><option>Drinks</option></select></div><div className="fgp"><label>Restaurant</label><select name="restaurant_id">{d.restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div></div>
            <div className="fgp"><label>Description</label><input name="desc" type="text" required /></div>
            <div className="fg"><div className="fgp"><label>Price (GHS)</label><input name="price" type="number" required /></div><div className="fgp"><label>Prep Time (min)</label><input name="time" type="number" min="1" required /></div></div>
            <div className="fgp"><label>Image</label><input name="image" type="file" accept="image/*" /></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => closeModal('addFoodM')}>Cancel</button><button type="submit" className="btn btn-gold">Add Item</button></div>
          </form>
        </Modal>
        <Modal isOpen={modals.editFoodM} onClose={() => { setEditItem(null); closeModal('editFoodM') }} title="Edit Food Item" subtitle="Update menu item details">
          <form key={editItem?.id || 'new-food'} onSubmit={handleUpdate('editFoodM', 'Food item', (id, data) => dataService.updateMeal(id, data))}>
            <div className="fgp"><label>Item Name</label><input name="name" type="text" defaultValue={editItem?.name || ''} required /></div>
            <div className="fg"><div className="fgp"><label>Category</label><select name="category" defaultValue={editItem?.category || ''}><option>Appetizers</option><option>Main Course</option><option>Desserts</option><option>Drinks</option></select></div>
              <div className="fgp"><label>Restaurant</label>
                {editItem?.restaurant_id
                  ? <select name="restaurant_id" defaultValue={editItem.restaurant_id}>{d.restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                  : <input name="restaurant" type="text" defaultValue={editItem?.restaurant || ''} readOnly style={{ opacity: 0.6 }} />
                }
              </div>
            </div>
            <div className="fgp"><label>Description</label><input name="desc" type="text" defaultValue={editItem?.desc || ''} required /></div>
            <div className="fg"><div className="fgp"><label>Price (GHS)</label><input name="price" type="number" defaultValue={editItem?.price ? parseFloat(String(editItem.price).replace(/,/g, '')) : ''} required /></div><div className="fgp"><label>Prep Time (min)</label><input name="time" type="number" min="1" defaultValue={editItem?.time ? parseInt(editItem.time) : 15} required /></div></div>
            <div className="fgp"><label>Image</label><input name="image" type="file" accept="image/*" /></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => { setEditItem(null); closeModal('editFoodM') }}>Cancel</button><button type="submit" className="btn btn-gold">Save Changes</button></div>
          </form>
        </Modal>
      </>
    )
  }

  function OrdersSection() {
    return (
      <>
        <div className="ph"><h2>Order Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.orders.length} total)</span></h2><div className="ph-a"><button className="btn btn-outline btn-sm" onClick={() => handleExport('Aisha_Orders', ['Order ID', 'Customer Name', 'Items Ordered', 'Total Price', 'Order Type', 'Status'], d.orders, o => [o.id, o.customer, o.items, o.total, o.type, o.status])}><i className="fas fa-download"></i> Export</button></div></div>
        <div className="fb"><input type="text" placeholder="Search orders..." /><select><option value="">All Status</option><option>Pending</option><option>Preparing</option><option>In Transit</option><option>Delivered</option><option>Cancelled</option></select></div>
        <div className="ftc glass">
          {d.orders.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No orders found</div>
          ) : (
            <table className="dt"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {d.orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600, color: 'var(--gray-200)' }}>{o.id}</td>
                    <td><div className="uc">{renderAvatar(o.id, 26)}<div><div className="un">{o.customer}</div></div></div></td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.items}>{o.items}</td>
                    <td><span className="amt">GH₵{o.total}</span></td><td>{o.type}</td>
                    <td><span className={`sb2 ${stCls(o.status)}`}>{o.status}</span></td>
                    <td><div className="ta"><button title="View" onClick={() => setViewItem(o)}><i className="fas fa-eye"></i></button><button title="Edit" onClick={() => { setEditItem({ ...o }); openModal('editOrdM') }}><i className="fas fa-pen"></i></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Modal isOpen={modals.editOrdM} onClose={() => { setEditItem(null); closeModal('editOrdM') }} title="Update Order" subtitle="Change order status">
          <form key={editItem?.id || 'new-ord'} onSubmit={handleUpdate('editOrdM', 'Order', (id, data) => dataService.updateOrder(id, data))}>
            <div className="fgp"><label>Order ID</label><input type="text" defaultValue={editItem?.id || ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="fgp"><label>Customer</label><input type="text" defaultValue={editItem?.customer || ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="fgp"><label>Status</label><select name="status" defaultValue={editItem?.status || 'Pending'}><option>Pending</option><option>Preparing</option><option>In Transit</option><option>Delivered</option><option>Cancelled</option></select></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => { setEditItem(null); closeModal('editOrdM') }}>Cancel</button><button type="submit" className="btn btn-gold">Update Status</button></div>
          </form>
        </Modal>
      </>
    )
  }

  function BookingsSection() {
    return (
      <>
        <div className="ph"><h2>Booking Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.bookings.length} total)</span></h2><div className="ph-a"><button className="btn btn-outline btn-sm" onClick={() => handleExport('Aisha_Bookings', ['Booking ID', 'Guest Name', 'Booking Type', 'Date/Time', 'Guests Count', 'Price Amount', 'Status'], d.bookings, b => [b.id, b.guest, b.type, b.dateTime, b.guests, b.amount, b.status])}><i className="fas fa-download"></i> Export</button></div></div>
        <div className="fb"><input type="text" placeholder="Search bookings..." /><select><option value="">All Types</option><option>Restaurant</option><option>Venue</option><option>Event</option><option>VIP</option></select><select><option value="">All Status</option><option>confirmed</option><option>pending</option><option>cancelled</option><option>completed</option></select></div>
        <div className="ftc glass">
          {d.bookings.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No bookings found</div>
          ) : (
            <table className="dt"><thead><tr><th>ID</th><th>Guest</th><th>Type</th><th>Date/Time</th><th>Guests</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {d.bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--gray-200)' }}>{b.id}</td>
                    <td><div className="uc">{renderAvatar(b.id, 26)}<div><div className="un">{b.guest}</div></div></div></td>
                    <td>{b.type === 'vip' ? <span style={{ color: 'var(--gold)', fontWeight: 600 }}><i className="fas fa-crown"></i> VIP {b.vip_package ? `(${b.vip_package})` : ''}</span> : b.type}</td>
                    <td>{b.dateTime}</td><td>{b.guests}</td><td><span className="amt">GH₵{b.amount}</span></td>
                    <td><span className={`sb2 ${stCls(b.status)}`}>{b.status}</span></td>
                    <td><div className="ta"><button title="View" onClick={() => setViewItem(b)}><i className="fas fa-eye"></i></button><button title="Edit" onClick={() => { setEditItem({ ...b }); openModal('editBkM') }}><i className="fas fa-pen"></i></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Modal isOpen={modals.editBkM} onClose={() => { setEditItem(null); closeModal('editBkM') }} title="Update Booking" subtitle="Change booking status">
          <form key={editItem?.id || 'new-bk'} onSubmit={handleUpdate('editBkM', 'Booking', (id, data) => dataService.updateBooking(id, data))}>
            <div className="fgp"><label>Booking ID</label><input type="text" defaultValue={editItem?.id || ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="fgp"><label>Guest</label><input type="text" defaultValue={editItem?.guest || ''} disabled style={{ opacity: 0.6 }} /></div>
            {editItem?.vip_package && (
              <div className="fgp"><label>VIP Package</label><input type="text" defaultValue={editItem.vip_package} disabled style={{ opacity: 0.6, color: 'var(--gold)' }} /></div>
            )}
            <div className="fgp"><label>Amount (GHS)</label><input name="amount" type="number" min="0" defaultValue={editItem?.amount ? parseFloat(String(editItem.amount).replace(/,/g, '')) : ''} placeholder="Set booking price" /></div>
            <div className="fgp"><label>Status</label><select name="status" defaultValue={editItem?.status || 'pending'}><option>pending</option><option>confirmed</option><option>completed</option><option>cancelled</option></select></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => { setEditItem(null); closeModal('editBkM') }}>Cancel</button><button type="submit" className="btn btn-gold">Update Status</button></div>
          </form>
        </Modal>
      </>
    )
  }

  function EventsSectionAdmin() {
    return (
      <>
        <div className="ph"><h2>Events Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.events.length} total)</span></h2><div className="ph-a"><button className="btn btn-gold btn-sm" onClick={() => openModal('addEvtM')}><i className="fas fa-plus"></i> Create Event</button></div></div>
        <div className="ftc glass">
          {d.events.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No events found</div>
          ) : (
            <table className="dt"><thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Registered</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {d.events.map(e => (
                  <tr key={e.id}>
                    <td><div className="uc">{renderAvatar(e.id, 26)}<div><div className="un">{e.name}</div></div></div></td>
                    <td>{e.fullDate}</td><td>{e.venue}</td><td>{e.registered}</td><td><span className="amt">GH₵{e.price}</span></td>
                    <td><span className={`sb2 ${stCls(e.status)}`}>{e.status}</span></td>
                    <td><div className="ta">
                      <button title="View" onClick={() => setViewItem(e)}><i className="fas fa-eye"></i></button>
                      <button title="Edit" onClick={() => { setEditItem({ ...e }); openModal('editEvtM') }}><i className="fas fa-pen"></i></button>
                      <button className="del" onClick={() => handleDelete(e.id, e.name, dataService.deleteEvent)}><i className="fas fa-trash"></i></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Modal isOpen={modals.addEvtM} onClose={() => closeModal('addEvtM')} title="Create Event" subtitle="Create a new event listing">
          <form onSubmit={handleCreate('addEvtM', 'Event', (data) => dataService.createEvent(data))}>
            <div className="fgp"><label>Event Name</label><input name="name" type="text" required /></div>
            <div className="fg"><div className="fgp"><label>Date</label><input name="event_date" type="date" required /></div><div className="fgp"><label>Time</label><input name="event_time" type="time" required /></div></div>
            <div className="fg"><div className="fgp"><label>Capacity</label><input name="capacity" type="number" min="1" required /></div><div className="fgp"><label>Price (GHS)</label><input name="price" type="number" required /></div></div>
            <div className="fgp"><label>Location</label><input name="location" type="text" required /></div>
            <div className="fgp"><label>Image</label><input name="image" type="file" accept="image/*" /></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => closeModal('addEvtM')}>Cancel</button><button type="submit" className="btn btn-gold">Create Event</button></div>
          </form>
        </Modal>
        <Modal isOpen={modals.editEvtM} onClose={() => { setEditItem(null); closeModal('editEvtM') }} title="Edit Event" subtitle="Update event details">
          <form key={editItem?.id || 'new-evt'} onSubmit={handleUpdate('editEvtM', 'Event', (id, data) => dataService.updateEvent(id, data))}>
            <div className="fgp"><label>Event Name</label><input name="name" type="text" defaultValue={editItem?.name || ''} required /></div>
            <div className="fg"><div className="fgp"><label>Date</label><input name="event_date" type="date" defaultValue={editItem?.event_date || ''} required /></div><div className="fgp"><label>Time</label><input name="event_time" type="time" defaultValue={editItem?.time || ''} required /></div></div>
            <div className="fg"><div className="fgp"><label>Capacity</label><input name="capacity" type="number" min="1" defaultValue={editItem?.capacity || ''} required /></div><div className="fgp"><label>Price (GHS)</label><input name="price" type="number" defaultValue={editItem?.price ? parseFloat(String(editItem.price).replace(/,/g, '')) : ''} required /></div></div>
            <div className="fgp"><label>Location</label><input name="location" type="text" defaultValue={editItem?.location || ''} required /></div>
            <div className="fgp"><label>Image</label><input name="image" type="file" accept="image/*" /></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => { setEditItem(null); closeModal('editEvtM') }}>Cancel</button><button type="submit" className="btn btn-gold">Save Changes</button></div>
          </form>
        </Modal>
      </>
    )
  }

  function VipManagement() {
    const [vipConfig, setVipConfigState] = useState(loadVipConfig)
    const [vipDirty, setVipDirty] = useState(false)

    const updatePackagePrice = (id, newPrice) => {
      setVipConfigState(prev => ({
        ...prev,
        packages: prev.packages.map(p => p.id === id ? { ...p, price: parseInt(newPrice) || 0 } : p)
      }))
      setVipDirty(true)
    }

    const updatePackageDesc = (id, newDesc) => {
      setVipConfigState(prev => ({
        ...prev,
        packages: prev.packages.map(p => p.id === id ? { ...p, desc: newDesc } : p)
      }))
      setVipDirty(true)
    }

    const updateConciergeFee = (fee) => {
      setVipConfigState(prev => ({ ...prev, conciergeFee: parseInt(fee) || 0 }))
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

  function PaymentsSection() {
    const completedP = d.payments.filter(p => p.status === 'completed').length
    const pendingP = d.payments.filter(p => p.status === 'pending').length
    const failedP = d.payments.filter(p => p.status === 'failed').length
    const refundP = d.payments.filter(p => p.status === 'refunded').length
    return (
      <>
        <div className="ph"><h2>Payment Monitoring <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.payments.length} transactions)</span></h2><div className="ph-a"><button className="btn btn-gold btn-sm" onClick={() => addToast('Paystack payout initiated', 'success')}><i className="fas fa-money-bill-transfer"></i> Payout</button></div></div>
        <div className="ov-grid" style={{ marginBottom: '22px' }}>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(52,211,153,.12)', color: 'var(--green)' }}><i className="fas fa-check-circle"></i></div><div className="sv">{completedP}</div><div className="sl">Successful</div></div>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(232,133,61,.12)', color: 'var(--orange)' }}><i className="fas fa-clock"></i></div><div className="sv">{pendingP}</div><div className="sl">Pending</div></div>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(248,113,113,.12)', color: 'var(--red)' }}><i className="fas fa-times-circle"></i></div><div className="sv">{failedP}</div><div className="sl">Failed</div></div>
          <div className="sc glass"><div className="si" style={{ background: 'rgba(200,164,86,.12)', color: 'var(--gold)' }}><i className="fas fa-undo"></i></div><div className="sv">{refundP}</div><div className="sl">Refunds</div></div>
        </div>
        <div className="ftc glass">
          {d.payments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No payments found</div>
          ) : (
            <table className="dt"><thead><tr><th>Transaction ID</th><th>Customer</th><th>Service</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {d.payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--gray-200)' }}>{p.id}</td>
                    <td><div className="uc">{renderAvatar(p.id, 26)}<div><div className="un">{p.customer}</div></div></div></td>
                    <td>{p.service}</td><td><span className="amt">GH₵{p.amount}</span></td><td>{p.method}</td><td>{p.date}</td>
                    <td><span className={`sb2 ${stCls(p.status)}`}>{p.status}</span></td>
                    <td><div className="ta"><button title="View" onClick={() => setViewItem(p)}><i className="fas fa-eye"></i></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    )
  }

  function PromotionsSection() {
    return (
      <>
        <div className="ph"><h2>Promotions & Discounts <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({d.promotions.length} active)</span></h2><div className="ph-a"><button className="btn btn-gold btn-sm" onClick={() => openModal('addPromoM')}><i className="fas fa-plus"></i> Create Promo</button></div></div>
        {d.promotions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No promotions found</div>
        ) : d.promotions.map((p, i) => (
          <div key={i} className="pc glass">
            <div className="pcd">{p.code}</div>
            <div className="pinfo"><div className="pn">{p.name}</div><div className="pdt">{p.desc} &mdash; Uses: {p.uses}</div></div>
            <div style={{ marginRight: '8px' }}><span className={`sb2 ${stCls(p.status)}`}>{p.status}</span></div>
            <div className="ta">
              <button title="Edit" onClick={() => { setEditItem({ ...p }); openModal('editPromoM') }}><i className="fas fa-pen"></i></button>
              <button className="del" onClick={() => handleDelete(p.id, p.code, dataService.deletePromotion)}><i className="fas fa-trash"></i></button>
            </div>
          </div>
        ))}
        <Modal isOpen={modals.addPromoM} onClose={() => closeModal('addPromoM')} title="Create Promotion" subtitle="Set up a discount or coupon">
          <form onSubmit={handleCreate('addPromoM', 'Promotion', (data) => dataService.createPromotion(data))}>
            <div className="fgp"><label>Promo Code</label><input name="code" type="text" style={{ textTransform: 'uppercase' }} required /></div>
            <div className="fgp"><label>Name</label><input name="name" type="text" required /></div>
            <div className="fgp"><label>Description</label><input name="desc" type="text" required /></div>
            <div className="fg"><div className="fgp"><label>Discount Type</label><select name="discountType"><option>Percentage</option><option>Fixed Amount</option></select></div><div className="fgp"><label>Value</label><input name="value" type="number" required /></div></div>
            <div className="fgp"><label>Max Uses</label><input name="maxUses" type="number" defaultValue={1000} required /></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => closeModal('addPromoM')}>Cancel</button><button type="submit" className="btn btn-gold">Create Promo</button></div>
          </form>
        </Modal>
        <Modal isOpen={modals.editPromoM} onClose={() => { setEditItem(null); closeModal('editPromoM') }} title="Edit Promotion" subtitle="Update promotion details">
          <form key={editItem?.id || 'new-promo'} onSubmit={handleUpdate('editPromoM', 'Promotion', (id, data) => dataService.updatePromotion(id, data))}>
            <div className="fgp"><label>Promo Code</label><input name="code" type="text" style={{ textTransform: 'uppercase' }} defaultValue={editItem?.code || ''} required /></div>
            <div className="fgp"><label>Name</label><input name="name" type="text" defaultValue={editItem?.name || ''} required /></div>
            <div className="fgp"><label>Description</label><input name="desc" type="text" defaultValue={editItem?.desc || ''} required /></div>
            <div className="fg"><div className="fgp"><label>Discount Type</label><select name="discountType" defaultValue={editItem?.discountType || 'Percentage'}><option>Percentage</option><option>Fixed Amount</option></select></div><div className="fgp"><label>Value</label><input name="value" type="number" defaultValue={editItem?.value || ''} required /></div></div>
            <div className="fgp"><label>Max Uses</label><input name="maxUses" type="number" defaultValue={editItem?.maxUses || 1000} required /></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => { setEditItem(null); closeModal('editPromoM') }}>Cancel</button><button type="submit" className="btn btn-gold">Save Changes</button></div>
          </form>
        </Modal>
      </>
    )
  }

  function ComplaintsSection() {
    return (
      <>
        <div className="ph"><h2>Complaint Management <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>({pendingComplaints.length} open)</span></h2></div>
        <div className="ftc glass">
          {d.complaints.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No complaints found</div>
          ) : (
            <table className="dt"><thead><tr><th>ID</th><th>User</th><th>Subject</th><th>Priority</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {d.complaints.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--gray-200)' }}>{c.id}</td>
                    <td><div className="uc"><div><div className="un">{c.user}</div></div></div></td>
                    <td style={{ maxWidth: '240px' }}>{c.subject}</td>
                    <td><span style={{ color: prCl[c.priority], fontWeight: 700, fontSize: '.76rem' }}>{c.priority}</span></td>
                    <td>{c.date}</td>
                    <td><span className={`sb2 ${stCls(c.status)}`}>{c.status}</span></td>
                    <td><div className="ta"><button title="View" onClick={() => setViewItem(c)}><i className="fas fa-eye"></i></button><button title="Edit" onClick={() => { setEditItem({ ...c }); openModal('editCompM') }}><i className="fas fa-pen"></i></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Modal isOpen={modals.editCompM} onClose={() => { setEditItem(null); closeModal('editCompM') }} title="Update Complaint" subtitle="Change complaint status">
          <form key={editItem?.id || 'new-comp'} onSubmit={handleUpdate('editCompM', 'Complaint', (id, data) => dataService.updateComplaint(id, data))}>
            <div className="fgp"><label>Complaint ID</label><input type="text" defaultValue={editItem?.id || ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="fgp"><label>User</label><input type="text" defaultValue={editItem?.user || ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="fgp"><label>Subject</label><input type="text" defaultValue={editItem?.subject || ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="fgp"><label>Status</label><select name="status" defaultValue={editItem?.status || 'open'}><option>open</option><option>in-progress</option><option>resolved</option><option>closed</option></select></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => { setEditItem(null); closeModal('editCompM') }}>Cancel</button><button type="submit" className="btn btn-gold">Update Status</button></div>
          </form>
        </Modal>
      </>
    )
  }

  function NotificationsSection() {
    return (
      <>
        <div className="ph"><h2>Notification Center</h2><div className="ph-a"><button className="btn btn-outline btn-sm" onClick={() => addToast('All marked as read', 'success')}><i className="fas fa-check-double"></i> Mark All Read</button><button className="btn btn-gold btn-sm" onClick={() => openModal('sendNotifM')}><i className="fas fa-paper-plane"></i> Send Notification</button></div></div>
        {d.notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No notifications</div>
        ) : d.notifications.map((n, i) => (
          <div key={i} className="ai" style={{ opacity: n.read ? 0.6 : 1 }}>
            <div className="ai-ic" style={{ background: `${n.color}22`, color: n.color }}><i className={`fas ${n.icon}`}></i></div>
            <div style={{ flex: 1 }}>
              <div className="ai-t"><strong>{n.title}</strong><br />{n.message}</div>
              <div className="ai-tm">{n.time}{!n.read && ` \u2014 New`}</div>
            </div>
          </div>
        ))}
        <Modal isOpen={modals.sendNotifM} onClose={() => closeModal('sendNotifM')} title="Send Notification" subtitle="Broadcast to users">
          <form onSubmit={handleCreate('sendNotifM', 'Notification', (data) => dataService.createNotification(data))}>
            <div className="fgp"><label>Target</label><select name="target"><option>All Users</option><option>Customers Only</option></select></div>
            <div className="fgp"><label>Title</label><input name="title" type="text" required /></div>
            <div className="fgp"><label>Message</label><textarea name="message" rows="4" required></textarea></div>
            <div className="ma"><button type="button" className="btn btn-outline" onClick={() => closeModal('sendNotifM')}>Cancel</button><button type="submit" className="btn btn-gold"><i className="fas fa-paper-plane"></i> Send</button></div>
          </form>
        </Modal>
      </>
    )
  }

  function SettingsSection() {
    const activeTab = stTabs.find(t => t.id === settingsTab) || stTabs[0]
    return (
      <>
        <div className="ph"><h2>Platform Settings</h2></div>
        <div className="st-grid">
          <div className="st-nav">
            {stTabs.map(t => (
              <button key={t.id} className={settingsTab === t.id ? 'active' : ''} onClick={() => setSettingsTab(t.id)}>
                <i className={`fas ${t.icon}`}></i> {t.label}
              </button>
            ))}
          </div>
          <div className="st-p glass">{activeTab.content()}</div>
        </div>
      </>
    )
  }

  const currentPageInfo = pages.find(p => p.id === currentPage)

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <Overview />
      case 'analytics': return <Analytics />
      case 'users': return <Users />
      case 'restaurants': return <RestaurantsSection />
      case 'venues': return <VenuesSection />
      case 'menu': return <MenuSection />
      case 'orders': return <OrdersSection />
      case 'bookings': return <BookingsSection />
      case 'events': return <EventsSectionAdmin />
      case 'vip': return <VipManagement />
      case 'payments': return <PaymentsSection />
      case 'promotions': return <PromotionsSection />

      case 'complaints': return <ComplaintsSection />
      case 'notifications': return <NotificationsSection />
      case 'settings': return <SettingsSection />
      default: return <Overview />
    }
  }

  return (
    <div className="dashboard">
      {mobOpen && <div className="mob-ov show" onClick={closeMob}></div>}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobOpen ? ' mopen' : ''}`}>
        <div className="sb-head"><div className="sb-logo"><span className="li">AE</span><span>Admin Panel</span></div></div>
        <nav className="sb-nav">
          {navSections.map(section => (
            <div key={section.title} className="ns">
              <div className="ns-t">{section.title}</div>
              {section.items.map(id => {
                const p = pages.find(pp => pp.id === id)
                return (
                  <div key={id} className={`ni${currentPage === id ? ' active' : ''}`} onClick={() => go(id)}>
                    <i className={`fas ${p.icon}`}></i><span>{p.label}</span>
                    {p.badge && <span className="bdg">{p.badge}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sb-foot">
          <div className="sb-user">
            <div className="av">SA</div>
            <div className="ui"><div className="un">Super Admin</div><div className="ur">admin@aisha.events</div></div>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="tb-l">
            <button className="tb-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar"><i className="fas fa-bars"></i></button>
            <h1 className="pg-title">{currentPageInfo?.label || 'Overview'}</h1>
          </div>
          <div className="tb-r">
            <div className="tb-search"><i className="fas fa-search"></i><input type="text" placeholder="Search anything..." /></div>
            <button className="thm-tog" onClick={toggleTheme} aria-label="Toggle theme"><i className={`fas fa-${theme === 'dark' ? 'moon' : 'sun'}`}></i></button>
            <button className="tb-icon" aria-label="Notifications" onClick={() => go('notifications')}><i className="fas fa-bell"></i><span className="nd"></span></button>
            <button className="tb-icon" onClick={() => { logout(); navigate('/') }} aria-label="Logout"><i className="fas fa-sign-out-alt"></i></button>
          </div>
        </header>
        <div className="pg-c">
          <div className="pg-s active">
            {renderPage()}
          </div>
        </div>
      </div>
      <ViewModal item={viewItem} onClose={() => setViewItem(null)} />
    </div>
  )
}
