# Third-party notices

Phase 7+ does not require a remote JavaScript SDK at runtime. Optional Supabase integration uses the public Supabase Auth and Data REST endpoints configured by the project owner.

Bootstrap remains locally bundled by the existing project and is subject to its upstream license.

## Detailed 3D anatomy viewer

The optional online detailed Anatomy viewer uses open-licensed anatomy assets and free/open-source rendering software. No proprietary geometry, textures, or code from the commercial anatomy application used as a visual reference is included.

- **Male Muscles primary renderer:** the refined `body.glb` distributed by **NaS Research** is derived from Z-Anatomy / BodyParts3D browser models. Its project notice retains **CC BY-SA 4.0** for the refined derivative, preserves source structure identifiers, and documents smooth shading plus baked tissue-color, roughness, and tangent-normal maps. In this app only the muscular portion is shown in Muscles mode; skeletal meshes remain hidden there.
- **Female Muscles renderer:** `full-body-female-mobile.glb` from **Fit Mit With — anatomy atlas**, an adapted Z-Anatomy / BodyParts3D model distributed under **CC BY-SA 4.0**. Its upstream project explicitly describes the female geometry as an illustrative artist-authored deformation with unverified proportions, not an independently sourced female anatomy scan. This app preserves that limitation and uses it only as an educational visual reference.
- **Male muscle fallback:** the higher-detail Z-Anatomy muscular-system GLB exported from `Startup.blend` and distributed by the public `Liyucheng1997/242_lab-human-anatomy` project. Z-Anatomy is **CC BY-SA 4.0** and attributes underlying BodyParts3D geometry to The Database Center for Life Science.
- **Skeleton and other atlas layers:** BodyParts3D-derived web assets from the public `dev-christianmendes/anatomia_humana_3d` repository; BodyParts3D is credited to The Database Center for Life Science (DBCLS) under its applicable Creative Commons terms recorded by the source project.
- **Full human anatomy atlas systems:** the viewer uses open per-system atlas data for skeletal, connective/joint, arterial, venous, nervous, respiratory, digestive, urinary, lymphatic, endocrine, reproductive, sensory, and related layers.
- **Renderer:** three.js, licensed under the **MIT License**. Browser modules are loaded from public ESM/CDN endpoints only when the detailed online viewer is opened.
- The app keeps its bundled local anatomy geometry as an offline fallback when detailed online assets are unavailable.

Changes made by this project include runtime material calibration, studio lighting, mobile camera fitting, structure selection, green selection highlighting, popup information, and small non-diagnostic eye-context geometry when a muscle asset does not include visible eyeball structures.

The detailed models are educational reference models and are not intended for diagnosis, clinical measurement, treatment planning, or surgical planning.
