# FutureIntern Platform - Complete File Structure

```
project/
│
├── 📁 node_modules/              # Dependencies (auto-generated)
│
├── 📄 Configuration Files
│   ├── eslint.config.js          # ESLint configuration
│   ├── index.html                # HTML entry point
│   ├── package.json              # Project dependencies and scripts
│   ├── package-lock.json         # Locked dependency versions
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tsconfig.app.json         # TypeScript app config
│   ├── tsconfig.node.json        # TypeScript node config
│   └── vite.config.ts            # Vite build configuration
│
└── 📁 src/                       # Source code directory
    │
    ├── 📄 Core Files
    │   ├── main.tsx              # React application entry point
    │   ├── App.tsx               # Main app component with routing
    │   ├── index.css             # Global styles and animations
    │   ├── types.ts              # TypeScript type definitions
    │   ├── data.ts               # Mock data (internships, testimonials)
    │   ├── vite-env.d.ts         # Vite environment types
    │   └── lucide-react.d.ts     # Lucide React icon types
    │
    ├── 📁 components/            # Reusable UI components
    │   ├── Navbar.tsx            # Navigation bar component
    │   ├── Footer.tsx            # Footer component with links
    │   ├── Hero.tsx              # Hero section with search
    │   ├── Chatbot.tsx           # AI chatbot widget component
    │   ├── FeaturedOpportunities.tsx  # Featured internships section
    │   ├── HowItWorks.tsx        # How it works section
    │   └── Testimonials.tsx      # Testimonials section
    │
    ├── 📁 pages/                 # Page components (routes)
    │   ├── Home.tsx              # Landing page
    │   ├── Login.tsx             # User login page
    │   ├── SignUp.tsx            # Multi-step signup form
    │   ├── Dashboard.tsx         # User dashboard
    │   ├── Admin.tsx             # Admin panel (full management)
    │   ├── BrowseInternships.tsx # Browse all internships
    │   ├── InternshipDetail.tsx  # Individual internship details
    │   ├── Companies.tsx         # Companies listing page
    │   ├── About.tsx             # About us page
    │   ├── ContactUs.tsx         # Contact page
    │   └── GetHelp.tsx           # Help/FAQ page
    │
    ├── 📁 services/              # Service layer (API, utilities)
    │   └── chatbotService.ts     # AI chatbot service (OpenAI integration)
    │
    └── 📁 hooks/                 # Custom React hooks
        └── useScrollReveal.ts    # Scroll reveal animation hook
```

## 📋 File Descriptions

### Configuration Files
- **eslint.config.js** - Code linting rules
- **package.json** - Project metadata, dependencies, scripts
- **tailwind.config.js** - Tailwind CSS customization
- **tsconfig.json** - TypeScript compiler options
- **vite.config.ts** - Vite bundler configuration

### Core Application Files
- **main.tsx** - React app entry point, renders App component
- **App.tsx** - Main component with React Router setup and all routes
- **index.css** - Global styles, animations, utility classes
- **types.ts** - TypeScript interfaces (Internship, Testimonial, etc.)
- **data.ts** - Mock data for internships and testimonials

### Components (`src/components/`)
- **Navbar.tsx** - Top navigation with links and auth buttons
- **Footer.tsx** - Footer with company links, support, legal
- **Hero.tsx** - Landing page hero with search functionality
- **Chatbot.tsx** - Floating AI chatbot with multi-language support
- **FeaturedOpportunities.tsx** - Featured internships showcase
- **HowItWorks.tsx** - Platform explanation section
- **Testimonials.tsx** - User testimonials carousel

### Pages (`src/pages/`)
- **Home.tsx** - Main landing page
- **Login.tsx** - User authentication page
- **SignUp.tsx** - Multi-step registration form (3 steps)
- **Dashboard.tsx** - User dashboard (applications, saved, profile)
- **Admin.tsx** - Complete admin panel (users, internships, analytics)
- **BrowseInternships.tsx** - Browse and filter internships
- **InternshipDetail.tsx** - Individual internship details page
- **Companies.tsx** - Company listings page
- **About.tsx** - About us page
- **ContactUs.tsx** - Contact form page
- **GetHelp.tsx** - Help center with FAQs

### Services (`src/services/`)
- **chatbotService.ts** - AI chatbot service with OpenAI API integration and fallback responses

### Hooks (`src/hooks/`)
- **useScrollReveal.ts** - Custom hook for scroll-triggered animations

## 🛣️ Routes Structure

```
/                    → Home.tsx
/login               → Login.tsx
/signup              → SignUp.tsx
/dashboard           → Dashboard.tsx
/admin               → Admin.tsx
/browse              → BrowseInternships.tsx
/internship/:id      → InternshipDetail.tsx
/companies           → Companies.tsx
/about               → About.tsx
/contact             → ContactUs.tsx
/get-help            → GetHelp.tsx
```

## 🎨 Design System

- **Theme**: Gray/white professional SaaS design
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React
- **Animations**: Custom CSS keyframes (fadeIn, slideIn, float, etc.)

## 🔧 Key Features

1. **Multi-step Signup** - 3-step form with validation
2. **AI Chatbot** - Bilingual (English/Arabic) with OpenAI integration
3. **Admin Panel** - Complete management interface
4. **Responsive Design** - Mobile-first approach
5. **Modern UI** - Glassmorphism, smooth animations, professional styling

## 📦 Dependencies

- React 18.3.1
- React Router DOM 7.10.1
- TypeScript 5.5.3
- Tailwind CSS 3.4.1
- Vite 7.2.7
- Lucide React 0.344.0
- Supabase 2.57.4 (for future backend integration)

