Create a new web page named "$ARGUMENTS" in the src/ directory.

1. Read 2-3 existing pages in src/pages/ to confirm current conventions (export style, import order, component structure).
2. Determine if this is a coach page (src/pages/), client page (src/pages/client/), or public page, based on the name or ask if ambiguous.
3. Create the page component file following the exact conventions observed: default export, Tailwind styling, useAuth/useClientAuth hook if needed.
4. Add a lazy-loaded route in src/App.tsx, following the existing pattern:
   const PageName = lazy(() => import('./pages/PageName'));
   Add the <Route> in the correct section (coach/client/public).
5. Add i18n keys for any new user-facing strings: update both src/i18n/fr.ts and src/i18n/es.ts with matching keys (use the same key path, translate appropriately).
6. Report all files created or modified.
