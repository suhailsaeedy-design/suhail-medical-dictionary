# Suhail Medical Dictionary v20.19.0 — GitHub Action Fix

اصلي deployment failure د website UI نه و. `verify_v2019_aqua.py` د `bs4`/BeautifulSoup import کاوه، خو GitHub Actions runner کې beautifulsoup4 نصب نه و، نو workflow د verification په مرحله کې ودرېد.

## اصلاح
- `verify_v2019_aqua.py` اوس یوازې د Python built-in libraries کاروي.
- BeautifulSoup/bs4 dependency بشپړه لرې شوه.
- Login card check د built-in `HTMLParser` له لارې کېږي.
- Static HTML refs د dependency-free attribute scan له لارې verify کېږي.
- Dynamic JavaScript template refs لکه `${visualUrl(item)}` د static-file verifier له غلط missing-file check څخه مستثنا شول.
- Workflow مخکې له verifier څخه `python -m py_compile verify_v2019_aqua.py` هم چلوي.

## ازموینه
GitHub workflow ته ورته required-file checks + py_compile + `python verify_v2019_aqua.py` محلي PASS شول.

دا UI/content release نه بدلوي؛ یوازې deployment verifier/CI fix دی.
