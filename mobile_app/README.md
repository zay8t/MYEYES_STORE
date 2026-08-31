# MY EYES Mobile App (Flutter)

Modern Flutter mobile application for **MY EYES** (Pakistan's First Prescription Based Eyewear Store).

## Architecture & Features

- **Theme (`lib/theme.dart`)**: Mirrored from Next.js web application (`#ff7a00` primary, slate neutrals, Inter typography).
- **Models (`lib/models/`)**:
  - `product.dart`: Products, frame shapes, materials, categories with JSON parsers.
  - `prescription.dart`: O.D. / O.S. sphere, cylinder, axis, pupillary distance, and doctor slip images.
  - `lens_price.dart`: Transparent single vision, blue-light, photochromic, and sunglasses lens packages.
  - `cart_item.dart`: Line items with custom prescription parameters.
  - `order.dart`: Order tracking, status, and payment verification states.
  - `user.dart`: User profiles and shipping addresses.
  - `face_shape.dart`: Curated fit diagnostics for Oval, Round, Square, and Heart face shapes.
- **State Management (`lib/providers/`)**: `CartProvider` using `provider`.
- **API Service (`lib/services/api_service.dart`)**: HTTP client communicating with Next.js backend endpoints.

## Running the App

```bash
cd mobile_app
flutter pub get
flutter run
```
