# v6.2 — Select All, RTL/ژباړه، Themes او Interaction Fix

- `Select all` د Results toolbar ته اضافه شو. دا یوازې د اوسني Filter/Search/Specialty مطابق اصطلاحات ټاکي.
- که ټول filtered terms ټاکل شوي وي، بټن `Deselect all` کېږي.
- د Term عکس باندې Click/Enter/Space هم term Select/Deselect کوي؛ checkbox هم کار کوي.
- Detail panel د × Close بټن قوي/مستقیم handler لري او Escape هم panel بندوي.
- د Account ښکته arrow `▾` شو او custom کوچنی account menu هماغسې ساتل شوی.
- Language/Theme/Account top controls یو شان height او منظم width لري.
- Ocean, Forest, Violet او Sand themes اوس ټول Workspace رنګونه بدلوي.
- د پښتو/دري/فارسي/عربي content انتخاب نور ټول UI RTL نه اړوي؛ یوازې translated medical content RTL ښودل کېږي، نو mobile/desktop layout نه خرابېږي.
- External auth module د اصلي `smd-auth-v5` session storage سره برابر شو؛ د `Please sign in first` غلط mismatch حل شو.
- Missing translations: cached/local translation اول کارول کېږي. نوی AI translation لا هم د deployed AI Worker URL ته اړتیا لري؛ static GitHub Pages په خپله AI model نه چلوي.
