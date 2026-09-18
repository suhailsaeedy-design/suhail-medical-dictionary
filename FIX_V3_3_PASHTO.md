# v3.3 مهم اصلاحات

- د `Opening your study workspace…` بې پای spinner لپاره timeout او recovery screen اضافه شوی.
- Supabase JavaScript SDK په ثابت `2.116.0` version pin شوی.
- Authentication لپاره نوی storage key کارول کېږي، څو د زاړه browser auth state/lock ستونزې له منځه ولاړې شي.
- Website نور په پخواني Gmail په خپله Dictionary ته نه داخلیږي.
- که حساب مخکې داخل وي، Login page دوه اختیارونه ښيي: `Continue with this account` او `Use another Google account`.
- `Choose a Google account` تل Google ته `prompt=select_account` لېږي، نو کاروونکی حساب انتخابوي.
- Sign out محلي session پاکوي، حتی که cloud sign-out لنډمهاله timeout شي.
- Supabase public URL او publishable key مخکې تنظیم شوي. Google Client Secret په پروژه کې نشته او باید هیڅکله GitHub ته پورته نه شي.
