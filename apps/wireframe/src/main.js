const screens = [
  { id: 'onboarding-welcome', name: '1. Welcome', category: 'Onboarding' },
  { id: 'onboarding-addresses', name: '2. Address Types', category: 'Onboarding' },
  { id: 'onboarding-seed', name: '3. Recovery Phrase', category: 'Onboarding' },
  { id: 'onboarding-confirm', name: '4. Confirm Phrase', category: 'Onboarding' },
  { id: 'onboarding-dust', name: '5. Setup DUST', category: 'Onboarding' },
  { id: 'onboarding-password', name: '6. Set Password', category: 'Onboarding' },
  { id: 'home-dashboard', name: '7. Dashboard', category: 'Main' },
  { id: 'night-holdings', name: '8. NIGHT Holdings', category: 'Assets' },
  { id: 'dust-management', name: '9. DUST Management', category: 'Assets' },
  { id: 'address-management', name: '10. Addresses', category: 'Assets' },
  { id: 'send-choose', name: '11. Send - Choose', category: 'Transactions' },
  { id: 'send-night', name: '12. Send NIGHT', category: 'Transactions' },
  { id: 'send-dust', name: '13. Send DUST', category: 'Transactions' },
  { id: 'send-confirm', name: '14. Confirm TX', category: 'Transactions' },
  { id: 'send-success', name: '15. TX Success', category: 'Transactions' },
  { id: 'receive-choose', name: '16. Receive - Choose', category: 'Transactions' },
  { id: 'receive-address', name: '17. Receive Address', category: 'Transactions' },
  { id: 'history-list', name: '18. TX History', category: 'History' },
  { id: 'history-dust-detail', name: '19. DUST TX Detail', category: 'History' },
  { id: 'history-night-detail', name: '20. NIGHT TX Detail', category: 'History' },
  { id: 'dust-generation', name: '21. DUST Generation', category: 'History' },
  { id: 'settings-address', name: '22. Address Settings', category: 'Settings' },
  { id: 'settings-privacy', name: '23. Privacy Settings', category: 'Settings' },
  { id: 'settings-dust', name: '24. DUST Settings', category: 'Settings' },
  { id: 'settings-security', name: '25. Security', category: 'Settings' },
  { id: 'settings-about', name: '26. About', category: 'Settings' }
]

const mainScreens = ['home-dashboard', 'night-holdings', 'dust-management', 'address-management', 'history-list']

let headerHtml = ''
let footerHtml = ''

async function loadComponents() {
  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch('/src/components/header-main.html'),
      fetch('/src/components/footer-nav.html')
    ])
    headerHtml = await headerRes.text()
    footerHtml = await footerRes.text()
  } catch (e) {
    console.warn('Failed to load components:', e)
  }
}

function buildNavigation() {
  const navList = document.getElementById('nav-list')
  let currentCategory = ''

  screens.forEach(screen => {
    if (screen.category !== currentCategory) {
      currentCategory = screen.category
      const categoryEl = document.createElement('div')
      categoryEl.className = 'text-xs font-semibold text-midnight-400 uppercase tracking-wider mt-4 mb-2 first:mt-0'
      categoryEl.textContent = currentCategory
      navList.appendChild(categoryEl)
    }

    const button = document.createElement('button')
    button.className = 'w-full text-left px-3 py-2 rounded-lg text-sm text-midnight-200 hover:bg-white/5 hover:text-white transition-colors duration-150'
    button.dataset.screen = screen.id
    button.textContent = screen.name
    button.addEventListener('click', () => loadScreen(screen.id))
    navList.appendChild(button)
  })
}

function updateFooterActiveState(screenId) {
  const footer = document.querySelector('footer')
  if (!footer) return

  footer.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active')
    if (item.dataset.navigate === screenId ||
        (screenId === 'home-dashboard' && item.dataset.navigate === 'home-dashboard') ||
        (screenId.startsWith('history') && item.dataset.navigate === 'history-list') ||
        (screenId.startsWith('send') && item.dataset.navigate === 'send-choose') ||
        (screenId === 'address-management' && item.dataset.navigate === 'address-management')) {
      item.classList.add('active')
    }
  })
}

async function loadScreen(screenId) {
  const container = document.getElementById('screen-container')

  document.querySelectorAll('#nav-list button').forEach(btn => {
    btn.classList.remove('bg-night/20', 'text-night')
    if (btn.dataset.screen === screenId) {
      btn.classList.add('bg-night/20', 'text-night')
    }
  })

  try {
    const response = await fetch(`/src/screens/${screenId}.html`)
    if (!response.ok) throw new Error('Screen not found')
    const html = await response.text()

    const isMainScreen = mainScreens.includes(screenId)

    if (isMainScreen && headerHtml && footerHtml) {
      container.innerHTML = `
        <div class="flex flex-col h-full bg-midnight-900">
          ${headerHtml}
          <div class="flex-1 overflow-y-auto scrollbar-hide">
            ${html}
          </div>
          ${footerHtml}
        </div>
      `
      updateFooterActiveState(screenId)
    } else {
      container.innerHTML = html
    }

    container.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', () => loadScreen(el.dataset.navigate))
    })
  } catch (error) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-midnight-700 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-midnight-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
        </div>
        <p class="text-midnight-400">Screen: ${screenId}</p>
        <p class="text-xs text-midnight-500 mt-1">Coming soon</p>
      </div>
    `
  }
}

async function init() {
  await loadComponents()
  buildNavigation()
  loadScreen('home-dashboard')
}

init()
