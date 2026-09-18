# Suhail Medical Dictionary v13 — Reference-Locked Build

This build is intentionally locked to the approved Suhail Medical Dictionary reference screens rather than introducing a new visual direction.

## Visual targets implemented
- Light desktop: pale blue/white glass shell, left navigation, large heart/books/DNA hero, 4-column medical cards, right detail panel.
- Dark desktop: deep neon-blue glass shell, glowing edges, heart/DNA/bubble hero, luminous cards, right 3D-style detail panel.
- Mobile: compact two-column cards, dense list option, slide-out navigation drawer, bottom navigation, account avatar, term bottom sheet.
- Login: premium medical-glass composition with the same light-blue 3D visual family, while preserving the requested Google-only authentication flow.
- AI Study: separate chat workspace with saved chats, New Chat, Rename, Delete, selected-term context, voice controls, and the same visual system.
- About: stays inside the application shell with sidebar/top bar and uses the same reference design language.

## Deliberate product requirements retained
The approved login artwork showed email/password fields, but this project keeps Google OAuth only because the required product behavior is: users authenticate with Google and their private data is associated with their authenticated Supabase user ID. The website never receives a Google password.

## Interaction details
- Light is the default theme.
- Dark/Blue themes change the full interface, not only text color.
- Pointer water droplets and mobile touch ripple effects.
- 3D View toggle and animated medical visuals.
- Detail visual supports pointer/touch drag rotation.
- Select All selects only the currently filtered result set.
- Term visual click toggles selection; term body opens details.
- Detail Close, Print, PDF, Selected, Bookmarks, History, Offline, profile menu, mobile drawer, themes, and AI chat controls are wired.
