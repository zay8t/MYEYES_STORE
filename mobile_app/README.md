# MY EYES Mobile App (Flutter)

A clean, premium Flutter mobile application for **MY EYES** — Pakistan's First Prescription Based Eyewear Store. All features from the Next.js web application have been faithfully copied into an ultra-clean, platform-optimized mobile user interface.

---

## 📱 Copied Web Features & Architecture

### 1. Storefront & Discovery (`lib/screens/home/home_screen.dart`)
- **Store Announcement Bar:** Live delivery policies, promo announcements, and 100% optical accuracy guarantee.
- **Hero Banner:** Quick actions to explore frames or launch digital consultation tools.
- **Category Quick Navigation:** Direct filters for Eyeglasses, Sunglasses, Men's, Women's, and Kids collections.
- **Promotional Voucher Strip:** Universal coupon codes (e.g. `MYEYES10`, `FREESHIP`).
- **Trending Lab Frames Carousel:** Real-time featured product cards with direct wishlist bookmarking and 1-tap lens configurator launcher.
- **Optical Lab Trust Badges:** Digital lensometer verification, free hard case & microfiber cloth, and 7-day fit exchange.
- **Optician WhatsApp Hotline:** 1-tap live chat with certified optometrists (`+92 339 0103262`).

### 2. Full Frame Catalog & Smart Filters (`lib/screens/catalog/`)
- **Live Search Bar:** Instant keyword search across frame names, shapes, and materials.
- **Multi-Facet Filter Sheet (`filter_sheet.dart`):** Filter by shape (Rectangle, Round, Aviator, Cat-Eye, Square, Geometric), material (Titanium, Acetate, TR-90, Metal), gender, and price range.
- **Reactive Color Swatches (`color_swatch_row.dart`):** Dynamically updates the frame image on the product card in real-time.
- **Wishlist Heart Toggle:** Quick bookmarking with instant badge count sync.

### 3. Product Detail View (`lib/screens/product_detail/`)
- **High-Resolution Frame Gallery (`frame_gallery.dart`):** Swatch-reactive image preview with thumbnail navigation.
- **Technical Frame Dimensions (`spec_badge_row.dart`):** Lens width, bridge width, temple length, and frame shape badges.
- **Dual Action Bottom Bar:** Choose between **"Frame Only"** (immediate cart addition) or **"Select Lenses & Rx"** (launches 3-step configurator).

### 4. Prescription & Lens Configurator (`lib/screens/configurator/`)
- **Step 1 — Clinical Routing:** Age and usage intake (Distance, Reading, Computer, Presbyopia progressive routing).
- **Step 2 — Transparent Lens Packages:** Standard Clear CR-39, Blue Cut Screen Shield, Photochromic Transitions, and Polarized Sun.
- **Step 3 — Doctor Slip Upload & Manual Rx:** Camera capture or gallery upload of doctor slip, optional manual OD/OS power input (SPH, CYL, AXIS, PD), or "Send slip via WhatsApp later".

### 5. Interactive Optical Lab Tools (`lib/screens/tools/`)
- **Face Shape Diagnostic & Matcher (`tools_hub_screen.dart`):** Curated frame pairings and styling tips for Oval, Round, Square, and Heart geometries.
- **Optical Lens Coating Simulator (`lens_simulator_screen.dart`):** Interactive visual comparison of Clear vs Blue Cut vs Photochromic (with daylight intensity slider) vs Polarized against multiple scenery environments.
- **Pupillary Distance (PD) Caliper Meter (`pd_measurement_screen.dart`):** Interactive millimeter ruler and caliper tool with monocular split mode and step-by-step mirror guide.
- **Eyewear Style & Fit Quiz (`quiz_screen.dart`):** 4-question lifestyle quiz providing tailored frame recommendations.

### 6. Shopping Bag & Checkout (`lib/screens/cart/`)
- **Full Item Breakdown:** Frame details, custom lens coating package, and prescription slip status.
- **Promo Coupon System:** Real-time discount calculation (`MYEYES10` for 10% off, `SAVE20` for 20% off, `FREESHIP` for free shipping).
- **Free Shipping Threshold Indicator:** Progress bar toward free shipping (Rs. 3,000 threshold).
- **Delivery & Payment Information:** Address intake with Cash on Delivery (COD) or direct lab transfer options.
- **WhatsApp Order Confirmation Generator:** Formats structured WhatsApp messages to the optical lab with complete prescription specifications.

### 7. Order Tracking & Digital Laboratory Receipt (`lib/screens/orders/`)
- **Real-Time Order Tracking:** 5-stage timeline from laboratory verification to express courier delivery.
- **Digital A4 Optical Laboratory Slip:** Complete patient prescription receipt displaying OD/OS powers, frame specs, and payment totals.

### 8. Customer Care & Studio Guide (`lib/screens/pricing_guide/`)
- **Transparent Optical Lens Matrix:** Comprehensive price list and coating benefits for Pakistan.
- **Direct WhatsApp Laboratory Optician Support.**

---

## 🎨 Design Tokens & UI Aesthetics (`lib/theme.dart`)

- **Primary Brand Accent:** `#FF7A00` (MY EYES Orange)
- **Neutral Scale:** Slate-950 to Slate-50 for high contrast, clean modern optical aesthetics
- **Typography:** Google Fonts Inter
- **Icons:** Lucide Icons
- **Navigation:** Modern Material 3 5-destination NavigationBar (Home, Frames, Lab Tools, Bag, Studio)
