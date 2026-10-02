# 👓 MY EYES (`myeyes.pk`) — Pakistan's Premier Prescription-Based Eyewear Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Flutter](https://img.shields.io/badge/Mobile_App-Flutter_3-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev/)

**MY EYES** (`myeyes.pk`) is a modern, full-stack omnichannel eyewear commerce platform and optical calculation system built specifically for the Pakistani optical market. It pairs precision lens laboratory tooling, computerized prescription OCR ingestion, real-time 3D frame previewing, and an intuitive admin operations suite with high-converting e-commerce experiences.

---

## 🌟 Flagship Features

### 1. 🔍 Curated Catalog & 0ms Faceted Search
- **Instant Filtering**: Real-time faceted aggregator for Gender (*Men, Women, Unisex, Kids*), Frame Shapes, Materials, Color Swatches, Prescription Types, and Style Vibes.
- **Dynamic Frame Shapes**: Wayfarer, Aviator, Rectangle, Round, Oval, Square, Cat-Eye, Geometric/Octagon, Rimless, Semi-Rimless/Clubmaster, **Hexagon / Polygon**, **Browline**, **Butterfly / Oversized**, and **Pantos**.
- **High-Tech Materials**: Handcrafted Bio-Acetate, Japanese Titanium, Premium Metal, Flexible TR90 Memory Polymer, Stainless Steel, Wood Finish, Hybrid/Combination, **Ultem (PEI)** aerospace polymer, and **Carbon Fiber**.
- **Color Swatches & Gradients**: Solid Black, Classic Tortoise, Crystal Clear, Smoked Slate, Amber Honey, Classic Gold, Silver Steel, Rose Gold, Crimson Red, Electric Cobalt, Tropical Teal, Emerald Green, Vivid Orange, Pastel Pink, Royal Purple, plus **Matte Black**, **Dark Wine / Burgundy**, **Navy Blue**, **Gunmetal**, **Gradient / Two-Tone**, and **Olive Green**.

### 2. 🔬 Precision Optical Prescription & Lens Engine
- **Full Prescription Matrix**: Independent OD (Right Eye) and OS (Left Eye) input for Sphere (SPH), Cylinder (CYL), Axis ($1^\circ - 180^\circ$), Pupillary Distance (PD), and Near Add Power for Presbyopia/Progressives.
- **Digital PD Ruler Tool**: Interactive browser-based Pupillary Distance measurement utility.
- **Doctor Slip OCR Scanner**: Automated OCR parsing via `Tesseract.js` for instant prescription slip photo ingestion and digitizing.
- **Lens Thickness Simulator**: Mathematical simulation of lens edge/center thickness across lens refractive index tiers ($1.56, 1.61, 1.67, 1.74$).
- **Solex Lens Packages**:
  - *CR-Crystal Clear Standard (1.56)*
  - *Blue Defense / Digital Screen Guard (1.56 & 1.61)*
  - *Sun-Adaptive Photochromic Transition Matrix*
  - *Dual Shield Hybrid (Blue + Photochromic)*
  - *Ultra-Thin High-Index Diamond (1.67 & 1.74)*

### 3. 🎯 AI Style & Face Shape Quiz
- **Tailored Frame Matching**: Multi-step diagnostic algorithm matching facial geometry (*Oval, Square, Round, Heart, Diamond*) and optical requirements with ideal frame silhouettes.
- **Smart Recommendations**: Automatic corridor matching for progressive lenses (requiring taller B-measurement heights) and high-power full-rim recommendations.

### 4. 🕶️ 3D / WebGL Virtual Try-On
- **Three.js & React Three Fiber**: Embedded 3D canvas viewport (`@react-three/fiber`, `@react-three/drei`) rendering GLTF/GLB models with realistic material shaders, refraction, and lighting.

### 5. 🛠️ Complete Admin Operations Suite (`/admin`)
- **Product Management Modal**: Add/edit frames with instant live Neon PostgreSQL sync, multi-image Cloudinary uploads, and granular attribute selection.
- **Optimistic Inventory Control**: 0ms visual stock level adjustments and catalog cleanup.
- **Order Lifecycle Pipeline**: Multi-stage order state machine:
  - `ORDER_PLACED` $\rightarrow$ `ADVANCE_PENDING` $\rightarrow$ `ADVANCE_VERIFIED` $\rightarrow$ `LAB_QUEUED` $\rightarrow$ `LENS_SURFACING_EDGING` $\rightarrow$ `QUALITY_INSPECTION_PASSED` $\rightarrow$ `DISPATCHED_WITH_COURIER` $\rightarrow$ `DELIVERED`
- **Deposit & Receipt Verification**: Manual and semi-automated transaction slip approval for Bank Transfers, Easypaisa, and JazzCash with audit logs.
- **Automated Transactional Emails**: Beautiful HTML emails generated via `Resend` / `Nodemailer` for order confirmations, payment approvals, tracking updates, and receipt copies.
- **Deterministic A4 PDF Generation**: PDFKit optical laboratory edging sheets and customer receipts.
- **Lead Recovery & Abandoned Carts**: Automated email & WhatsApp outreach tools for incomplete checkout funnels.
- **Dynamic Pricing Rules**: Real-time configuration of base prices, cylinder surcharges, progressive additions, and flash discounts.

### 6. 🇵🇰 Localized Payment Gateways & Pakistani Logistics
- **Payment Rails**: Cash on Delivery (COD), Direct Bank Transfer, Easypaisa, JazzCash, Raast Instant QR, and Stripe International.
- **Courier & Shipping Integration**: Dynamic shipping fee calculators and tracking links for Trax, Leopard, TCS, and M&P.

### 7. 📱 Flutter Companion App (`mobile_app/`)
- Native mobile application for Android & iOS built with Flutter 3 and Dart.
- Shared models, offline-first CartProvider, curated Face Shape diagnostics, and Next.js backend API synchronization.

### 8. 🤖 MCP (Model Context Protocol) AI Server (`mcp-server/`)
- Integrates with AI assistants to query the product catalog, check real-time inventory, and support customer inquiries via tool calls.

---

## 🏗️ Technical Architecture & Stack

```
                                  ┌────────────────────────────────┐
                                  │      MY EYES Storefront        │
                                  │  Next.js 15 (App Router) + R19 │
                                  └───────────────┬────────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                │                                 │                                 │
     ┌──────────▼──────────┐           ┌──────────▼──────────┐           ┌──────────▼──────────┐
     │  Optical & 3D WebGL │           │  E-Commerce Engine  │           │   Admin Operations  │
     │  • Three.js / Drei  │           │  • Zustand Stores   │           │  • Order Processing │
     │  • Tesseract OCR    │           │  • Dynamic Pricing  │           │  • Lens Lab Routing │
     │  • PD / Thickness   │           │  • Pakistani Rails  │           │  • Deposit Verifier │
     └─────────────────────┘           └──────────┬──────────┘           └─────────────────────┘
                                                  │
                                       ┌──────────▼──────────┐
                                       │    Prisma ORM v6    │
                                       └──────────┬──────────┘
                                                  │
                                       ┌──────────▼──────────┐
                                       │   Neon PostgreSQL   │
                                       │  (Serverless Pool)  │
                                       └─────────────────────┘
```

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom Glassmorphism System |
| **Icons & Animations** | [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Database & ORM** | [Prisma v6](https://www.prisma.io/) + [Neon Serverless PostgreSQL](https://neon.tech/) |
| **Media & CDN** | [Cloudinary](https://cloudinary.com/) (Zero-lag multi-image processing) |
| **State Management** | [Zustand v5](https://github.com/pmndrs/zustand) |
| **3D Rendering** | [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://github.com/pmndrs/drei) |
| **Prescription OCR** | [Tesseract.js](https://tesseract.projectnaptha.com/) |
| **PDF Generation** | [PDFKit](https://pdfkit.org/) (Deterministic A4 optical laboratory slips) |
| **Emails** | [Resend](https://resend.com/) & [Nodemailer](https://nodemailer.com/) |
| **Mobile App** | [Flutter 3](https://flutter.dev/) & [Dart](https://dart.dev/) |
| **AI Extension** | [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) |

---

## 📁 Repository Structure

```
EYEWEAR_STORE/
├── prisma/
│   ├── schema.prisma              # Database schema (Models, Enums, Relations)
│   └── seed-initial-db.js         # Database seeding script
├── src/
│   ├── app/
│   │   ├── (auth)/                # Customer & Optician authentication flows
│   │   ├── admin/                 # Back-office operations dashboard (/admin)
│   │   │   ├── products/          # Catalog management & frame creation modal
│   │   │   ├── orders/            # Order status pipeline & courier tracking
│   │   │   ├── payments/          # Payment audits & transaction approvals
│   │   │   ├── verify-deposits/   # Bank/Easypaisa deposit slip verifier
│   │   │   ├── lens-pricing/      # Solex lens package pricing rules
│   │   │   ├── leads/             # Abandoned checkout lead recovery
│   │   │   └── inventory/         # Stock audits and SKU updates
│   │   ├── api/                   # Serverless REST & Action endpoints
│   │   │   ├── admin/             # Secure admin APIs
│   │   │   ├── checkout/          # Order placement & prescription linkage
│   │   │   ├── quiz/              # Style quiz result generator
│   │   │   └── payments/          # Payment receipt uploads & webhooks
│   │   ├── configurator/          # Interactive optical lens customizer
│   │   ├── quiz/                  # Face shape & style recommendation quiz
│   │   ├── eyeglasses/            # Optical frames category page
│   │   ├── sunglasses/            # Polarized & UV sunglasses category page
│   │   ├── collections/           # Curated designer collections
│   │   └── checkout/              # High-converting streamlined checkout
│   ├── components/
│   │   ├── 3d/                    # Three.js 3D GLB canvas & try-on viewers
│   │   ├── admin/                 # Admin data tables, filters & modals
│   │   ├── optical/               # Prescription selectors & PD ruler
│   │   ├── quiz/                  # Interactive quiz step cards & animations
│   │   └── ui/                    # Reusable buttons, badges, modals, drawers
│   ├── lib/
│   │   ├── optical/               # Lens thickness & PD calculation engines
│   │   ├── catalog/               # Faceted aggregation & search algorithms
│   │   ├── prisma.ts              # Prisma Client singleton
│   │   ├── cloudinary.ts          # Cloudinary upload/deletion helpers
│   │   ├── email.ts               # Transactional email sender
│   │   ├── emailTemplates.ts      # HTML email templates
│   │   ├── pricingEngine.ts       # Prescription & coating price rules
│   │   ├── quizData.ts            # Quiz steps & frame mapping matrix
│   │   └── utils.ts               # Formatting helpers (PKR currency, diopters)
│   └── store/
│       └── useCartStore.ts        # Zustand persistent shopping cart store
├── mobile_app/                    # Cross-platform Flutter mobile application
│   ├── lib/                       # Screens, models, providers & API services
│   └── pubspec.yaml               # Flutter dependencies
├── mcp-server/                    # Model Context Protocol server for AI tools
└── scripts/                       # Database import, migration & test utilities
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory and configure the following variables:

```env
# ============================================================
#  DATABASE (Neon PostgreSQL)
# ============================================================
DATABASE_URL="postgresql://user:password@ep-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-direct.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ============================================================
#  AUTHENTICATION & SECURITY
# ============================================================
JWT_SECRET="your-super-secure-jwt-secret"
ADMIN_EMAIL="admin@myeyes.pk"
ADMIN_PASSWORD="your-admin-password"

# ============================================================
#  CLOUDINARY MEDIA STORAGE
# ============================================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# ============================================================
#  TRANSACTIONAL EMAIL (Resend / SMTP)
# ============================================================
RESEND_API_KEY="re_123456789"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="orders@myeyes.pk"
SMTP_PASS="your-app-password"
EMAIL_FROM="MY EYES <orders@myeyes.pk>"

# ============================================================
#  OPTIONAL PAYMENT GATEWAYS
# ============================================================
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# ============================================================
#  APPLICATION SETTINGS
# ============================================================
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## 🚀 Getting Started & Local Development

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/zay8t/MYEYES_STORE.git
cd MYEYES_STORE

# Install web application dependencies
npm install
```

### 2. Synchronize Database & Generate Prisma Client

```bash
# Push schema to live Neon PostgreSQL database
npm run db:push

# Generate Prisma Client types
npx prisma generate
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Admin Access
Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) and log in with your configured administrator credentials.

---

## 📱 Running the Flutter Mobile App

```bash
cd mobile_app
flutter pub get
flutter run
```

---

## 🤖 Running the MCP Server

```bash
cd mcp-server
npm install
npm run build
npm start
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js local development server |
| `npm run build` | Generates Prisma client and compiles the production bundle |
| `npm run build:local`| Runs `prisma generate`, `prisma db push`, and `next build` |
| `npm run db:push` | Synchronizes Prisma schema definitions with the PostgreSQL database |
| `npm run start` | Launches production server on port 3000 (or `$PORT`) |
| `npm run lint` | Runs Next.js ESLint checks |

---

## 🛡️ License

Private & Proprietary. Copyright © 2026 **MY EYES** (`myeyes.pk`). All rights reserved.
