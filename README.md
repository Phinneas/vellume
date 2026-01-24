# Vellume - Pixel Art Journaling App

A Next.js 15 web application for journaling entries that converts them into beautiful pixel art.

## Overview

Vellume is a minimal, retro-inspired journaling application with the following features:

- **Authentication**: Email/password login and signup using Better Auth
- **Journal Writing**: Clean, distraction-free interface for writing entries
- **Gallery**: View your converted pixel art entries
- **User Settings**: Manage account information and preferences
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **State Management**: Zustand for client-side auth state

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: Better Auth (@better-auth/react)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

1. Clone the repository and navigate to the project:
```bash
cd vellume
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                      # Next.js app router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home/redirect page
│   ├── globals.css          # Global styles
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── write/               # Journal writing interface
│   ├── gallery/             # Entry gallery/pixel art view
│   └── settings/            # User settings
├── components/              # React components
│   ├── auth-layout.tsx      # Layout for authenticated pages
│   ├── navbar.tsx           # Navigation bar with user menu
│   └── protected-route.tsx  # Protected route wrapper
├── lib/
│   ├── store.ts             # Zustand auth store
│   └── auth-service.ts      # API service for authentication
└── public/                  # Static assets
```

## Pages

### Public Pages
- `/login` - Login with email and password
- `/signup` - Create a new account

### Protected Pages (require authentication)
- `/write` - Write and submit journal entries
- `/gallery` - View pixel art conversions (currently empty state)
- `/settings` - View/manage account information and sign out

## Features

### Authentication Flow
1. User visits `/` → redirects to `/login` if not authenticated
2. User logs in or signs up via Better Auth
3. Auth store persists user session in localStorage
4. Authenticated users can access protected routes
5. Sign out clears auth state and redirects to login

### Design
- **Color Scheme**: Cream background (#F4EBD9) with dark text (#2C3E50)
- **Typography**: Monospace fonts (JetBrains Mono fallback) for retro feel
- **Responsive**: Mobile-first design with Tailwind CSS breakpoints
- **Minimal**: Clean, distraction-free interface

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `http://localhost:3001` |

## API Integration

The app expects a backend API at the URL specified in `NEXT_PUBLIC_API_URL` with the following endpoints:

### Authentication Endpoints
- `POST /auth/login` - Login with email/password
- `POST /auth/signup` - Create new account
- `POST /auth/logout` - Logout user
- `GET /auth/session` - Get current session

## Development Notes

### What's Implemented
✅ Authentication pages (login/signup)
✅ Protected routes with auth guards
✅ Main navigation layout
✅ Core pages (write, gallery, settings)
✅ Responsive design
✅ Client-side state management
✅ Zustand auth store with persistence

### What's Not Implemented
❌ Backend API (assumed to exist)
❌ Database integration
❌ Pixel art generation
❌ Image upload
❌ Payment/subscription
❌ Real data fetching

These will be implemented when the backend API is ready.

## Running the App

```bash
# Development
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Linting
npm run lint
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge)

## Future Enhancements

- Pixel art conversion algorithm
- Image gallery with filters
- User profile customization
- Social sharing features
- Offline mode with sync
- Dark mode theme option
- Export entries as images

## License

MIT
