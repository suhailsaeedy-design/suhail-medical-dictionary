# Third-party notices

Phase 7+ does not require a remote JavaScript SDK at runtime. Optional Supabase integration uses the public Supabase Auth and Data REST endpoints configured by the project owner.

Bootstrap remains locally bundled by the existing project and is subject to its upstream license.

## Detailed 3D anatomy viewer

The optional online detailed Anatomy viewer uses open-licensed anatomy assets and free/open-source rendering software. No proprietary assets from commercial anatomy applications are included.

- **Full human anatomy atlas:** BodyParts3D 4.0, © The Database Center for Life Science (DBCLS), licensed under **CC BY 4.0**. The viewer uses the open per-system atlas derived from BodyParts3D for skeletal, muscular, connective/joint, arterial, venous, nervous, respiratory, digestive, urinary, lymphatic, endocrine, reproductive, sensory and related layers. The BodyParts3D muscular system is the primary muscle layer in the current viewer.
- **Compatible muscle asset:** Z-Anatomy — Models of Human Anatomy, licensed under **CC BY-SA 4.0**, derived in part from BodyParts3D. The converted Z-Anatomy muscle asset remains available in the project as an open compatible/fallback resource; it is not presented as proprietary content from a commercial anatomy application.
- **Web-ready source assets:** loaded from the public `dev-christianmendes/anatomia_humana_3d` repository, whose asset metadata documents source licenses and conversion steps.
- **Renderer:** three.js, licensed under the **MIT License**. Browser modules are loaded from public ESM/CDN endpoints only when the detailed online viewer is opened.
- The app keeps its bundled local anatomy geometry as an offline fallback when the detailed online assets are unavailable.

The detailed models are educational reference models and are not intended for diagnosis, clinical measurement, treatment planning, or surgical planning.
