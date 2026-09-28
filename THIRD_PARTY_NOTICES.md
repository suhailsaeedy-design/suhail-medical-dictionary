# Third-party notices

Phase 7+ does not require a remote JavaScript SDK at runtime. Optional Supabase integration uses the public Supabase Auth and Data REST endpoints configured by the project owner.

Bootstrap remains locally bundled by the existing project and is subject to its upstream license.

## Detailed 3D anatomy viewer

The optional online detailed Anatomy viewer uses open-licensed anatomy assets and free/open-source rendering software. No proprietary assets from commercial anatomy applications are included.

- **Full human anatomy atlas:** BodyParts3D 4.0, © The Database Center for Life Science (DBCLS), licensed under **CC BY 4.0**. The viewer uses the open per-system atlas derived from BodyParts3D for skeletal, connective/joint, arterial, venous, nervous, respiratory, digestive, urinary, lymphatic, endocrine, reproductive, sensory and related layers.
- **Primary muscle mesh:** the high-detail muscular-system GLB exported from the **Z-Anatomy** `Startup.blend` model and served from the public `Liyucheng1997/242_lab-human-anatomy` repository. Z-Anatomy is licensed under **CC BY-SA 4.0** and attributes its underlying BodyParts3D content to The Database Center for Life Science under **CC BY-SA 2.1 Japan**.
- **Muscle web asset provenance:** the source repository includes the original Z-Anatomy `License.txt` and the Blender export scripts used to produce `public/models/muscular.glb`. The viewer applies only runtime materials/lighting and does not include proprietary assets from the referenced commercial anatomy application.
- **Other detailed anatomy layers:** the BodyParts3D-derived per-system atlas is loaded from the public `dev-christianmendes/anatomia_humana_3d` repository, whose metadata records its source licenses and conversion steps.
- **Renderer:** three.js, licensed under the **MIT License**. Browser modules are loaded from public ESM/CDN endpoints only when the detailed online viewer is opened.
- The app keeps its bundled local anatomy geometry as an offline fallback when the detailed online assets are unavailable.

The detailed models are educational reference models and are not intended for diagnosis, clinical measurement, treatment planning, or surgical planning.
