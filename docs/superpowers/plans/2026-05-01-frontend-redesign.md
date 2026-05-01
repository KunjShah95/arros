# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete frontend redesign with European design aesthetic - clean, minimal, sophisticated. Add Google OAuth placeholder to auth pages.

**Architecture:** Hybrid approach - maintain React 19 + Tailwind 4 structure, but overhaul design tokens and components system. Redesign all pages to match spec.

**Tech Stack:** React 19, Tailwind 4, Vite, Framer Motion (minimal - just fundamental transitions), Lucide React

---

## File Mapping

### Design System Files (Foundation)
- `client/src/index.css` - Tailwind theme configuration (design tokens)
- `client/src/components/ui.tsx` - Design system components (Button, Card, Input)
- `client/src/App.tsx` - App layout with new nav structure

### Pages to Redesign
- `client/src/pages/LandingPage.tsx` - Landing page
- `client/src/pages/SignInPage.tsx` - Sign in + Google OAuth
- `client/src/pages/SignUpPage.tsx` - Sign up + Google OAuth
- `client/src/pages/ForgotPasswordPage.tsx` - Password recovery
- `client/src/pages/PricingPage.tsx` - Pricing
- `client/src/pages/DashboardPage.tsx` - Dashboard
- `client/src/pages/SourcesPage.tsx` - Sources
- `client/src/pages/HistoryPage.tsx` - History
- `client/src/pages/SettingsPage.tsx` - Settings
- `client/src/components/Sidebar.tsx` - Navigation
- `client/src/pages/KnowledgeGraphPage.tsx` - Knowledge graph
- `client/src/pages/VoiceStudioPage.tsx` - Voice tools
- `client/src/pages/DocumentScannerPage.tsx` - OCR tools
- `client/src/pages/StudyOSPage.tsx` - Study tools
- `client/src/pages/LearningOSPage.tsx` - Learning
- `client/src/pages/LearningOS2Page.tsx` - Learning 2
- `client/src/pages/FlashcardsPage.tsx` - Flashcards
- `client/src/pages/MediaResearchPage.tsx` - Media research
- `client/src/pages/XPDashboardPage.tsx` - XP system
- `client/src/pages/AnalyticsPage.tsx` - Analytics

### Backend for OAuth
- `server/src/routes/auth.ts` - Add OAuth routes

---

## Task 1: Configure Design System (Tailwind Theme)

**Files:**
- Modify: `client/src/index.css`
- Create: `client/src/app.css` (new import file)

- [ ] **Step 1: Create design tokens CSS with Tailwind 4 @theme**

```css
@import "tailwindcss";

@theme {
  /* Colors - Light Mode */
  --color-bg-primary: #FAFAFA;
  --color-bg-secondary: #F5F5F0;
  --color-bg-tertiary: #EDEDEB;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-muted: #9CA3AF;
  --color-border: #E5E5E0;
  --color-border-focus: #1A1A1A;
  
  /* Accent - Terracotta */
  --color-accent: #C4785A;
  --color-accent-hover: #B36B4D;
  --color-accent-light: #F5E6E0;
  
  /* Semantic */
  --color-success: #4A7C59;
  --color-warning: #D4A853;
  --color-error: #C25050;
  
  /* Fonts */
  --font-heading: "Playfair Display", Georgia, serif;
  --font-body: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  
  /* Spacing */
  --spacing-18: 72px;
  --spacing-22: 88px;
}

@layer base {
  html {
    font-family: var(--font-body);
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
  }
}
```

- [ ] **Step 2: Verify Tailwind config**
Run: `cd client && npm run build` to verify no errors.

- [ ] **Step 3: Commit**
```bash
git add client/src/index.css
git commit -m "feat: add European design system theme to Tailwind 4"
```

---

## Task 2: Redesign UI Components

**Files:**
- Modify: `client/src/components/ui.tsx`

- [ ] **Step 1: Rewrite Button component with new design**

The file `client/src/components/ui.tsx` already has a Button component. Read it first, then replace styles to match spec:
- Accent color: #C4785A
- Border-radius: 4px
- Height: 40px (md), 32px (sm), 48px (lg)
- Font: 14px, 500 weight, uppercase tracking 0.05em
- Transition: 150ms ease

Add these Button variants:
- `primary` - solid accent background
- `secondary` - outline with border
- `ghost` - text only
- `social` - for Google OAuth (neutral background, border)

- [ ] **Step 2: Rewrite Card component**

- Background: `--color-bg-secondary`
- Border: 1px solid `--color-border`
- Border-radius: 8px (or 4px for smaller cards)
- Padding: 24px
- Shadow: subtle `0 1px 3px rgba(0,0,0,0.04)`

- [ ] **Step 3: Add Input component**

Create Input component with:
- Background: `--color-bg-tertiary`
- Border: 1px solid `--color-border`
- Border-radius: 4px
- Padding: 12px 16px
- Height: 44px
- Focus: border-color `--color-border-focus`

- [ ] **Step 4: Commit**
```bash
git add client/src/components/ui.tsx
git commit -m "feat: redesign UI components with European aesthetic"
```

---

## Task 3: Redesign Landing Page

**Files:**
- Modify: `client/src/pages/LandingPage.tsx`

- [ ] **Step 1: Read current LandingPage.tsx**

Review the current implementation (456 lines).

- [ ] **Step 2: Redesign with European aesthetic**

Key changes:
- Light background (#FAFAFA) instead of dark void
- Charcoal text (#1A1A1A) instead of white
- Terracotta accent (#C4785A) for CTAs
- Playfair Display for headings
- Generous whitespace (64-96px between sections)
- Clean typography hierarchy
- Remove dark effects, mandala, grid patterns
- Keep motion/animation minimal - just subtle fade-in

Structure to keep:
- Navigation (redesign to light)
- Hero section
- Features section
- CTA section
- Footer

- [ ] **Step 3: Test page loads**
Run: `cd client && npm run dev` - verify page renders.

- [ ] **Step 4: Commit**
```bash
git add client/src/pages/LandingPage.tsx
git commit -m "feat: redesign LandingPage with European design"
```

---

## Task 4: Redesign Auth Pages (SignIn, SignUp, ForgotPassword)

**Files:**
- Modify: `client/src/pages/SignInPage.tsx`
- Modify: `client/src/pages/SignUpPage.tsx`
- Modify: `client/src/pages/ForgotPasswordPage.tsx`

- [ ] **Step 1: Read SignInPage.tsx**

Current implementation (158 lines).

- [ ] **Step 2: Redesign SignInPage**

- Centered card on light background (max-width 400px)
- Clean form with Input component
- Add Google OAuth button (secondary/social style)
- Keep "Continue with Google" wording
- Update terminology: remove Sanskrit, use simple English
- Terracotta accent for primary CTA button

- [ ] **Step 3: Add Google OAuth button**

```tsx
<Button variant="social" onClick={handleGoogleOAuth}>
  <img src="/google-icon.svg" className="w-5 h-5 mr-3" />
  Continue with Google
</Button>
```

- [ ] **Step 4: Apply same patterns to SignUpPage**

- [ ] **Step 5: Apply same patterns to ForgotPasswordPage**

- [ ] **Step 6: Test auth pages**
Run dev server, navigate to /signin, /signup, /forgot-password.

- [ ] **Step 7: Commit**
```bash
git add client/src/pages/SignInPage.tsx client/src/pages/SignUpPage.tsx client/src/pages/ForgotPasswordPage.tsx
git commit -m "feat: redesign auth pages with Google OAuth buttons"
```

---

## Task 5: Redesign Pricing Page

**Files:**
- Modify: `client/src/pages/PricingPage.tsx`

- [ ] **Step 1: Read PricingPage.tsx**

Search for existing file or will create new.

- [ ] **Step 2: Redesign with European aesthetic**

- Simple pricing cards with clean borders
- Terracotta accent for "current" plan
- Light backgrounds

- [ ] **Step 3: Commit**

---

## Task 6: Redesign App Layout (Sidebar + Dashboard)

**Files:**
- Modify: `client/src/components/Sidebar.tsx`
- Modify: `client/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Read Sidebar.tsx**

- [ ] **Step 2: Redesign Sidebar**

- Width: 240px
- Background: --color-bg-secondary
- Border right: 1px solid --color-border
- Text: charcoal
- Active item: --color-bg-tertiary + accent left border (3px)
- Remove dark theming

- [ ] **Step 3: Redesign DashboardPage**

- Clean layout with search/research input
- Stats cards in clean card components
- Recent activity list

- [ ] **Step 4: Commit**

---

## Task 7: Redesign Feature Pages

**Files:**
- Modify: `client/src/pages/SourcesPage.tsx`
- Modify: `client/src/pages/HistoryPage.tsx`
- Modify: `client/src/pages/SettingsPage.tsx`
- Modify: `client/src/pages/KnowledgeGraphPage.tsx`
- Modify: `client/src/pages/VoiceStudioPage.tsx`
- Modify: `client/src/pages/DocumentScannerPage.tsx`
- Modify: `client/src/pages/StudyOSPage.tsx`
- Modify: `client/src/pages/LearningOSPage.tsx`
- Modify: `client/src/pages/LearningOS2Page.tsx`
- Modify: `client/src/pages/FlashcardsPage.tsx`
- Modify: `client/src/pages/MediaResearchPage.tsx`
- Modify: `client/src/pages/XPDashboardPage.tsx`
- Modify: `client/src/pages/AnalyticsPage.tsx`

- [ ] **Step 1: Redesign SourcesPage**

Clean source list with:
- Card-based source items
- Clean typography
- Terracotta for actions

- [ ] **Step 2: Redesign HistoryPage**

- Simple list layout
- Clean date formatting

- [ ] **Step 3: Redesign SettingsPage**

- Section-based form layout
- Clean input fields

- [ ] **Step 4: Commit batch 1**
```bash
git add client/src/pages/SourcesPage.tsx client/src/pages/HistoryPage.tsx client/src/pages/SettingsPage.tsx
git commit -m "feat: redesign Sources, History, Settings pages"
```

- [ ] **Step 5: Continue with remaining pages**

Same pattern - apply European aesthetic to each:
- KnowledgeGraphPage - clean graph visualization
- VoiceStudioPage - clean audio controls
- DocumentScannerPage - clean scanner UI
- StudyOSPage - study tools
- LearningOSPage - learning interface
- LearningOS2Page - alternative learning
- FlashcardsPage - flashcard system
- MediaResearchPage - media tools
- XPDashboardPage - XP display
- AnalyticsPage - stats

- [ ] **Step 6: Commit remaining**
```bash
git add client/src/pages/*.tsx
git commit -m "feat: redesign remaining feature pages"
```

---

## Task 8: Add OAuth Backend Routes (Placeholder)

**Files:**
- Modify: `server/src/routes/auth.ts`
- Create: OAuth config placeholder

- [ ] **Step 1: Read existing auth routes**
Location: `server/src/routes/api.ts` - check current auth endpoints.

- [ ] **Step 2: Add OAuth routes**

```typescript
// GET /api/auth/google - Redirect to Google OAuth
router.get('/auth/google', (req, res) => {
  // Placeholder - user adds credentials later
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || 'placeholder',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });
  res.redirect(`${googleAuthUrl}?${params}`);
});

// GET /api/auth/google/callback - Handle OAuth callback
router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }
  // Placeholder - user implements token exchange
  res.json({ message: 'OAuth callback - implement with credentials' });
});
```

- [ ] **Step 3: Commit**
```bash
git add server/src/routes/api.ts
git commit -m "feat: add placeholder OAuth routes for Google"
```

---

## Task 9: Verify & Final Testing

**Files:**
- All modified

- [ ] **Step 1: Run app and verify no console errors**

- [ ] **Step 2: Verify design consistency across all pages**

- [ ] **Step 3: Verify responsive behavior**

- [ ] **Step 4: Final commit**
```bash
git add . && git commit -m "feat: complete frontend redesign with European aesthetic"
```

---

## Implementation Notes

1. The design tokens in `index.css` are the source of truth - use Tailwind's `var(--token)` syntax in components.

2. Button variant styles: modify `ui.tsx` Button component to accept `variant="primary | secondary | ghost | social"`.

3. For Google OAuth - buttons should trigger Google flow even without credentials (that's the placeholder approach).

4. Skip pages that don't exist - some pages listed may not be in the codebase yet.

5. Test each page by running dev server and navigating to the route.

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-01-frontend-redesign.md`. Two execution options:**

1. **Subagent-Driven (recommended)** - Dispatch subagents per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**