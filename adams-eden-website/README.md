# Adams Eden Website

**Garden Planning & E-commerce Platform**

This is the web component of Adams Eden - a complete garden planning and shopping experience that syncs with the mobile app.

## 🌟 Features

- **Garden Planner**: Drag-and-drop interface for designing garden layouts
- **E-commerce Shop**: Seeds, plants, tools, and supplies
- **Smart Shopping**: "Shop This Garden" - turn plans into shopping lists
- **Template Library**: Pre-designed garden layouts for quick start
- **Companion Planting Guide**: Interactive recommendations
- **Mobile App Sync**: Gardens sync with React Native app via Firebase
- **User Accounts**: Save gardens, track orders, manage profile

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Canvas**: Fabric.js (for garden planner)
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📁 Project Structure

```
adams-eden-website/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── planner/           # Garden planner pages
│   ├── shop/              # E-commerce pages
│   ├── resources/         # Guides, blog, etc.
│   └── api/               # API routes
├── components/             # Reusable components
│   ├── ui/                # UI components
│   ├── planner/           # Planner-specific components
│   ├── shop/              # Shop-specific components
│   └── layout/            # Layout components (Nav, Footer)
├── lib/                    # Utilities and helpers
│   ├── firebase.ts        # Firebase config
│   ├── stripe.ts          # Stripe config
│   └── utils.ts           # Helper functions
├── types/                  # TypeScript type definitions
│   └── index.ts           # Shared types (matches mobile app)
├── public/                 # Static assets
│   ├── images/            # Product images
│   └── icons/             # Icons and logos
└── styles/                 # Additional stylesheets

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account
- Stripe account (for payments)

### Installation

1. **Navigate to the website directory**:
   ```bash
   cd adams-eden-website
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your credentials:
   - Firebase credentials
   - Stripe API keys
   - Shopify storefront domain, Storefront API token, and (if issued) Storefront ID
   - Site URL

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   ```
   http://localhost:3000
   ```

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔥 Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Authentication (Email/Password, Google)
4. Get your config from Project Settings
5. Add to `.env` file

## 💳 Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get API keys from Dashboard
3. Add to `.env` file
4. Set up products and prices in Stripe Dashboard

## 📱 Mobile App Integration

The website shares data with the React Native mobile app through Firebase:

- **Gardens**: Synced via Firestore `/users/{userId}/gardens`
- **Tracked Plants**: Synced via `/users/{userId}/trackedPlants`
- **Orders**: Available in `/users/{userId}/orders`

### Shared Types

Both web and mobile use the same TypeScript interfaces defined in `types/index.ts`:
- `Plant`
- `Garden`
- `TrackedPlant`
- `Product`
- `Order`

## 🌐 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

Can also deploy to:
- AWS Amplify
- Netlify
- Google Cloud Run

## 📊 Key Pages

### `/` - Home
Landing page with hero, features, and CTA

### `/planner` - Garden Planner
Interactive drag-and-drop garden designer with:
- Canvas workspace
- Plant library sidebar
- Template gallery
- Save/load gardens
- "Shop This Garden" button

### `/shop` - E-commerce
Product catalog with:
- Category filtering
- Search
- Product pages
- Shopping cart
- Checkout

### `/resources` - Educational Content
- Growing guides
- Companion planting charts
- Seasonal calendars
- Blog articles

## 🔐 Authentication Flow

1. User signs up/logs in (Firebase Auth)
2. User creates gardens on website
3. Gardens auto-sync to mobile app
4. User can shop from web or app
5. Orders tracked in both platforms

## 🛒 Shopping Flow

1. User designs garden in planner
2. Clicks "Shop This Garden"
3. System generates shopping list:
   - Seeds/plants from garden
   - Recommended quantities
   - Optional: soil, tools, beds
4. User reviews and adds to cart
5. Checkout with Stripe
6. Order syncs to mobile app

## 📝 TODO

- [ ] Install dependencies
- [ ] Set up Firebase
- [ ] Implement garden planner canvas
- [ ] Build product catalog
- [ ] Add Stripe checkout
- [ ] Mobile app sync testing
- [ ] Deploy to production

## 🤝 Contributing

This is a private project. For questions or contributions, contact the dev team.

## 📄 License

Proprietary - All Rights Reserved

---

**Built with ❤️ for gardeners**
