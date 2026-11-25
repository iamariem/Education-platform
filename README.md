# EduSaaS Education Platform

EduSaaS is a static, vanilla HTML/CSS/JavaScript education platform demo. It is
designed to run with Live Server or another static HTTP server. A backend PHP
directory exists for demo/server configuration, but this restructuring does not
change backend behavior.

## Final folder structure

```text
Education-platform/
├── backend/
│   ├── config.php
│   └── index.php
├── includes/
│   ├── navbar.html
│   ├── footer.html
│   └── sidebar.html
├── pages/
│   ├── shared/
│   │   ├── landing/
│   │   │   └── index.html
│   │   ├── Login.html
│   │   ├── Signup.html
│   │   └── EmailVerification.html
│   ├── student/
│   │   ├── StudentRegistration.html
│   │   ├── StudentDashboard.html
│   │   └── AITutor.html
│   └── teacher/
│       └── .gitkeep
├── public/
│   ├── css/
│   │   ├── components.css
│   │   ├── responsive.css
│   │   └── style.css
│   └── js/
│       ├── layout.js
│       └── main.js
└── styles/
    └── tokens.css
```

## Folder responsibilities

- `pages/shared/` contains public and authentication pages.
- `pages/shared/landing/` contains the public landing page.
- `pages/student/` contains student dashboard, AI tutor, and deferred registration pages.
- `pages/teacher/` is reserved for future teacher pages.
- `includes/` contains HTML templates for public/student navbar variants, footers,
  and the shared student sidebar.
- `public/css/` contains reusable component CSS, application CSS, and responsive rules.
- `styles/tokens.css` contains design tokens shared across the project.
- `public/js/layout.js` loads HTML layout templates with native `fetch()`.
- `public/js/main.js` contains the existing shared and page-specific demo application logic.
- `backend/` is unchanged by the restructuring.

## Running with Live Server

1. Open the repository folder in VS Code.
2. Start Live Server.
3. Open `pages/shared/landing/index.html` or another page from the Live Server browser URL.
4. Serve the project over HTTP. The layout loader uses `fetch()` and may not work
   reliably when files are opened directly with `file://`.

Because Live Server may be launched from a repository subfolder or a server root,
the layout loader derives its include root from `public/js/layout.js`.

## Shared layout architecture

`public/js/layout.js` reads elements marked with `data-layout` placeholders and loads
matching HTML templates from `includes/`.

The supported placeholder variants are:

- `data-layout="navbar"` with `public`, `student-dashboard`, or `student-ai`
- `data-layout="footer"` with `public` or `student`
- `data-layout="sidebar"` with `student-dashboard` or `student-ai`

`layout.js` returns a readiness promise through `window.eduLayouts.ready`. Page
initialization waits for layouts before binding layout-dependent event listeners.
It also initializes Lucide icons after layout injection and dispatches
`edu-layouts-ready` or `edu-layouts-error`.

Loading failures are displayed visibly and logged in the browser console. The loader
must be served over HTTP because native `fetch()` cannot reliably read include files
from `file://`.

## JavaScript organization

- `layout.js` is the isolated layout/include lifecycle.
- `main.js` preserves the existing shared and page-specific demo logic, including
  verification, signup, login, student dashboard, registration, and AI tutor behavior.
- Existing `DOMContentLoaded` and layout-ready guards prevent most page-specific logic
  from initializing on unrelated pages.
- Dynamic student and Lucide icon rendering is refreshed in place.

The monolithic `main.js` was preserved rather than split by mechanical extraction
because splitting its tightly coupled state and initialization blocks would introduce
browser behavior risk without an approved follow-up extraction phase.

## CSS organization

- `styles/tokens.css`: design tokens and CSS custom properties.
- `public/css/components.css`: reusable button, card, input, and modal primitives.
- `public/css/style.css`: landing, authentication, registration, dashboard, and AI styles.
- `public/css/responsive.css`: shared responsive and reduced-motion rules.

Existing CSS loading order and cascade are intentionally unchanged. The current
stylesheet split was preserved instead of moving rules mechanically, which could
change specificity or responsive behavior.

## Courses-only signup flow

The active signup flow remains Courses-only in the shared signup page. Student
registration is not linked by, or required by, the active signup flow.

## Deferred Student Registration

The complete Student Registration implementation remains in
`pages/student/StudentRegistration.html` with its existing HTML, JavaScript, and
registration-related styling references preserved for next semester.

Its active signup access is disabled: the shared Signup flow continues to save and
verify course students directly and does not navigate to Student Registration.

The registration page is not a finished standalone route and should not be added back
until the deferred feature is explicitly reactivated.

## Known missing files

- `public/css/student-registration.css` is referenced by
  `pages/student/StudentRegistration.html` but does not exist. No fake replacement
  stylesheet was created.

## Known unfinished destinations

The following destinations are existing placeholders or unfinished demo links:

- `student-courses.html`
- `student-assessment.html`
- `student-profile.html`
- `student-settings.html`
- `terms.html`
- `privacy.html`
- Landing navigation item `#teachers`

No replacement or placeholder pages were created.