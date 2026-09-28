# Third-party notices

Phase 7+ does not require a remote JavaScript SDK at runtime. Optional Supabase integration uses the public Supabase Auth and Data REST endpoints configured by the project owner.

Bootstrap remains locally bundled by the existing project and is subject to its upstream license.

## Detailed 3D anatomy viewer

The optional online detailed Skeleton/Muscles viewer uses open-licensed anatomy assets and free/open-source rendering software. No proprietary assets from commercial anatomy applications are included.

- **Skeleton mesh:** BodyParts3D 4.0, © The Database Center for Life Science (DBCLS), licensed under **CC BY 4.0**. The web-ready GLB is loaded from the public `dev-christianmendes/anatomia_humana_3d` repository, whose license metadata records the conversion and attribution.
- **Muscle mesh:** Z-Anatomy — Models of Human Anatomy, licensed under **CC BY-SA 4.0**, derived in part from BodyParts3D. The web-ready GLB is loaded from the same public repository.
- **Renderer:** three.js, licensed under the **MIT License**. Browser modules are loaded from public ESM/CDN endpoints only when the detailed online viewer is opened.
- The app keeps its bundled local anatomy geometry as an offline fallback when the detailed online assets are unavailable.

The detailed meshes are educational reference models and are not intended for diagnosis, clinical measurement, or surgical planning.
