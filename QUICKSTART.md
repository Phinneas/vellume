# Vellume - Quick Start Guide

## What's Built

Vellume is a fully functional Next.js 15 UI shell for a pixel art journaling application. All authentication pages and layouts are implemented and working.

### ✅ Completed Features

1. **Authentication System**
   - Login page (`/login`) with email/password form
   - Signup page (`/signup`) with name/email/password form
   - Session management using Zustand store
   - Auto-redirect to login if not authenticated
   - Persistent auth state in localStorage

2. **Main Application Layout**
   - Responsive navigation bar with:
     - Vellume logo/branding (left)
     - Navigation links: Write, Gallery, Settings (center)
     - User avatar with dropdown menu (right)
     - Mobile-responsive hamburger menu
   - Clean, minimal design with retro monospace fonts

3. **Pages**
   - `/` - Redirects to `/write` if authenticated, `/login` otherwise
   - `/login` - Email/password login form
   - `/signup` - Registration form (name, email, password)
   - `/write` - Journal entry textarea (full-height interface)
   - `/gallery` - Empty state placeholder for pixel art gallery
   - `/settings` - User profile display and sign out button

4. **Design & Styling**
   - Cream background (#F4EBD9) with dark text (#2C3E50)
   - Monospace fonts for retro feel
   - Fully responsive design (mobile, tablet, desktop)
   - Clean borders and minimal aesthetic
   - Tailwind CSS for all styling

5. **State Management**
   - Zustand store for auth state
   - Automatic route protection for authenticated pages
   - Session persistence across page reloads

## Running the App

The dev server is already running on **http://localhost:3000**

To start from scratch:
```bash
npm run dev
```

## Testing the Auth Flow

1. Go to http://localhost:3000
   - You'll be redirected to `/login`

2. Try the signup flow:
   - Click "Sign up" link on login page
   - Fill in: Name, Email, Password
   - Click "Sign Up"
   - **Note**: This will fail because the API isn't implemented yet, but the UI/logic is ready

3. Mock login for testing (for development):
   - In DevTools Console, run:
   ```javascript
   // Mock a user session
   const store = require('/src/lib/store').useAuthStore;
   store.getState().login({ id: '1', name: 'Test User', email: 'test@example.com' });
   ```
   - You'll be able to navigate to `/write`, `/gallery`, and `/settings`

## What's NOT Implemented (By Design)

- Backend API and database
- Pixel art generation logic
- Image upload functionality
- Payment/subscription system
- Real email verification
- Password reset flow
- User profile editing

These features are intentionally left out to focus on the UI shell and auth flow.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home redirect page
│   ├── globals.css             # Global styles and theme
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Signup page
│   ├── write/page.tsx          # Journal write interface
│   ├── gallery/page.tsx        # Gallery view
│   └── settings/page.tsx       # User settings
├── components/
│   ├── auth-layout.tsx         # Wrapper for protected pages
│   ├── navbar.tsx              # Top navigation bar
│   └── protected-route.tsx     # Route protection wrapper
├── lib/
│   ├── store.ts                # Zustand auth store
│   └── auth-service.ts         # API service (mock ready)
└── public/                     # Static files
```

## Connecting to Backend API

When your backend is ready, update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://your-api-url.com
```

The app expects these API endpoints:
- `POST /auth/login` - Returns `{ user, session }`
- `POST /auth/signup` - Returns `{ user, session }`
- `POST /auth/logout` - No return value needed
- `GET /auth/session` - Returns `{ user, session }`

Response format expected:
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "session": {
    "token": "string"
  }
}
```

## Next Steps

1. **Implement Backend API**
   - Create auth endpoints that match the expected format
   - Test login/signup flow with real database

2. **Add Pixel Art Generation**
   - Implement conversion algorithm
   - Store pixel art images in database

3. **Build Entry Submission**
   - Update `/write` page to POST entries to API
   - Save images and metadata

4. **Gallery Features**
   - Fetch entries from API
   - Display pixel art grid
   - Add filters and sorting

5. **Enhanced Settings**
   - Allow profile editing
   - Add preferences (color scheme, font size)
   - Export/backup entries

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Run linting
npm run lint

# Check TypeScript
npm run type-check  # if configured
```

## Browser DevTools Tips

To test auth state:
```javascript
// In browser console
import { useAuthStore } from '@/lib/store'
const store = useAuthStore.getState()

// Check current auth state
console.log(store.user, store.isAuthenticated)

// Manually set user (for testing)
store.login({ id: '1', name: 'John Doe', email: 'john@example.com' })

// Logout
store.logout()
```

## Styling Customization

Edit `src/app/globals.css` to change:
- Color scheme (--color-cream, --color-dark)
- Font families
- Base text size and spacing

Edit component files to adjust:
- Component-specific Tailwind classes
- Spacing and sizing
- Responsive breakpoints

## Common Issues

**Q: I see a "Loading..." message that doesn't go away**
A: The app is trying to check auth state. It will redirect once the state loads. If it persists, check browser console for errors.

**Q: Login/Signup form won't submit**
A: The API endpoint needs to be running at `NEXT_PUBLIC_API_URL`. Check the value in `.env.local`.

**Q: Styles look off on mobile**
A: The app is responsive but uses Tailwind's default breakpoints. Edit component classes if needed for your design.

## Support

For issues or questions about the implementation, check:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Zustand Docs](https://github.com/pmndrs/zustand)
