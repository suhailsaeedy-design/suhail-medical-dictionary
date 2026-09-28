# Third-party notices

Phase 7+ does not require a remote JavaScript SDK at runtime. Optional Supabase integration uses the public Supabase Auth and Data REST endpoints configured by the project owner.

Bootstrap remains locally bundled by the existing project and is subject to its upstream license.

## Detailed 3D anatomy viewer

The optional online detailed Anatomy viewer uses open-licensed anatomy assets and free/open-source rendering software. No proprietary assets from commercial anatomy applications are included.

- **Full human anatomy atlas:** BodyParts3D 4.0, © The Database Center for Life Science (DBCLS), licensed under **CC BY 4.0**. The viewer uses the open per-system atlas derived from BodyParts3D for skeletal, connective/joint, arterial, venous, nervous, respiratory, digestive, urinary, lymphatic, endocrine, reproductive, sensory and related layers.
- **Primary muscle mesh:** a web-optimized derivative of the BodyExplorer écorché model, itself assembled from **BodyParts3D** MRI-based meshes and supplemental **Z-Anatomy** meshes. The BodyParts3D source data is © The Database Center for Life Science under **CC BY-SA 2.1 Japan** for this derivative chain; Z-Anatomy is by Gauthier Kervyn under **CC BY-SA 4.0**.
- **Muscle web asset provenance:** BodyExplorer by Johan Bellander (MIT-licensed source code) performs the anatomical assembly/decimation; the compressed web asset used here is served from the public `yogawithagnesc/yoga-app` repository, whose `assets/anatomy3d/ATTRIBUTION.md` preserves the BodyParts3D and Z-Anatomy share-alike notices.
- **Other detailed anatomy layers:** the BodyParts3D-derived per-system atlas is loaded from the public `dev-christianmendes/anatomia_humana_3d` repository, whose metadata records its source licenses and conversion steps.
- **Renderer:** three.js, licensed under the **MIT License**. Browser modules are loaded from public ESM/CDN endpoints only when the detailed online viewer is opened.
- The app keeps its bundled local anatomy geometry as an offline fallback when the detailed online assets are unavailable.

The detailed models are educational reference models and are not intended for diagnosis, clinical measurement, treatment planning, or surgical planning.
