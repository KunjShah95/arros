# Frontend Redesign Specification

**Date**: 2026-05-01  
**Project**: ARROS Frontend Complete Redesign  
**Design System**: Clean Minimal with European Design Taste

---

## 1. Design Philosophy

European design taste - refined, sophisticated, minimal:
- Generous whitespace and breathing room
- Elegant typography with clear hierarchy
- Muted, sophisticated color palette
- Subtle interactions over flashy animations
- Clear visual boundaries without heaviness

Inspiration: Milanese fashion brands, Danish furniture design, German engineering precision.

---

## 2. Color Palette

### Light Mode (Primary)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#FAFAFA` | Main background |
| `--bg-secondary` | `#F5F5F0` | Cards, surfaces |
| `--bg-tertiary` | `#EDEDEB` | Hover states, inputs |
| `--text-primary` | `#1A1A1A` | Headings, body |
| `--text-secondary` | `#6B6B6B` | Secondary text |
| `--text-muted` | `#9CA3AF` | Placeholders |
| `--border` | `#E5E5E0` | Borders, dividers |
| `--border-focus` | `#1A1A1A` | Focus states |

### Accent Colors (Choose One)
| Option | Accent | Usage |
|--------|-------|-------|
| A | `#C4785A` (Terracotta) | CTAs, links, active states |
| B | `#7D8F77` (Sage) | CTAs, links, active states |
| C | `#B85C5C` (Dusty Rose) | CTAs, links, active states |

*Default: Terracotta (#C4785A)*

### Semantic
| Token | Value |
|-------|-------|
| `--success` | `#4A7C59` |
| `--warning` | `#D4A853` |
| `--error` | `#C25050` |

---

## 3. Typography

### Font Stack
- **Headings**: `"Playfair Display", Georgia, serif` - Elegant, editorial
- **Body**: `"DM Sans", -apple-system, sans-serif` - Clean, readable
- **Mono**: `"JetBrains Mono", monospace` - Code, technical

### Scale
| Token | Size | Line Height |
|-------|------|------------|
| `--text-xs` | 12px | 1.4 |
| `--text-sm` | 14px | 1.5 |
| `--text-base` | 16px | 1.6 |
| `--text-lg` | 18px | 1.6 |
| `--text-xl` | 24px | 1.3 |
| `--text-2xl` | 32px | 1.2 |
| `--text-3xl` | 48px | 1.1 |
| `--text-4xl` | 64px | 1.0 |

### Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

---

## 4. Spacing System

Base unit: 4px

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |

---

## 5. Components

### Button Variants

```tsx
// Primary - Solid accent color
<Button variant="primary">Get Started</Button>

// Secondary - Outline style  
<Button variant="secondary">Learn More</Button>

// Ghost - Text only
<Button variant="ghost">Cancel</Button>

// Sizes: sm (32px), md (40px), lg (48px)
```

**Styles**:
- Border radius: 4px (small, refined)
- Padding: 12px 24px (md)
- Font: 14px, 500 weight
- Transition: 150ms ease

### Input Fields

```tsx
<Input 
  label="Email"
  type="email" 
  placeholder="you@example.com"
/>
```

**Styles**:
- Background: `--bg-tertiary`
- Border: 1px solid `--border`
- Border radius: 4px
- Padding: 12px 16px
- Focus: border-color `--border-focus`
- Height: 44px

### Cards

```tsx
<Card>
  Content here
</Card>
```

**Styles**:
- Background: `--bg-secondary`
- Border: 1px solid `--border`
- Border radius: 8px
- Padding: 24px
- Shadow: `0 1px 3px rgba(0,0,0,0.04)` (subtle)

### Navigation/Sidebar

- Fixed left sidebar: 240px width
- Background: `--bg-secondary`
- Border right: 1px solid `--border`
- Items: 44px height, 16px padding
- Active: `--bg-tertiary` + accent left border (3px)

### Modal/Dialog

- Centered, max-width: 480px
- Backdrop: rgba(0,0,0,0.3)
- Border radius: 12px
- Padding: 32px

---

## 6. Layout Structure

### Landing Page
- Full-width hero with centered content
- Max-width: 1200px for sections
- Generous vertical spacing (96px between sections)
- Clean section headers with subtle dividers

### Auth Pages (SignIn/SignUp)
- Centered card layout (max-width: 400px)
- Clean form with clear labels
- Social login buttons (Google OAuth)

### App Layout
- Sidebar: 240px fixed left
- Main content: fluid, with 24px padding
- Header within app: 64px height

### Responsive
| Breakpoint | Width |
|------------|-------|
| Mobile | < 640px |
| Tablet | 640px - 1024px |
| Desktop | > 1024px |

Mobile: Sidebar becomes bottom nav or hamburger menu.

---

## 7. Pages to Redesign

### Auth & Landing (5 pages)
1. **LandingPage** (`/`) - Hero, features, CTA
2. **SignInPage** (`/signin`) - Email/password + Google OAuth
3. **SignUpPage** (`/signup`) - Email/password + Google OAuth
4. **ForgotPasswordPage** (`/forgot-password`) - Simple form
5. **PricingPage** (`/pricing`) - Pricing tiers

### Main App Layout (2)
6. **AppLayout + Sidebar** - New navigation
7. **DashboardPage** - Overview + research input

### Feature Pages (10)
8. **SourcesPage** - Source management
9. **HistoryPage** - Past research
10. **SettingsPage** - User settings
11. **KnowledgeGraphPage** - Graph visualization
12. **VoiceStudioPage** - Voice tools
13. **DocumentScannerPage** - OCR tools
14. **StudyOSPage** - Study tools
15. **LearningOSPage** - Learning tools
16. **LearningOS2Page** - Alternative learning
17. **FlashcardsPage** - Flashcard system
18. **MediaResearchPage** - Media research
19. **XPDashboardPage** - XP/points system
20. **AnalyticsPage** - Usage analytics

---

## 8. Authentication (OAuth)

### Frontend Flow
- Add Google OAuth button to SignInPage and SignUpPage
- Button triggers `/api/auth/google` redirect
- Handle OAuth callback with session token

### Backend Routes (To Implement)
```
GET  /api/auth/google         - Redirect to Google OAuth
GET  /api/auth/google/callback - Handle callback
POST /api/auth/session       - Create session from OAuth
```

*Note: OAuth credentials to be added by user. Placeholder config for now.*

### UI Implementation
```tsx
// SignIn/SignUp page - Social buttons section
<Button variant="social" provider="google">
  Continue with Google
</Button>
```

---

## 9. Animations

Minimal, purposeful transitions:

- **Page transitions**: Fade, 200ms
- **Hover states**: 150ms ease color/background
- **Modal**: Scale + fade, 200ms
- **Sidebar**: Slide, 200ms (mobile)

No flashy effects. Everything feels purposeful and refined.

---

## 10. Acceptance Criteria

### Visual
- [ ] Unified color palette across all pages
- [ ] Consistent typography scale
- [ ] Proper spacing system
- [ ] Responsive on mobile/tablet/desktop
- [ ] Clean, minimal aesthetic achieved

### Functional
- [ ] SignIn/SignUp with email/password works
- [ ] Google OAuth button present (placeholder)
- [ ] All pages accessible via navigation
- [ ] Dashboard research input functional

### Technical
- [ ] Tailwind 4 theme configured
- [ ] Custom design tokens
- [ ] Components reusable
- [ ] No console errors

---

## 11. Out of Scope

- Backend OAuth credential setup (user adds later)
- Database changes
- Additional features beyond redesign
- Browser testing (manual verification)

---

*End of Spec*