# Phantom Wallet UI/UX Patterns Research

**Date:** 2025-12-09 | **Status:** Active in Production (15M+ MAU, $3B valuation 2025)

---

## 1. Navigation Structure

### Main Screens & Layout
- **Vertical mobile-like interface**: No full-screen option (browser extension constraint)
- **Bottom nav bar**: 3-tab model - Wallet (primary), Swap, Settings
- **Header structure**: App name + ghost logo, account selector, settings icon
- **Multichain visibility**: All assets from supported chains (Solana, Ethereum, Bitcoin, Base, Polygon) unified in one place; chain switching is invisible to user

### Information Architecture
```
Primary Entry → Wallet View (balances + token list)
              → Swap (token exchange)
              → Settings (account mgmt, security, advanced)

Connection Flow → dApp approval → Signing prompts
```

---

## 2. Visual Design Patterns

### Color System
- **Primary**: Deep purple (#3B1E90 reference)
- **Accent colors**: Vibrant purples complemented by bright contrast colors
- **Dark mode**: Dark backgrounds with light text (primary aesthetic)
- **Token/chain indicators**: Circular coin icons with distinct colors per asset

### Typography
- **Custom typeface**: "Phantom" (F37 Foundry collaboration)
- **Properties**: Rounded, expressive, digital-first; clean geometry with angled terminals
- **Hierarchy**: Weight-based differentiation for sections, readable at small extension sizes

### Spacing & Layout
- **Card-based layout**: Minimal margins, touch-friendly (mobile-first)
- **Vertical scrolling**: Asset lists stack vertically
- **Action buttons**: Full-width or prominent placement ("Send", "Receive", "Swap")
- **Consistent padding**: Breathing room without excessive whitespace in compact interface

---

## 3. Key UI Components

### Balance Cards
- **Display format**: Icon + Asset name + Balance in USD equivalent
- **Real-time data**: Price updates via SimpleHash integration
- **Sortable/filterable**: "Manage token list" toggle-based UI
- **Search capability**: Quick token lookup by name or symbol

### Token Lists
- **Scrollable grid**: Vertical list of holdings
- **Per-asset row**: [Icon] [Name] [Balance] [USD Value]
- **Hidden tokens feature**: Users toggle visibility of specific tokens
- **Default view**: Major cryptocurrencies (SOL, ETH, BTC) pre-shown

### Transaction Confirmations
- **Preview summary**: Human-readable breakdown ("Send 2 SOL to address...")
- **Address highlighting**: Clear source & destination fields
- **Amount visualization**: Prominent display with unit labels
- **Anomaly flags**: Suspicious transaction detection pre-approval (Blowfish integration)
- **No blind-signing**: Full transparency before user consent

### dApp Connection Approvals
- **Permission matrix**: Explicit controls for each permission type
- **Spending limits**: Users set max amounts per dApp (fine-grained access control)
- **Account selection**: Users choose which account to connect (multi-account support)
- **URL verification**: dApp domain prominently displayed for trust verification
- **Disconnect option**: Easy revocation of app access

---

## 4. DApp Connection Flow UI

### Browser Extension Flow
```
User clicks "Connect" on dApp
         ↓
Extension detects Phantom
         ↓
Authorization prompt appears
         ↓
Permission review screen (what can app do?)
         ↓
Account selector (pick account to expose)
         ↓
"Connect" confirmation
         ↓
Callback with public key to dApp
```

### Mobile Flow
- **In-app browser required**: Phantom's own browser for secure connection
- **Modal presentation**: Phantom modal overlays dApp UI
- **Tap-to-connect**: Streamlined single-tap approval after review
- **Deeplink support**: React SDK auto-handles mobile routing

### Key Approval Elements
- **Verified dApp URL**: Domain shown prominently
- **Permission clarity**: Checkbox/toggle for each permission
- **Budget controls**: Optional spending caps per dApp
- **Revocation UI**: "Disconnect" action in settings or app list

---

## 5. Transaction Signing UI Patterns

### Enhanced Prompts (Recent UX Improvement)
- **Plain English impact**: "Approving this token transfer allows dApp X to spend your tokens"
- **Address verification**: Destination address highlighted with truncation
- **Amount warning**: Large transactions flagged visually
- **Program instructions**: Readable breakdown of what blockchain code executes

### Signing Methods
- **signAndSendTransaction**: Sign + broadcast in one action (common path)
- **signTransaction**: Sign only (dApp broadcasts separately)
- **signAllTransactions**: Batch signing for multiple transactions (no auto-broadcast)
- **Reject option**: Prominent cancel/reject button always visible

### Error Handling in Signing UI
- **Invalid address detection**: Error badge before signing
- **Network mismatches**: Warning if chain selected ≠ dApp requirement
- **Insufficient balance**: Pre-flight validation with clear message
- **Hardware wallet flow**: Ledger integration supports blind-signing opt-in

---

## 6. Error & Loading States

### Loading States
- **Spinner indicators**: Animated loading during balance sync
- **SimpleHash integration**: Real-time price fetching (visual feedback)
- **Transaction broadcast**: "Processing..." state with estimated time
- **Skeleton screens**: Placeholder cards during initial load

### Error States
- **Transaction failed**: Clear reason + retry option
- **Network error**: Offline indicator + reconnect prompt
- **Invalid input**: Inline validation (red text, icon)
- **Phishing detection**: Red warning banner with dApp URL + "Not verified"
- **Insufficient gas**: Gas fee estimate with upgrade path
- **Token not found**: Helpful message + link to add custom token

### Success States
- **Transaction confirmed**: Checkmark + block explorer link
- **dApp connected**: Confirmation modal + added to trusted list
- **Token added**: Toast notification with dismissal
- **Balance updated**: Smooth transition animation

---

## Onboarding Context
- **Create or import**: Social login (email) vs. seed phrase options
- **Account recovery**: Private key, recovery phrase, hardware wallet, social login all supported
- **Security-first messaging**: Encryption guarantees, key management clarity

## Platform Consistency
- **Cross-platform**: Chrome, Firefox, Brave, Edge (browser) + iOS/Android (native)
- **Feature parity**: Most features mirrored across desktop & mobile
- **Responsive design**: Adaptive layout for extension popup → full-screen mobile

---

## Key Takeaways for Wallet UI Design

1. **Minimize cognitive load**: Multichain support hidden; users see unified asset view
2. **Transaction transparency**: Never hide what users are signing; use plain language
3. **Progressive disclosure**: Basic view for beginners; advanced settings for power users
4. **Security-centric feedback**: Proactive anomaly detection + clear warnings before approval
5. **Accessibility**: Keyboard nav, screen-reader support, localization built-in
6. **Mobile-first constraints**: Design for small vertical interface; desktop is same viewport
7. **Rapid feedback**: Real-time balance updates, instant transaction previews, quick connection flows

---

## Sources

- [Phantom Developer Documentation - Wallet SDK Overview](https://phantom-page.pages.dev/)
- [Phantom - Browser SDK Sign & Send Transactions](https://docs.phantom.com/sdks/browser-sdk/sign-and-send-transaction)
- [Introducing Phantom's New Brand Identity](https://phantom.com/learn/blog/introducing-phantom-s-new-brand-identity)
- [How to Connect to dApps Using Phantom Wallet](https://help.phantom.com/hc/en-us/articles/29995498642195-How-to-Connect-to-dApps-Using-Phantom-Wallet)
- [Phantom UI Component Examples](https://nicelydone.club/apps/phantom/components)
- [Phantom Crypto Wallet Companion - Figma](https://www.figma.com/community/file/1478635889310097876/phantom-crypto-wallet-companion)
- [GitHub - Phantom Wallet SDK](https://github.com/phantom/wallet-sdk)
- [Phantom Logos & Assets Documentation](https://docs.phantom.com/resources/assets)
- [How to Create a Wallet like Phantom - SoluLab](https://www.solulab.com/how-to-create-wallet-like-phantom/)
- [What is Phantom Wallet - Cointelegraph](https://cointelegraph.com/news/what-is-a-phantom-wallet-how-to-set-up-and-use-it)
