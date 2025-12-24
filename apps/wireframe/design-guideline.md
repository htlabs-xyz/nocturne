# Design Guideline: Midnight Network Wallet Extension

Hướng dẫn thiết kế hoàn chỉnh cho việc xây dựng wireframe ví Midnight blockchain extension. Tối ưu hóa cho hệ thống địa
chỉ đặc biệt (Shield, Unshield, Dust) và dual-token system (NIGHT & DUST).

## I. Midnight Network - Những Điểm Khác Biệt

### 1.1 Cấu Trúc Địa Chỉ Đặc Thù (3 Loại)

**Unshielded Address (NIGHT Address)**

- Công khai, hiển thị trên blockchain
- Lưu giữ NIGHT tokens
- Dùng để quản lý NIGHT
- Visible trên block explorer
- Dùng để designate DUST generation
- VD: `addr1qy...` (Cardano format) hoặc Midnight format

**Shielded Address (Shield Address)**

- Riêng tư, che giấu giao dịch
- Lưu giữ DUST
- Nhận DUST được generate từ NIGHT
- Metadata giao dịch không công khai
- Không hiển thị trên blockchain
- Dùng để thực hiện giao dịch ẩn danh

**Dust Address (Capacity/Receipt Address)**

- Nhận DUST được generate bởi NIGHT holding
- Có thể designate từ bất kỳ địa chỉ nào (không nhất thiết là chủ sở hữu)
- DUST accumulates lên đến limit proportional với NIGHT balance
- DUST decays nếu bị disconnect từ NIGHT
- Non-transferable (DUST không thể gửi giữa các địa chỉ)

### 1.2 Token System - NIGHT vs DUST

| Thuộc Tính            | NIGHT                             | DUST                                 |
| --------------------- | --------------------------------- | ------------------------------------ |
| **Vai trò**           | Governance token + DUST generator | Capacity resource (transaction fuel) |
| **Loại**              | Unshielded (công khai)            | Shielded (riêng tư)                  |
| **Transferable**      | Yes                               | No                                   |
| **Dùng để giao dịch** | No                                | Yes                                  |
| **Supply**            | 24 billion (fixed)                | Unlimited, renewable                 |
| **Decay**             | No                                | Yes (nếu bị detach)                  |
| **Privacy**           | Public transactions               | Private metadata                     |
| **Generate từ**       | -                                 | NIGHT holdings                       |

**DUST Generation Flow:**

```
User holds NIGHT
    ↓
Designates Shield Address (DUST recipient)
    ↓
DUST generates continuously over time
    ↓
DUST accumulates up to cap
    ↓
Use DUST for transactions (DUST consumed)
    ↓
DUST regenerates automatically
```

### 1.3 Nguyên Tắc Thiết Kế Cho Midnight

- **Privacy-First**: Hiển thị rõ Shield vs Unshield address
- **Transparency on DUST**: Giải thích DUST generation, decay mechanism
- **Dual-Address Management**: User cần manage 2-3 địa chỉ (NIGHT, Shield, DUST recipient)
- **Capacity Model**: Thay vì gas fees, show DUST consumption & regeneration
- **Rational Privacy**: Cho phép user lựa chọn public vs private transactions

---

## II. Information Architecture (IA) - Cấu Trúc Riêng Cho Midnight

### 2.1 Main Navigation Structure

```
Midnight Wallet Extension
├── Onboarding Flow
│   ├── Welcome Screen
│   ├── Create / Import Wallet
│   ├── Backup Seed Phrase
│   ├── Setup Addresses (NIGHT, Shield, DUST)
│   └── Set Password
├── Home / Dashboard
│   ├── NIGHT Balance (Unshielded)
│   ├── DUST Status & Generation Rate
│   ├── Shield Address Setup Status
│   └── Quick Actions
├── Assets Management
│   ├── NIGHT Holdings
│   ├── DUST Balance & Generation
│   └── Manage Addresses
├── Transactions
│   ├── Send NIGHT (Unshielded)
│   ├── Send DUST (Shielded)
│   ├── Receive NIGHT
│   ├── Receive DUST / Shield Address
│   ├── History (with Privacy Filter)
│   └── DUST Generation History
├── Address Management
│   ├── My Addresses
│   │   ├── NIGHT Address (Unshielded)
│   │   ├── Shield Address (Shielded)
│   │   └── DUST Recipient Configuration
│   ├── View Address Details
│   ├── Designate DUST Recipient
│   └── Import Secondary Addresses
├── DUST & Capacity
│   ├── DUST Balance & Cap
│   ├── Generation Rate (NIGHT → DUST)
│   ├── Decay Information
│   ├── Transaction Cost Estimator
│   └── DUST Settings
├── Settings
│   ├── Security (Password, Seed Backup)
│   ├── Privacy Settings
│   ├── Address Preferences
│   ├── Display Settings
│   └── About & Help
└── DApp Connection
    ├── Connected dApps
    ├── Permissions
    └── Transaction Confirmations
```

### 2.2 Key Flows Unique to Midnight

**DUST Generation Setup Flow:**

```
User creates wallet
    ↓
Generates NIGHT address
    ↓
Creates Shield address
    ↓
Designates Shield address as DUST recipient
    ↓
DUST begins generating continuously
    ↓
DUST cap = proportional to NIGHT balance
```

**Address Configuration Screen Flow:**

```
User selects "Setup Addresses"
    ↓
View/Copy NIGHT address (unshielded)
    ↓
View/Copy Shield address (shielded)
    ↓
Confirm DUST recipient (Shield address)
    ↓
Monitor DUST generation rate
```

---

## III. Wireframe Chi Tiết - Screens Dành Cho Midnight

### SCREEN 1: ONBOARDING - Welcome & Network Info

**Mục đích**: Giới thiệu Midnight Network's privacy model

**Thành phần chính**:

- Logo Midnight
- Heading: "Welcome to Midnight Wallet"
- Subtext: "Private transactions. Zero-knowledge privacy."
- Key features:
  - 🔒 Shield Addresses - Private transactions
  - 💎 NIGHT Tokens - Governance
  - ⚡ DUST Generation - Transaction fuel
- CTA: "Create New Wallet" | "Import Wallet"

---

### SCREEN 2: ONBOARDING - Address Architecture Explanation

**Mục đích**: Giải thích 3 loại địa chỉ trước khi tạo

**Thành phần chính**:

- Step indicator (Step 1/5)
- Title: "Understand Your Addresses"
- Card layout explaining 3 address types:

**Card 1 - NIGHT Address (Unshielded)**

```
💳 NIGHT Address
├─ Loại: Public/Unshielded
├─ Chứa: NIGHT tokens
├─ Visible: On blockchain (everyone can see)
└─ Dùng để: Governance, DUST generation
```

**Card 2 - Shield Address (Shielded)**

```
🔒 Shield Address
├─ Loại: Private/Shielded
├─ Chứa: DUST tokens
├─ Visible: Hidden (private metadata)
└─ Dùng để: Private transactions
```

**Card 3 - DUST Recipient**

```
⚡ DUST Generation
├─ NIGHT generates DUST continuously
├─ DUST goes to: Shield Address
├─ Accumulates up to: Cap (based on NIGHT amount)
└─ Decays if: Disconnected from NIGHT
```

- Next button
- "Learn more" link to docs

---

### SCREEN 3: ONBOARDING - Create Wallet & Backup

**Mục đích**: Tạo wallet, backup seed phrase

**Thành phần chính**:

- Step indicator (Step 2/5)
- Heading: "Your Recovery Phrase"
- Warning: "This phrase controls both NIGHT and Shield addresses"
- Seed phrase display (12/24 words)
- Copy button
- Checkbox confirmation
- Next button

---

### SCREEN 4: ONBOARDING - Confirm Seed Phrase

**Mục đích**: Xác nhận user backup đúng

**Thành phần chính**:

- Step indicator (Step 3/5)
- Heading: "Confirm Your Recovery Phrase"
- Subtext: "Select words in correct order"
- Random word grid (user clicks in order)
- Progress indicator
- Next button

---

### SCREEN 5: ONBOARDING - Setup DUST Generation

**Mục đích**: Thiết lập DUST generation từ NIGHT

**Thành phần chính**:

- Step indicator (Step 4/5)
- Heading: "Setup DUST Generation"
- Explanation box: "Your NIGHT tokens will automatically generate DUST. DUST fuels private transactions on Midnight.
  This cannot be undone - choose carefully."
- Shield Address display (auto-generated)
  - Copy button
  - QR code
- DUST generation preview:
  - "Your NIGHT balance: [amount]"
  - "Estimated DUST generation: [amount/day]"
  - "DUST cap: [max amount]"
  - "Decay timeout: [days]"
- Checkbox: "I understand DUST generation & decay"
- Next button

---

### SCREEN 6: ONBOARDING - Set Password

**Mục đích**: Bảo vệ wallet với password

**Thành phần chính**:

- Step indicator (Step 5/5)
- Heading: "Create Master Password"
- Subtext: "Protects both NIGHT and Shield addresses"
- Password input fields (password + confirm)
- Strength indicator
- Requirements checklist
- "Complete Setup" button

---

### SCREEN 7: HOME - Dashboard

**Mục đích**: Tổng quan tài sản, balance, DUST status

**Layout**:

```
┌──────────────────────────────┐
│ [≡] Midnight Wallet          │
├──────────────────────────────┤
│ NIGHT Balance                │
│ 2.5 NIGHT                    │
│ ≈ $5,000 USD                 │
│ +2.3% (24h) 📈               │
├──────────────────────────────┤
│ DUST Status & Capacity       │
│ ████████░░ 800/1000          │
│ DUST: 800 | CAP: 1000        │
│ Generating: 50/day           │
│ Status: ✅ Active            │
├──────────────────────────────┤
│ [Send NIGHT] [Receive] [+]   │
├──────────────────────────────┤
│ Quick Info                   │
│ NIGHT Address: 0x1234... [c] │
│ Shield Address: (Private)    │
│ DUST Recipient: (Set)        │
├──────────────────────────────┤
│ Recent Activity              │
│ ↓ Received DUST (+200)       │
│ → Used DUST (-50) Private    │
│ [View All →]                 │
└──────────────────────────────┘
```

**Thành phần chính**:

- NIGHT balance (public, with value in USD)
- DUST status card:
  - Current DUST balance
  - DUST cap (based on NIGHT)
  - Generation rate (DUST per day/hour)
  - Status: Active/Paused/Decaying
- Quick action buttons
- Address summary (clickable to see full)
- Recent activity (transactions)

---

### SCREEN 8: NIGHT HOLDINGS - Token Details

**Mục đích**: Chi tiết NIGHT balance, DUST generation info

**Layout**:

```
┌──────────────────────────────┐
│ ← NIGHT Token                │
├──────────────────────────────┤
│ [Ⓝ] NIGHT                    │
│ 2.5 NIGHT                    │
│ ≈ $5,000 USD                 │
├──────────────────────────────┤
│ Address: 0x1234... [copy]    │
│ Type: Unshielded (Public)    │
├──────────────────────────────┤
│ DUST Generation              │
│ ├─ Rate: 50 DUST/day         │
│ ├─ Current: 800 DUST         │
│ ├─ Cap: 1,000 DUST           │
│ ├─ Recipient: Shield Addr... │
│ └─ Status: ✅ Active         │
├──────────────────────────────┤
│ ⚠️ Change DUST Recipient?    │
│ [Configure →]                │
├──────────────────────────────┤
│ Transaction History:         │
│ ↓ Received 1 NIGHT (Day 20)  │
│ → Sent 0.5 NIGHT (Day 15)    │
└──────────────────────────────┘
```

---

### SCREEN 9: DUST MANAGEMENT - DUST Status & Capacity

**Mục đích**: Quản lý DUST, xem generation & decay

**Layout**:

```
┌──────────────────────────────┐
│ ← DUST Management            │
├──────────────────────────────┤
│ ⚡ DUST Capacity              │
│ ████████░░ 800/1000          │
│                              │
│ Current: 800 DUST            │
│ Cap: 1,000 DUST              │
│ Generation Rate: 50/day      │
├──────────────────────────────┤
│ Generation Details:          │
│ From NIGHT: 2.5 NIGHT        │
│ Rate: 50 DUST / 24h          │
│ Shield Addr: 0xabcd... [c]   │
│ Status: ✅ Generating        │
├──────────────────────────────┤
│ Decay Information:           │
│ ⚠️ Orphaned DUST decay:      │
│ If DUST disconnected         │
│ from NIGHT, it decays        │
│ within [X days]              │
├──────────────────────────────┤
│ Actions:                     │
│ [Send DUST] [Use in DApp]    │
│ [Change Recipient]           │
└──────────────────────────────┘
```

---

### SCREEN 10: ADDRESS MANAGEMENT - All Addresses

**Mục đích**: View & manage NIGHT, Shield, DUST addresses

**Layout**:

```
┌──────────────────────────────┐
│ ← Address Management         │
├──────────────────────────────┤
│ 💳 NIGHT Address             │
│ (Unshielded / Public)        │
│ 0x1234567890... [copy]       │
│ [QR] [Send] [Details →]      │
├──────────────────────────────┤
│ 🔒 Shield Address            │
│ (Shielded / Private)         │
│ [Hidden by default] [Show]   │
│ [QR] [Receive] [Details →]   │
├──────────────────────────────┤
│ ⚡ DUST Recipient             │
│ Currently: Shield Address    │
│ [Change Recipient →]         │
├──────────────────────────────┤
│ Secondary Addresses:         │
│ [+ Import Another Address]   │
└──────────────────────────────┘
```

---

### SCREEN 11: SEND - Choose Coin Type

**Mục đích**: Chọn giữa send NIGHT (public) hoặc DUST (private)

**Layout**:

```
┌──────────────────────────────┐
│ ← Send                       │
├──────────────────────────────┤
│ What do you want to send?    │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 💳 Send NIGHT (Public)   │ │
│ │                          │ │
│ │ • Visible on blockchain  │ │
│ │ • Balance: 2.5 NIGHT     │ │
│ │ • Fees: In DUST          │ │
│ │ ├─ [Send NIGHT]          │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔒 Send DUST (Private)   │ │
│ │                          │ │
│ │ • Private metadata       │ │
│ │ • Balance: 800 DUST      │ │
│ │ • No fees on DUST spend  │ │
│ │ ├─ [Send DUST]           │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

### SCREEN 12: SEND NIGHT - Recipient & Amount

**Mục đích**: Send NIGHT publicly (with full visibility)

**Layout**:

```
┌──────────────────────────────┐
│ ← Send NIGHT                 │
├──────────────────────────────┤
│ Recipient Address:           │
│ [Unshielded addr input] [QR] │
│ Validation: ✓ Valid          │
├──────────────────────────────┤
│ Amount:                      │
│ [2.5] NIGHT                  │
│ ≈ $5,000 USD                 │
│ Available: 2.5 NIGHT [Max]   │
├──────────────────────────────┤
│ Transaction Type:            │
│ 📋 Public Unshielded         │
│ (Visible on blockchain)      │
├──────────────────────────────┤
│ Network Fee (in DUST):       │
│ [Slow] Standard Fast         │
│ 50 DUST (~$10)               │
├──────────────────────────────┤
│ [Review] [Cancel]            │
└──────────────────────────────┘
```

---

### SCREEN 13: SEND DUST - Recipient & Amount

**Mục đích**: Send DUST privately (shielded metadata)

**Layout**:

```
┌──────────────────────────────┐
│ ← Send DUST (Private)        │
├──────────────────────────────┤
│ Recipient Address:           │
│ [Shield address input] [QR]  │
│ (Your address will be hidden)│
├──────────────────────────────┤
│ Amount:                      │
│ [50] DUST                    │
│ Available: 800 DUST [Max]    │
├──────────────────────────────┤
│ Transaction Type:            │
│ 🔒 Shielded Private          │
│ (Metadata hidden from chain) │
├──────────────────────────────┤
│ Network Fee:                 │
│ No DUST fee (capacity based) │
│ Verify tx: [Proof 🧮]        │
├──────────────────────────────┤
│ Privacy Note:                │
│ ✓ Recipient hidden           │
│ ✓ Amount hidden              │
│ ✓ Metadata private           │
├──────────────────────────────┤
│ [Review] [Cancel]            │
└──────────────────────────────┘
```

---

### SCREEN 14: SEND - Confirmation

**Mục đích**: Final confirmation before sending

**Layout**:

```
┌──────────────────────────────┐
│ Confirm Transaction          │
├──────────────────────────────┤
│ Type: Send NIGHT (Public)    │  ← For NIGHT
│ OR                           │
│ Type: Send DUST (Private)    │  ← For DUST
├──────────────────────────────┤
│ From: 0x1234... [c]          │
│ To: 0x5678... [c]            │
│ Amount: 2.5 / 50 DUST        │
│ Fee: 50 DUST                 │
│ ─────────────────────────    │
│ Total: 2.503 NIGHT           │
├──────────────────────────────┤
│ ⚠️ Privacy Warning:          │  ← For NIGHT only
│ This transaction is PUBLIC   │
│ Everyone can see details     │
├──────────────────────────────┤
│ Password:                    │
│ [••••••••] [👁️]              │
├──────────────────────────────┤
│ [Send] [Cancel]              │
└──────────────────────────────┘
```

---

### SCREEN 15: SEND - Success Confirmation

**Mục đích**: Thông báo giao dịch thành công

**Layout**:

```
┌──────────────────────────────┐
│ ✅ Success!                  │
├──────────────────────────────┤
│ Transaction Submitted        │
│                              │
│ Sent: 2.5 NIGHT / 50 DUST    │
│ To: 0x5678...                │
│ Fee: 50 DUST                 │
├──────────────────────────────┤
│ Hash: 0xabcd... [copy]       │
│ Status: Pending              │
│ Est. 30-60 seconds           │
├──────────────────────────────┤
│ Privacy:                     │
│ 🔒 Metadata shielded (DUST)  │  ← For DUST only
│ OR                           │
│ 📋 Public transaction (NIGHT)│  ← For NIGHT only
├──────────────────────────────┤
│ [View Details] [Done]        │
└──────────────────────────────┘
```

---

### SCREEN 16: RECEIVE - Choose Address Type

**Mục đích**: Chọn nhận NIGHT hoặc DUST

**Layout**:

```
┌──────────────────────────────┐
│ ← Receive                    │
├──────────────────────────────┤
│ What do you want to receive? │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 💳 Receive NIGHT         │ │
│ │ (Public/Unshielded)      │ │
│ │                          │ │
│ │ Address: 0x1234...       │ │
│ │ [QR Code]                │ │
│ │ [Copy] [Share]           │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔒 Receive DUST          │ │
│ │ (Shielded/Private)       │ │
│ │                          │ │
│ │ Address: (Shield Addr)   │ │
│ │ [QR Code]                │ │
│ │ [Copy] [Share]           │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

### SCREEN 17: RECEIVE - Address & QR Code

**Mục đích**: Display receive address với QR code

**Layout**:

```
┌──────────────────────────────┐
│ ← Receive NIGHT / DUST       │
├──────────────────────────────┤
│ Asset: [NIGHT / DUST]        │
│ Type: [Public / Private]     │
├──────────────────────────────┤
│ [Large QR Code]              │
│ (380x380px)                  │
├──────────────────────────────┤
│ Your Address:                │
│ 0x1234567890... [copy]       │
│                              │
│ Only receive [NIGHT/DUST]    │
│ on Midnight network          │
├──────────────────────────────┤
│ [Share] [Request Payment]    │
└──────────────────────────────┘
```

---

### SCREEN 18: TRANSACTION HISTORY

**Mục đích**: Lịch giao dịch với privacy filter

**Layout**:

```
┌──────────────────────────────┐
│ ← Transaction History        │
├──────────────────────────────┤
│ All | NIGHT | DUST | DUST Gen│  ← Tabs
├──────────────────────────────┤
│ [Search] [Filter ▼] [Sort]   │
├──────────────────────────────┤
│ Dec 20                       │
│ ↓ Received DUST (+200) 🔒    │
│   From: Hidden               │
│   Time: 2:30 PM ✓ Confirmed  │
│   [Details →]                │
│                              │
│ ↑ Sent NIGHT (-2.5) 📋       │
│   To: 0x5678...              │
│   Time: 1:15 PM ✓ Confirmed  │
│   [Details →]                │
│                              │
│ ↔️ DUST Generated (+50) ⚡    │
│   From NIGHT: 2.5            │
│   Time: Auto (generation)    │
│   [Details →]                │
│                              │
│ ↓ Received NIGHT (+1) 📋     │
│   From: 0x1234...            │
│   Time: Dec 15, 3:45 PM      │
│   [Details →]                │
└──────────────────────────────┘
```

**Thành phần chính**:

- Tab filters: All, NIGHT only, DUST only, DUST Generation
- Search & filter options
- Transaction items with:
  - Icon (↓ sent, ↑ received, ↔️ swap/generation)
  - Privacy indicator (🔒 shielded, 📋 public, ⚡ generation)
  - Amount & token type
  - From/To (hidden if private)
  - Status badge
  - Timestamp

---

### SCREEN 19: TRANSACTION DETAIL - DUST Transaction

**Mục đích**: Chi tiết giao dịch DUST (shielded)

**Layout**:

```
┌──────────────────────────────┐
│ ← Transaction Detail         │
├──────────────────────────────┤
│ 🔒 Private DUST Transaction  │
│ ✓ Confirmed                  │
├──────────────────────────────┤
│ Type: Received DUST          │
│ From: Hidden (Shielded)      │
│ To: Hidden (Shielded)        │
│ Amount: 200 DUST             │
├──────────────────────────────┤
│ Network Details:             │
│ Hash: 0xabcd... [copy]       │
│ Block: 12345678              │
│ Timestamp: Dec 20, 2:30 PM   │
│                              │
│ Status: ✓ Confirmed (30 conf)│
├──────────────────────────────┤
│ Privacy:                     │
│ ✅ Sender hidden             │
│ ✅ Recipient hidden          │
│ ✅ Amount shielded           │
│ ✅ Metadata private          │
├──────────────────────────────┤
│ [View on Explorer] [Done]    │
└──────────────────────────────┘
```

---

### SCREEN 20: TRANSACTION DETAIL - NIGHT Transaction

**Mục đích**: Chi tiết giao dịch NIGHT (public)

**Layout**:

```
┌──────────────────────────────┐
│ ← Transaction Detail         │
├──────────────────────────────┤
│ 📋 Public NIGHT Transaction  │
│ ✓ Confirmed                  │
├──────────────────────────────┤
│ Type: Sent NIGHT             │
│ From: 0x1234... [c]          │
│ To: 0x5678... [c]            │
│ Amount: 2.5 NIGHT            │
│ ≈ $5,000 USD                 │
├──────────────────────────────┤
│ Fee (DUST): 50 DUST          │
│ Total Spent: 2.5 NIGHT       │
├──────────────────────────────┤
│ Network Details:             │
│ Hash: 0xabcd... [copy]       │
│ Block: 12345678              │
│ Timestamp: Dec 18, 1:15 PM   │
│ Status: ✓ Confirmed (30 conf)│
├──────────────────────────────┤
│ Privacy:                     │
│ ⚠️ Public transaction        │
│ Everyone can see details     │
├──────────────────────────────┤
│ [View on Explorer] [Done]    │
└──────────────────────────────┘
```

---

### SCREEN 21: DUST GENERATION HISTORY

**Mục đích**: Theo dõi DUST generation & decay

**Layout**:

```
┌──────────────────────────────┐
│ ← DUST Generation History    │
├──────────────────────────────┤
│ From NIGHT: 2.5              │
│ Daily Rate: 50 DUST/day      │
│ Current Cap: 1,000 DUST      │
├──────────────────────────────┤
│ Recent Generation:           │
│                              │
│ Today (Dec 20)               │
│ ⚡ +50 DUST generated        │
│ Running total: 800/1000      │
│                              │
│ Yesterday (Dec 19)           │
│ ⚡ +50 DUST generated        │
│ Running total: 750/1000      │
│                              │
│ Dec 18                       │
│ ⚡ +50 DUST generated        │
│ Running total: 700/1000      │
│                              │
│ (Older entries...)           │
├──────────────────────────────┤
│ ⚠️ Decay Information:        │
│ If orphaned: Decays in 30 d. │
└──────────────────────────────┘
```

---

### SCREEN 22: SETTINGS - Address Configuration

**Mục đích**: Manage NIGHT, Shield, DUST designations

**Layout**:

```
┌──────────────────────────────┐
│ ← Address Settings           │
├──────────────────────────────┤
│ NIGHT Address (Unshielded)   │
│ 0x1234567890...              │
│ Type: Public                 │
│ Status: ✅ Active            │
│ [View on Explorer]           │
├──────────────────────────────┤
│ Shield Address (Shielded)    │
│ [Hidden] [Show Address]      │
│ Type: Private                │
│ Status: ✅ Receiving DUST    │
│ [Reveal] [QR]                │
├──────────────────────────────┤
│ DUST Recipient Configuration │
│ Currently designated to:     │
│ Shield Address               │
│                              │
│ ⚠️ Warning:                  │
│ Changing DUST recipient      │
│ will start DUST decay on     │
│ previous address             │
│                              │
│ [Change Recipient]           │
├──────────────────────────────┤
│ Secondary Addresses:         │
│ [+ Add / Import]             │
└──────────────────────────────┘
```

---

### SCREEN 23: SETTINGS - Privacy & Privacy Settings

**Mục đích**: Cấu hình privacy, hide/show sensitive data

**Layout**:

```
┌──────────────────────────────┐
│ ← Privacy Settings           │
├──────────────────────────────┤
│ Address Display:             │
│ ☑ Hide sensitive addresses   │
│ ☑ Show full address on click │
│ ☑ Hide DUST balance          │
├──────────────────────────────┤
│ Transaction Display:         │
│ ☑ Hide DUST from/to details  │
│ ☑ Hide NIGHT amounts (masked)│
│ ☑ Show only hashes           │
├──────────────────────────────┤
│ Screenshot Protection:       │
│ ☐ Disable screenshots        │
│ ☐ Blur sensitive data        │
├──────────────────────────────┤
│ Data Collection:             │
│ ☐ Share analytics (optional) │
│ ☐ Help improve Midnight UX   │
├──────────────────────────────┤
│ Advanced Privacy:            │
│ DUST Decay Period: [30 days] │
│ Privacy Mode: [Strict]       │
└──────────────────────────────┘
```

---

### SCREEN 24: SETTINGS - DUST Settings

**Mục đích**: Cấu hình DUST generation, decay, caps

**Layout**:

```
┌──────────────────────────────┐
│ ← DUST Settings              │
├──────────────────────────────┤
│ DUST Generation              │
│ Status: ✅ Generating        │
│ From NIGHT: 2.5              │
│ Rate: 50 DUST/24h            │
│ [Pause Generation] [Resume]  │
├──────────────────────────────┤
│ DUST Cap Information         │
│ Current Cap: 1,000 DUST      │
│ Formula: [NIGHT amount] × X  │
│ Next adjustment: Dec 21      │
├──────────────────────────────┤
│ Decay Settings               │
│ Decay period: 30 days        │
│ Decay rate: 10% per day      │
│ Status: Default              │
│ ℹ️ Learn about decay         │
├──────────────────────────────┤
│ Notifications                │
│ ☑ Alert when cap reached     │
│ ☑ Alert when decay starts    │
│ ☑ Daily generation report    │
├──────────────────────────────┤
│ [Reset] [Export Settings]    │
└──────────────────────────────┘
```

---

### SCREEN 25: SETTINGS - Security & Backup

**Mục đích**: Bảo vệ bảo mật, backup seed phrase, DUST recovery

**Layout**:

```
┌──────────────────────────────┐
│ ← Security Settings          │
├──────────────────────────────┤
│ Password Protection          │
│ Status: ✅ Password set      │
│ [Change Password] [Reset]    │
├──────────────────────────────┤
│ Seed Phrase Backup           │
│ Status: ✅ Backed up         │
│ Last backup: Dec 1, 2024     │
│ [Reveal Phrase] [Export]     │
│ ⚠️ Controls NIGHT + Shield   │
├──────────────────────────────┤
│ DUST Recovery Key            │
│ Status: ⚠️ Not Backed Up     │
│ [Generate Recovery Key]      │
│ ℹ️ For DUST address recovery │
├──────────────────────────────┤
│ Auto-lock Settings           │
│ Lock after: [15 min] ▼       │
│ Biometric unlock: ☑          │
├──────────────────────────────┤
│ Connected dApps              │
│ Manage: [View Permissions]   │
│ Disconnect all unknown apps  │
├──────────────────────────────┤
│ [Clear Cache] [Reset Wallet] │
└──────────────────────────────┘
```

---

### SCREEN 26: SETTINGS - About & Midnight Info

**Mục đích**: Thông tin wallet, Midnight docs, links

**Layout**:

```
┌──────────────────────────────┐
│ ← About                      │
├──────────────────────────────┤
│ Midnight Wallet Extension    │
│ Version: 1.0.0               │
│ Build: 12345                 │
│ Network: Testnet             │
│ Last Updated: Today          │
├──────────────────────────────┤
│ Midnight Resources           │
│ 📚 Official Docs             │
│ 🔗 Midnight.Network          │
│ 💬 Discord                   │
│ 𝕏 Twitter/X                  │
│ ✈️ Telegram                  │
├──────────────────────────────┤
│ Support                      │
│ 🆘 Report Issue              │
│ 📧 Contact Support           │
│ ❓ FAQ                       │
│ 📖 Technical Docs            │
├──────────────────────────────┤
│ Legal                        │
│ Terms of Service             │
│ Privacy Policy               │
│ Open Source License          │
├──────────────────────────────┤
│ GitHub: [midnight-wallet]    │
│ [Export Logs] [Reset App]    │
└──────────────────────────────┘
```

---

## IV. Component Library - Midnight-Specific

### 4.1 Address Display Components

**Unshielded Address Display** (Always visible):

```
┌─────────────────────────────┐
│ 💳 NIGHT Address            │
│ 0x1234567890abcdef...       │
│ [Copy] [QR] [Explorer]      │
└─────────────────────────────┘
```

**Shielded Address Display** (Hidden by default):

```
┌─────────────────────────────┐
│ 🔒 Shield Address           │
│ [Hidden] [Show Address]     │
│ ↓ (click to reveal)         │
│ 0xFEDCBA9876543210...       │
│ [Copy] [QR]                 │
└─────────────────────────────┘
```

**Address Badges**:

- 💳 Unshielded (public, visible)
- 🔒 Shielded (private, hidden)
- ⚡ DUST Recipient (capacity address)
- 🔄 Secondary Address

### 4.2 DUST Visualization Components

**DUST Capacity Bar**:

```
████████░░ 800/1000 DUST
├─ Green: Available
├─ Orange: Near cap
└─ Full: At maximum capacity
```

**Generation Rate Card**:

```
┌──────────────────────┐
│ ⚡ DUST Generation    │
│ Rate: 50 DUST/day    │
│ From: 2.5 NIGHT      │
│ Status: ✅ Active    │
└──────────────────────┘
```

**Decay Warning**:

```
⚠️ DUST DECAY ALERT
Your DUST has been orphaned.
It will decay in 25 days.
[Restore Connection] [Learn More]
```

### 4.3 Transaction Type Badges

| Type           | Icon | Color  | Label               |
| -------------- | ---- | ------ | ------------------- |
| Send NIGHT     | 💳↓  | Blue   | Public / Unshielded |
| Receive NIGHT  | 💳↑  | Green  | Public / Unshielded |
| Send DUST      | 🔒↓  | Purple | Private / Shielded  |
| Receive DUST   | 🔒↑  | Purple | Private / Shielded  |
| DUST Generated | ⚡   | Yellow | Capacity Resource   |

### 4.4 Privacy Indicator System

When displaying sensitive information:

```
Status: Available (Unshielded)
└─ Show by default, no masking needed

Status: Hidden (Shielded)
├─ Click to reveal full address
└─ Auto-hide after 30 seconds
```

---

## V. Midnight-Specific Design Principles

### 5.1 Privacy-First UX Patterns

1. **Shield vs Unshield Clarity**
   - Always indicate which address type is being used
   - Use consistent icons (💳 vs 🔒)
   - Explain consequences of choice

2. **DUST Explainability**
   - Show generation in real-time (optional animation)
   - Explain cap, decay mechanism clearly
   - Provide decay warnings well in advance

3. **Address Complexity Management**
   - Don't overwhelm users with 3 address types
   - Use collapsible sections for secondary addresses
   - Provide one-click setup for common configurations

4. **Privacy Default Pattern**
   - DUST (shielded) should be highlighted as default choice
   - Show privacy benefits (metadata hidden, etc.)
   - Warn when making public transactions

5. **Dual-Token Mental Model**
   - Keep NIGHT and DUST visually distinct
   - Show NIGHT → DUST generation flow clearly
   - Never mix them in transaction screens

### 5.2 DUST-Specific UX Challenges

**Challenge 1: Explaining DUST Generation**

Solution: Use progressive disclosure

- Quick view: "Generating 50 DUST/day"
- Detailed: Show rate calculation, NIGHT amount, cap
- Educational: Link to docs on first setup

**Challenge 2: Decay Warnings**

Solution: Proactive notifications

- Alert 10 days before decay
- Show countdown timer
- Provide easy "reconnect" action

**Challenge 3: Capacity vs Fees Confusion**

Solution: Clear labeling

- DUST is "network capacity", not "fees"
- No gas wars or tipping possible
- Show predictable consumption

**Challenge 4: Designate DUST Recipient**

Solution: Safe defaults + education

- Auto-designate to Shield address
- Warn before changing
- Show implications clearly

### 5.3 Midnight Onboarding Flow Priority

1. **Explain privacy model** (why Midnight matters)
2. **Understand 3 address types** (Shield vs Unshield vs DUST)
3. **Backup seed phrase** (controls both NIGHT & Shield)
4. **Setup DUST generation** (designate Shield address)
5. **Set password** (unlock transactions)
6. **First transaction** (choose NIGHT or DUST)

---

## VI. Security Considerations for Midnight

### 6.1 Shielded Address Security

- Never expose Shield address to untrusted sources
- Private metadata not visible on-chain
- Use QR codes for safer address sharing
- Warn if user copies to public channels

### 6.2 DUST Specific Risks

- DUST decay if NIGHT moved carelessly
- Orphaned DUST cannot be recovered manually
- Cannot transfer DUST between addresses
- Changing DUST recipient is permanent (decay)

### 6.3 Transaction Confirmation UX

For **public NIGHT transactions**:

```
⚠️ WARNING: PUBLIC TRANSACTION
Everyone on the blockchain will see:
- Your address
- Recipient address
- Amount sent
- Transaction timestamp
```

For **private DUST transactions**:

```
✅ PRIVATE TRANSACTION
Hidden from blockchain:
- Your address (shielded)
- Recipient address (shielded)
- Amount sent (shielded)
- Transaction metadata (shielded)
```

---

## VII. Midnight Network Integration Checklist

### Address Management

- [ ] Support 3 address types: NIGHT (unshielded), Shield (shielded), DUST recipient
- [ ] Allow address import/export
- [ ] Generate seed phrase controlling both NIGHT & Shield
- [ ] Backup recovery key for DUST
- [ ] Address validation for Midnight format

### DUST Generation & Capacity

- [ ] Display DUST balance & cap (based on NIGHT)
- [ ] Show generation rate (DUST per time unit)
- [ ] Implement decay countdown
- [ ] Provide DUST recipient designation UI
- [ ] Warn before orphaning DUST

### Transaction System

- [ ] Support Send NIGHT (unshielded, public)
- [ ] Support Send DUST (shielded, private)
- [ ] Show transaction type clearly
- [ ] Display privacy implications
- [ ] Track transaction history with privacy filtering

### Security & Privacy

- [ ] Hide Shield address by default
- [ ] Mask sensitive data when not needed
- [ ] Clear warnings for risky actions
- [ ] Secure seed phrase backup/recovery
- [ ] Password-protect DUST recipient changes

### UX & Education

- [ ] Onboarding explains Midnight privacy model
- [ ] Interactive tutorials for DUST & addresses
- [ ] In-app help & tooltips
- [ ] Links to official Midnight documentation
- [ ] FAQs about decay, capacity, privacy

---

## VIII. Differences from Standard Wallets

This Midnight wallet differs from typical blockchain wallets in:

| Feature                | Standard Wallet      | Midnight Wallet               |
| ---------------------- | -------------------- | ----------------------------- |
| **Address Types**      | 1-2 types            | 3 types (NIGHT, Shield, DUST) |
| **Privacy**            | Optional             | Default (DUST)                |
| **Token System**       | Single token         | Dual (NIGHT + DUST)           |
| **Transaction Fees**   | Direct in main token | DUST capacity-based           |
| **Fee Predictability** | Volatile             | Predictable (generation rate) |
| **Metadata Privacy**   | Visible              | Shielded (DUST)               |
| **Address Visibility** | Always public        | Can be private (Shield)       |
| **Decay Mechanism**    | N/A                  | DUST decay if orphaned        |
| **Governance**         | Via token            | Via NIGHT holdings            |

---

## IX. Wireframe Checklist - Midnight Edition

### Midnight-Specific Elements

- [ ] Explain 3 address types clearly (NIGHT, Shield, DUST)
- [ ] Visualize DUST generation (bar, rate, cap)
- [ ] Show decay countdown & warnings
- [ ] Provide DUST recipient designation flow
- [ ] Display privacy indicators (🔒 vs 📋 vs ⚡)
- [ ] Support both public (NIGHT) & private (DUST) sends
- [ ] Transaction history with privacy filtering
- [ ] DUST generation history tracking
- [ ] Address management (easy switching)
- [ ] Comprehensive onboarding for Midnight model

### General Wallet Completeness

- [ ] Full onboarding flow (backup, password, setup)
- [ ] Home dashboard with balances & status
- [ ] Send & receive for all token types
- [ ] Transaction history & details
- [ ] Settings (security, privacy, address, DUST, about)
- [ ] Error handling & edge cases
- [ ] Loading & confirmation states
- [ ] Mobile responsive design

---

## X. Design Tools & Resources for Midnight

### Midnight-Specific Resources

- Official Docs: https://docs.midnight.network/
- NIGHT Tokenomics: https://midnight.network/night
- Midnight Blog: Updates on features
- Discord Community: Support & feedback
- Lace Wallet Reference: Official UI implementation

### Design Inspiration

- Study Lace Wallet (official Midnight wallet)
- Analyze Cardano wallet UX (similar audience)
- Review privacy wallet designs (Monero, Zcash UX patterns)
- ZK protocol documentation for accuracy

---

## Kết Luận

Guideline này cung cấp foundation hoàn chỉnh cho Midnight wallet extension với:

1. **3 Address Types**: NIGHT (unshielded), Shield (shielded), DUST (capacity)
2. **Dual Token System**: NIGHT (governance) + DUST (capacity/fees)
3. **Privacy-First UX**: Choose between public (NIGHT) & private (DUST) transactions
4. **DUST Management**: Generation, cap, decay - clearly explained
5. **Comprehensive Screens**: 26 wireframes covering all user flows
6. **Midnight-Specific Components**: Privacy indicators, capacity bars, decay warnings
7. **Security & Privacy**: Address masking, transaction type warnings, decay protection

**Key Design Principles**:

- ✅ Make privacy/public choice explicit
- ✅ Visualize DUST capacity clearly
- ✅ Warn about decay proactively
- ✅ Support address complexity without confusion
- ✅ Educate through UI patterns
- ✅ Prioritize security for shielded addresses

Sử dụng guideline này để xây dựng wireframes chi tiết trong Figma, prototype interactions, và test với users. Midnight's
unique privacy model cần careful UX để users hiểu trade-offs giữa public NIGHT vs private DUST transactions.
