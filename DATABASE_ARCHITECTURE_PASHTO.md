# Database Architecture — Suhail Medical Dictionary

سیستم **Hybrid storage architecture** لري.

## 1. Cloud Database — Supabase PostgreSQL
`supabase/schema.sql` د production database schema دی. پکې دا جدولونه شته:
- `profiles` — user profile، owner flag او privacy consent
- `chats` — د AI chat sessions
- `ai_messages` — user/assistant messages
- `user_events` — analytics/activity events
- `term_translation_cache` — generated/shared translations
- `ai_usage_daily` — د وړیا AI ورځنی usage control

Row Level Security (RLS) فعاله ده؛ عادي user یوازې خپل chat/profile data لولي. Admin content audit یوازې د user په explicit consent سره کېږي.

## 2. Supabase Auth
Google Sign-In د Supabase Auth له لارې دی. Publishable/anon key frontend کې public key دی؛ **Service Role key باید هېڅکله frontend/GitHub ته لاړ نه شي**.

## 3. Offline / Local Data
- Dictionary base data: `data/*.json` او offline packs
- 3D Anatomy: local OBJ model packs
- PWA Cache API: pages/assets/offline packs
- IndexedDB: generated term translations د device offline reuse لپاره
- localStorage: theme، language، bookmarks، selected/history او cached session preferences

دا architecture قصداً hybrid ده: account/chat data cloud کې خوندي وي، خو dictionary/anatomy د سرعت او offline لپاره په device کې هم موجود وي.
