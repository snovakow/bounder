# Port plan: Bounder to React Three Fiber

This plan replaces Bounder's webpack prototype with a Vite + React + TypeScript app built on React Three Fiber (R3F) and the latest three.js, rendering with three's `WebGLRenderer`, as the prototype did. The end result looks as if the project had been created that way from the start. You run the terminal steps yourself. Each phase that changes code has a prompt to paste into a fresh Claude Code thread in this repository, and every phase ends with `/commit`.

The prompts send the agent back to this file, so it is the single source of truth: if you disagree with a default under **Decisions**, edit it here before running the phase that uses it.

Latest versions on 2026-10-30, when this was last checked: three.js r187 (`three@0.187.0`), `@react-three/fiber` 9.8, `@react-three/drei` 10.7, create-vite 9.3 with Vite 8.3, React 19.3, TypeScript 7.0, Oxlint 1.90, Node.js 24.22 LTS and npm 12.2. The whole stack was checked in a scratch copy of the template: installed at those versions, a WebGL scene in Appendix C's shape type-checks with TypeScript 7, passes Oxlint's type-aware rules with warnings failing, and builds with Vite. D14 covers keeping it all current.

## 1. Where it ends up

```
bounder/
├── .claude/skills/commit/      the /commit skill, a copy of the Claude-Skills baseline (section 5)
├── docs/r3f-port-plan.md       this plan, deleted in Phase 10
├── public/
│   ├── ammo/                   vendored Ammo.js build, loaded only when physics is on
│   └── models/                 collision-world.glb
├── src/
│   ├── main.tsx                React root, in StrictMode
│   ├── App.tsx                 the <Canvas> and the DOM overlays
│   ├── index.css               full-window layout and the editor panel
│   ├── features.ts             feature flags: ammoPhysics
│   ├── lib/                    framing.ts (link maths, bound types), collision.ts (wall outlines, unfinished)
│   ├── scene/                  Scene, SunAndSky, SkyEnvironment, SunLight, RendererSettings,
│   │                           Room, Balls, WalkControls, materials.ts, store.ts
│   ├── editor/                 store.ts, FramingEditor.tsx, EditorPanel.tsx
│   └── physics/                ammo.ts (loader), ammo.d.ts (typings), AmmoPhysics.tsx
├── index.html                  title, analytics (snovakow.com only), #root
├── vite.config.ts              base: '' for relative asset paths
├── .oxlintrc.json              lint rules (D1)
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── package.json, package-lock.json   with one npm override, so every package shares the same three (D14)
├── bounder.code-workspace
└── README.md                   for the public
```

Gone: `webpack.config.js`; the import map pointing at a local three.js checkout; `main.js`, which loaded the live site's shared `../lib/main.js`; the `?0.1.1` cache-buster; `include/`; and the eight legacy modules at the root.

Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`, `lint:fix`, `typecheck`.

The prototype stays readable at the `legacy-webpack` tag made in Phase 0, for example `git show legacy-webpack:app.js`.

## 2. Decisions

These are the defaults the prompts follow. Change a row before running the phase it affects.

| # | Topic | Default | Alternative |
| --- | --- | --- | --- |
| D1 | Linter (chosen in Phase 2, configured in Phase 3) | **Oxlint**, create-vite's default: its React and TypeScript rules plus type-aware rules, with warnings failing `npm run lint`. Its React rules include React Compiler-style checks, such as `react(immutability)`, which flag mutating what a hook returned; Appendix C's patterns satisfy them, so they stay on | **ESLint** (pick it at the prompt or pass `--eslint`): the flat config timspicks uses, plus `@react-three/eslint-plugin`'s two allocation-in-loop rules. Its react-hooks 7 preset includes React Compiler rules that can flag R3F's mutable style. |
| D2 | React Compiler | Off (the plain "TypeScript" variant) | `react-compiler-ts`: little to gain in a frame-loop app, and slower builds |
| D3 | Debug panel | **leva**, with the lil-gui panel's controls, ranges and defaults | Keep **lil-gui**, created in an effect and destroyed on unmount |
| D4 | State shared by the DOM panel and the scene | **zustand** | React context |
| D5 | Physics | Keep the vendored **Ammo.js** build behind `ammoPhysics` in `src/features.ts`, off as today | `@react-three/rapier`: a rewrite of the physics, not a port |
| D6 | Analytics and the site loader | Drop `main.js` and the shared `../lib/main.js` it loaded (see below). Put the gtag snippet from your other Vite projects in `index.html`, loading only on snovakow.com as before, and keep its startup log of the app's version | Load gtag on every host, as timspicks and homepage do |
| D7 | Framing editor | See below | |
| D8 | Sky | three's `Sky` addon (`three/addons/objects/Sky.js`), the prototype's own sky, which three has since given clouds. drei's `<Sky>` is an older copy from three-stdlib without them. It starts with clouds at three's defaults (coverage 0.4); cloud controls in the panel tune them, and a coverage of 0 gives the live demo's cloudless sky, since its older three.js has no clouds | Start cloudless (coverage 0) |
| D9 | Build output | `dist/` with `base: ''`, so the build works from the site's `bounder/` folder; deploy by replacing the contents of `~/Sites/localhost/live/bounder/` with `dist/` | `build.outDir` pointing straight at the live folder |
| D10 | Version | Versions continue where the prototype left off. Its page's cache-buster went from `0.0.3` to `0.1.1`, with commits named `0.0.0` to `0.1.1`, and the live site runs `0.1.1`. Phase 2 carries `0.1.1` into the template's `package.json`, and from then on only `/commit` changes it, each time with a version commit that becomes the next run's baseline (section 5). Phase 2's `/commit 0.1.2` makes the first; every run after it bumps the last number; Phase 10's `/commit 0.2.0` marks the port's first release, the one merged into `main` and deployed. Phase 0's run has no `package.json` to version, so it ends without one, and pushing closes it. The startup log carries on from the old loader's `App Version: 0.1.1` | Keep bumping the last number at the release too, as timspicks does |
| D11 | The prototype's defects | Fix them as Appendix B says; strict TypeScript rejects most of them anyway | Port them as they are |
| D12 | This plan | Deleted in Phase 10, before the merge to `main`; git history keeps it | Keep it under `docs/` |
| D13 | Renderer (confirmed) | R3F's default **`WebGLRenderer`**, antialiased, as the prototype used. GLSL shaders, drei's WebGL helpers such as `<Environment>`, which renders the sky into the environment cube (Phase 5), and `@react-three/postprocessing` all stay available (Appendix C) | three's `WebGPURenderer` (`three/webgpu`) through an async `gl` factory: only node materials run under it, so the sky and its environment cube have to be built by hand, and drei's GLSL helpers and postprocessing are out |
| D14 | Versions | **Latest of everything** at install time, and again whenever `/commit` reports something behind (`npm outdated`). TypeScript moves from the template's 6.0 pin to 7.0. One npm override, `"three": "$three"`, makes drei's `stats-gl` share the app's three instead of bundling its own `0.170`. Deliberate holds: Node.js 24 LTS, because Node 26 won't start on this Mac's macOS 12.7 (it needs 13.5); `@types/node` 24 to match it; and React within R3F's peer range (19.0 to 19.3, which is also the latest today) | Keep the template's pins |

**D6: what the shared loader did.** `../lib/main.js` belongs to the old web root, `~/Sites/localhost/dev/lib/main.js` (the deprecated `snovakow/web` repository, with this repository as a submodule), and the live build bundles it (webpack chunk `eba323d8bfc239382c69.js`). Its `initialize()` did four things: logged `App Version: 0.1.1`, read from the `main.js?0.1.1` query string; inserted the gtag script and its `dataLayer` setup at the top of `<head>` when given an ID, which `main.js` passed only on snovakow.com; added stylesheet links when given any, which Bounder never was; and resolved once the DOM had loaded. The port keeps the first two. Module scripts already run after the DOM loads.

**D7: the framing editor (confirmed).** The last commit, "Initial type setup", started splitting bounds into floors, walls and tracks, but left the editor broken. It still refers to the removed `floorArea`, so every shift-click throws, and a click on the room would start a new one-point bound each time. The live demo was built before that commit, so its editor still works. The port restores that working behaviour inside the new model:

- A bound is a chain of points with a type: floor, wall or track. The links between consecutive points are derived from the points, not stored.
- Shift-press on the room adds a point to the active bound, linked to its last point, and starts dragging it. If there's no active bound, or the panel's type differs from the active bound's, it starts a new bound of the panel's type instead.
- Shift-press on a point makes its bound active and drags the point. Shift-press on a link makes its bound active, inserts a point there and drags it.
- The Loop checkbox is kept in the store but does nothing yet, as now.

## 3. How to run a phase

1. Read the phase, and do its **You** steps: git steps in GitHub Desktop, and the rest in a terminal at the repository root.
2. Open a fresh Claude Code thread in this repository and paste the phase's **Prompt**. The agent reads this file, does that phase only, runs the checks, and summarises without committing.
3. Do the phase's **Check** yourself and ask for fixes in the same thread.
4. Open another fresh thread and run `/commit` with a note naming the phase, such as `/commit Phase 5 of docs/r3f-port-plan.md`. It has to be the thread's first message: the skill stops otherwise, because a thread that wrote the code can't review it from the repository alone. The note lets it read the phase for intent. It fixes what it can in commits that aren't pushed yet, such as a vague message, and asks before committing over a failing check or anything else it can't settle.
5. Start the next phase in a new thread.

If a phase goes badly, GitHub Desktop's Changes tab shows what it touched. **Branch → Discard All Changes…** puts the changed files back and moves the new ones to the Trash. Check the list first: it also discards anything else that isn't committed, such as Phase 1's moves while Phase 2 is under way. Then run the prompt again.

## 4. Phases

### Before Phase 0: bring the tools up to date

**You**

1. **Node.js 24.22.0**, the latest LTS. Install it with the macOS installer (the x64 `.pkg`) from nodejs.org, which replaces v24.14.0 in `/usr/local/bin`. Node 26 is newer, but it fails to start on this Mac's macOS 12.7.6 (`dyld: Symbol not found` in `libc++`); its builds need macOS 13.5 or later. Node 24 stays supported until April 2028, and upgrading macOS is what would unlock Node 26.
2. **npm 12**, which needs Node 24.15 or later, so it comes after Node. The installer's global folder belongs to root, hence `sudo`:

   ```sh
   sudo npm install -g npm@latest
   node -v && npm -v    # v24.22.0 and 12.x
   ```

   `sudo npm` can leave root-owned files in your npm cache, and then later installs fail with `EACCES` under `~/.npm/_cacache`. Hand the cache back to yourself:

   ```sh
   sudo chown -R "$(id -un)":staff ~/.npm
   ```

3. **git**, optionally. Apple's 2.37.1 is the newest its command-line tools offer on macOS 12, and the current release is 2.56. Homebrew supports macOS 12 only at its lowest tier, building from source, and MacPorts is the other route. The `/commit` skill works with 2.37 either way.

### Phase 0: commit this plan and the skill, tag the prototype, and push

**You**

1. In a fresh Claude Code thread here, run `/commit Plan and tooling for the React Three Fiber port`. Expect separate commits for the `/commit` skill, the public README, this plan and `bounder.code-workspace` (your other repositories track theirs). There's no version commit yet, because there's no `package.json` until Phase 2 (D10).
2. Tag the result, so the prompts can still read the prototype and this plan after their files are deleted. In GitHub Desktop's History tab, right-click the newest commit, the run's last, choose **Create Tag…**, and name it `legacy-webpack`. Desktop pushes the tags it creates with the next push, so it goes to GitHub with the branch.
3. Push `development`, which puts it on GitHub for the first time: click **Publish branch**.

   Until the first version commit, a run's baseline is the newest pushed commit, so pushing is what closes this run. Without the push, Phase 2's run would ask about these commits before reading them; answering that it should keep them all, as already reviewed, does the same.

### Phase 1: remove webpack and move the assets

**You**

GitHub Desktop's Changes tab should show no changes. Then, in a terminal:

```sh
mkdir -p public/models public/ammo
mv include/models/gltf/collision-world.glb public/models/
mv include/ammo.wasm.js include/ammo.wasm.wasm public/ammo/
rmdir include/models/gltf include/models include    # fails if anything is left
rm webpack.config.js main.js index.html app.js environment.js framing.js collision.js ui.js util.js
```

The Changes tab now shows the nine prototype files deleted and the three assets moved from `include/` to `public/`. Don't commit yet; Phase 2's `/commit` commits both phases together.

### Phase 2: scaffold Vite in place and install the 3D stack

**You**

1. Scaffold into this folder:

   ```sh
   npm create vite@latest . -- --template react-ts
   ```

   Answer its prompts like this:
   - *Current directory is not empty*: **Ignore files and continue**. Not "Remove existing files", which deletes everything except `.git`, including `.claude/`, `docs/` and the moved assets. Since everything but the moves is committed, **Discard All Changes** in GitHub Desktop would bring it back, with the assets in `include/` again for Phase 1 to redo, but don't.
   - *Which linter to use?*: **Oxlint** (D1).
   - *Install with npm and start now?*: **No**.

   It writes the template's files into the folder, overwriting `README.md` and `.gitignore`. Keep its `.gitignore`, which already covers `.DS_Store`, and bring back the public README: in GitHub Desktop's Changes tab, right-click `README.md` and choose **Discard Changes…**.

2. Install everything at its latest version (D14): the template's own packages, which create-vite pins a little behind and TypeScript a major behind, and the 3D stack. Then add the override that makes every package share the app's three, replace the template's `0.0.0` with the prototype's last version, `0.1.1` (D10), and install once more:

   ```sh
   npm install
   npm install react@latest react-dom@latest three@latest @react-three/fiber@latest @react-three/drei@latest leva@latest zustand@latest
   npm install --save-dev vite@latest @vitejs/plugin-react@latest typescript@latest oxlint@latest @types/react@latest @types/react-dom@latest @types/three@latest @types/node@24
   npm pkg set 'overrides.three=$three' version=0.1.1
   npm install
   ```

   Leave out `leva` or `zustand` if you changed D3 or D4. npm 12 runs no install scripts that haven't been approved, so it warns that `fsevents`' was skipped. That's harmless: it's an optional macOS file watcher, and the dev server, lint and build work without it.

3. Check that there is one three.js, with types from the same release, and that nothing is behind:

   ```sh
   npm ls three @types/three
   npm outdated
   ```

   Expect `three@0.187.x` (or newer) everywhere, deduped under fiber, drei, three-stdlib and stats-gl, and `@types/three` at the same minor version. `npm outdated` should list only `@types/node`, held at 24 to match Node (D14). If npm reports a React peer conflict, it's because R3F 9 accepts React 19.0 to 19.3, so a newer React has come out: run `npm install react@~19.3 react-dom@~19.3`, and hold it there until R3F catches up.

4. Check the untouched template: run `npm run dev` and open the URL it prints (stop it with Ctrl+C), then `npm run lint` and `npm run build`. Lint may print warnings from the vendored Ammo build in `public/ammo/`; they don't fail the run, and Phase 3 excludes that folder.
5. In a fresh thread, run `/commit 0.1.2 Phases 1 and 2 of docs/r3f-port-plan.md`. Expect separate commits for removing the webpack prototype, moving the assets into `public/`, and the scaffold with its dependencies, then `Version 0.1.2`, the first version commit (D10). From here on, every run ends with one.

### Phase 3: app shell and tooling

**Prompt**

```text
Read docs/r3f-port-plan.md: sections 1 and 2, Phase 3, and Appendix C. Carry out Phase 3 only: turn the fresh create-vite scaffold into Bounder's app shell and tooling. The prototype's code is at the legacy-webpack tag (git show legacy-webpack:<file>). If the plan turns out to be wrong or impossible somewhere, stop and tell me instead of improvising. Don't commit. Finish with npm run lint, npm run typecheck and npm run build passing, then summarise what changed and anything you couldn't do.
```

**The work**

1. Remove the template's demo: `src/App.css`, `src/assets/`, `public/icons.svg`, and `public/favicon.svg` with its `<link>`. `src/App.tsx` renders a full-window `<Canvas>` with nothing in it yet.
2. `index.html`: `lang="en"`, the title "Bounder", a one-line meta description, and Google's standard gtag snippet (the async `gtag.js` script plus the `dataLayer` setup, as in `../timspicks/index.html`) with the measurement ID from Appendix A. Wrap it so it runs, and adds the script tag itself, only when `location.host` is `snovakow.com` (D6). Keep `#root` and the module script.
3. `src/index.css`: only what the app needs. `html`, `body` and `#root` fill the window, with no margin and no scrollbars.
4. `vite.config.ts`: `base: ''` (D9), with a one-line comment saying why. Define `__APP_VERSION__` from `package.json`'s version, as `../timspicks/vite.config.ts` does, declare it for TypeScript, and have `src/main.tsx` log `App Version: <version>` at startup with `console.info`, as the old loader did (D6). three, R3F and drei make one chunk of about 1.4 MB, so raise `build.chunkSizeWarningLimit` to cover it rather than splitting chunks; it's one scene.
5. `package.json`: add `"typecheck": "tsc -b"` and `"lint:fix": "oxlint --fix"` to the template's scripts. Leave the version alone; only `/commit` changes it (D10).
6. `.oxlintrc.json` (D1): keep the template's plugins and rules, and:
   - ignore `public/**`, the vendored Ammo build
   - make the `correctness` category errors, and add `suspicious` as warnings
   - turn off `react/react-in-jsx-scope`, which `suspicious` brings in and React's automatic JSX runtime makes obsolete; with warnings failing, it would fail every `.tsx` file
   - make warnings fail the run (`options.denyWarnings`)
   - turn on type-aware rules: `npm install --save-dev oxlint-tsgolint@latest`, then `options.typeAware`. This was checked with TypeScript 7; if it fails anyway, stop and say why.
   - leave the React Compiler-style rules, such as `react(immutability)`, on, and write code that satisfies them (Appendix C, item 9)

   With ESLint instead, get the same in `eslint.config.js`: `globalIgnores(['dist', 'public'])`, `tseslint.configs.recommendedTypeChecked` with `parserOptions.projectService`, `@react-three/eslint-plugin`'s `no-clone-in-loop` and `no-new-in-loop` as errors, and `eslint . --max-warnings 0`.
7. `src/features.ts`: `export const ammoPhysics = false;`, with a comment saying what it switches (D5).
8. `bounder.code-workspace`: `files.exclude` for `**/node_modules` and `**/dist`, as your other workspaces have.
9. `README.md`: a fresh clone now runs. Update "Running it locally" to say how (Node.js 20.19 or later, `npm install`, `npm run dev`), and keep saying that the rebuild is in progress. Keep its public voice.

**Check** `npm run dev` shows an empty page with no console errors, and the elements panel shows a `<canvas>` filling the window.

### Phase 4: port the geometry helpers

**Prompt**

```text
Read docs/r3f-port-plan.md: section 2, Phase 4 and Appendix B. Carry out Phase 4 only: port the prototype's plain modules to TypeScript under src/lib. The prototype's code is at the legacy-webpack tag (git show legacy-webpack:<file>). If the plan turns out to be wrong or impossible somewhere, stop and tell me instead of improvising. Don't commit. Finish with npm run lint and npm run build passing, then summarise, listing each Appendix B item you resolved and how.
```

**The work**

- `util.js` needs no module. Its constants are three's `MathUtils.DEG2RAD` and `MathUtils.RAD2DEG`, and `isRightMouse` becomes a check of the pointer event's `button` in the editor.
- `framing.js` becomes `src/lib/framing.ts`: the bound types (`'floor' | 'wall' | 'track'`, with the panel's labels), and `placeLink`'s maths as a pure function. A link between two points sits at their midpoint, is rotated from +Y onto the direction between them, and is scaled along y to their distance. `FrameArray` isn't ported: Phase 7's store keeps each bound as a list of points and derives its links, which retires B5 and B7.
- `collision.js` becomes `src/lib/collision.ts`, typed, with B6's fixes. `generatePath` was never finished: keep it as a method that throws "not implemented", with a TODO. Drop `VectorArray` and `Vector2Array`, which nothing uses and `noUnusedLocals` would reject. Nothing imports this module yet, as before.
- Strict types and no `any`.

**Check** Nothing visible changes. Read the diff against the prototype for faithfulness.

### Phase 5: canvas, sky, sun and debug panel

**Prompt**

```text
Read docs/r3f-port-plan.md: section 2, Phase 5 and Appendices A, B and C. Carry out Phase 5 only: port environment.js, and the debug panel from app.js, to React Three Fiber. The prototype's code is at the legacy-webpack tag (git show legacy-webpack:<file>). Match Appendix A's values exactly. If the plan turns out to be wrong or impossible somewhere, stop and tell me instead of improvising. Don't commit. Finish with npm run lint and npm run build passing, then summarise, listing anything that doesn't match Appendix A and what I should look at in the browser.
```

**The work**

- `App.tsx`: the `<Canvas>`, with static props (Appendix C, items 1 to 4):
  - no `gl` prop: R3F's default `WebGLRenderer` is already antialiased (D13)
  - camera: fov 90, near 0.3, far 1000, at (0, 10, 0)
  - `shadows="percentage"`, which is PCF
  - a `dpr` that allows the full device pixel ratio, as before
- `src/scene/Scene.tsx` composes the scene: `<SunAndSky>`, drei's `<OrbitControls makeDefault enableDamping={false} />` (three's defaults, as before; B11), `<RendererSettings>`, and drei's `<Stats />`.
- `SunAndSky` owns the sun angles (the panel's phi and theta) and computes the sun position (Appendix A), then renders `<SkyEnvironment>` and `<SunLight>` with it.
- `SkyEnvironment` (D8): renders three's `Sky` addon (`three/addons/objects/Sky.js`) into a cube map with drei's `<Environment background>` (items 5 to 7). It takes the sun position, the panel's turbidity, rayleigh, mieCoefficient and mieDirectionalG, and the new cloudCoverage, cloudDensity and cloudElevation at three's defaults (0.4, 0.4 and 0.5). The cube map is the background and every standard material's environment, as the prototype's CubeCamera texture was. Write it with item 9's patterns, which keep the lint rules satisfied.
- `SunLight`: the directional light and its shadow (Appendix A), with the panel's light and shadow controls.
- `RendererSettings`, inside the Canvas: tone mapping (Neutral to start), exposure and shadow type from the panel, applied to the renderer (items 3 and 4; B4). The shadow types are Basic, PCF and VSM.
- Reach the renderer through `get()` (item 9).
- leva folders: Sun, Sky, Light and shadows, Renderer. Include every control in Appendix A's panel table, with the same ranges and defaults.

**Check** The sky looks like the live demo's plus clouds, and a cloud coverage of 0 gives the live demo's cloudless sky. Sun phi and theta move the sun; the sky sliders change the sky; tone mapping and shadow type switch with no console warnings; Stats shows in a corner. Shadows and reflections can't be judged until Phase 6 adds something to show them.

### Phase 6: room, balls and walking

**Prompt**

```text
Read docs/r3f-port-plan.md: section 2, Phase 6 and Appendices A, B and C. Carry out Phase 6 only: port the room, the balls, the camera placement and WASD walking from app.js. The prototype's code is at the legacy-webpack tag (git show legacy-webpack:<file>). If the plan turns out to be wrong or impossible somewhere, stop and tell me instead of improvising. Don't commit. Finish with npm run lint and npm run build passing, then summarise, listing anything that doesn't match Appendix A and what I should look at in the browser.
```

**The work**

- `src/scene/materials.ts`: the shared blue `MeshStandardMaterial`, used by the balls now and the editor's points and links later.
- `Room`: load `models/collision-world.glb` with drei's `useGLTF`, prefixed with `import.meta.env.BASE_URL` (Appendix C, item 10), under `<Suspense>`. Take its one mesh, bake its world transform into a cloned geometry, never the cached one (item 8), and render it with the model's material set up as Appendix A says, taking the texture's anisotropy from `gl.capabilities.getMaxAnisotropy()`, as the prototype did (item 2). Keep the baked mesh in a small zustand store, `src/scene/store.ts`, so walking, the editor and physics can reach it.
- Once the room is in, place the camera as Appendix A says: a raycast down from (0, 10, 0), eye height 1.6, orbit target (0, 0, −1).
- `Balls`: the instanced spheres, laid out by Appendix A's formula, unchanged, including its fractional modulo. Hold their positions in a ref for Phase 8 (items 12 and 13).
- `WalkControls`: WASD as Appendix A says. Ignore keys until the room is in (B8).

**Check** The room appears with its blue grid and the sun's shadows. The view starts at eye height, looking slightly down. The balls hang above the room in a slanted grid and cast shadows on it. WASD steps you around and follows the floor; orbiting still works.

### Phase 7: framing editor and panel

**Prompt**

```text
Read docs/r3f-port-plan.md: section 2 (especially D7), Phase 7 and Appendices A, B and C. Carry out Phase 7 only: port the framing editor from app.js and framing.js, and the panel from ui.js. The prototype's code is at the legacy-webpack tag (git show legacy-webpack:<file>). If the plan turns out to be wrong or impossible somewhere, stop and tell me instead of improvising. Don't commit. Finish with npm run lint and npm run build passing, then summarise, including how each Appendix B item for the editor was resolved and what I should try in the browser.
```

**The work**

- `src/editor/store.ts` (zustand, D4): the panel's type (Floor to start) and Loop flag, the bounds (id, type, points), the active bound, and the point being dragged, with actions for D7's operations (B1, B2, B12).
- `FramingEditor`: each bound's points and links as Appendix A describes them, in the shared material, receiving shadows (points don't cast them), with the links placed by `src/lib/framing.ts`.
- Pointer handling with R3F's events (Appendix C, item 11; B10):
  - Shift plus the primary button only; everything else goes to the orbit controls.
  - `stopPropagation`, so only the nearest point, link or room surface reacts.
  - Disable the orbit controls (`useThree((s) => s.controls)`) while dragging, and re-enable them on `pointerup` anywhere in the window.
  - A dragged point follows the room under the pointer, through the room's `onPointerMove`.
- `EditorPanel`, a DOM component outside the Canvas: bottom-right, white, 8px padding, a column with the type select (Floor, Wall, Track) and the Loop checkbox, bound to the store and drawn above the canvas.

**Check**

- Shift-click the room for a point; shift-click again for a second point joined by a link.
- Shift-drag a point: it slides over the room and its links follow.
- Shift-click a link, including a middle one (B5): a point is inserted and the links on both sides line up.
- Switch the panel to Wall and shift-click the room: a new chain starts.
- Without Shift, the mouse orbits as before.

### Phase 8: Ammo physics behind its flag

**Prompt**

```text
Read docs/r3f-port-plan.md: section 2 (D5), Phase 8 and Appendices A, B and C. Carry out Phase 8 only: port the Ammo.js physics from app.js, behind the ammoPhysics flag. The prototype's code is at the legacy-webpack tag (git show legacy-webpack:<file>). Leave the flag false when you finish. If the plan turns out to be wrong or impossible somewhere, stop and tell me instead of improvising. Don't commit. Finish with npm run lint and npm run build passing, then summarise, including how I can test it with the flag on.
```

**The work**

- `src/physics/ammo.ts`: load `ammo/ammo.wasm.js`, prefixed with `import.meta.env.BASE_URL`, with a script tag, once. Then await `Ammo()` and use the module it resolves to (Appendix C, item 15).
- `src/physics/ammo.d.ts`: declarations for only the Ammo API in use: the world's parts (default collision configuration, collision dispatcher, DBVT broadphase, sequential impulse solver, discrete dynamics world), `btVector3`, `btTransform`, `btQuaternion`, the sphere and BVH triangle mesh shapes, `btTriangleMesh`, `btDefaultMotionState`, `btRigidBodyConstructionInfo`, `btRigidBody`, and `destroy`.
- `AmmoPhysics`, mounted only when `ammoPhysics` is true: the world, the ball bodies and the room body as Appendix A says, with the room built from the baked geometry's own index (B3). Step in `useFrame` with R3F's delta (seconds) and 10 substeps, and copy each body's origin into its ball instance (item 13). Free everything with `Ammo.destroy` on unmount, since StrictMode mounts twice in development.
- Drop the unused debug plane (B9). With the flag off, nothing requests Ammo.

**Check** Set `ammoPhysics` to true locally: the balls fall, bounce and settle on the room, and Stats shows the frame rate holding. Set it back to false, and the Network panel shows no request for `ammo.wasm.js`.

### Phase 9: parity review and README

**Prompt**

```text
Read docs/r3f-port-plan.md in full. Carry out Phase 9 only: review the finished port against Appendices A, B and C and the prototype at the legacy-webpack tag (git show legacy-webpack:<file>), fix differences that aren't intended, remove leftovers, and bring README.md up to date for the public. Don't commit. Finish with npm run lint, npm run typecheck and npm run build passing; then serve the build with npm run preview and confirm that the page and every asset it references load with HTTP 200 (curl is fine). Summarise what you fixed, what still differs from Appendix A and why, and give me a checklist to walk through in the browser.
```

**The work**

- Go through Appendix A line by line against the code. Fix what differs unintentionally, and list the deliberate differences, such as D3, D8, PCFSoft's removal, the half-float environment cube and the Appendix B fixes.
- Remove leftovers: template files or text (the Vite and React logos, "Vite + React", `App.css`), dependencies nothing imports (compare `npm ls --depth=0` with the imports), `any` or lint suppressions without a stated reason, and `console.log`.
- README.md, for a public reader. Keep the stack line, the Stack table and the Workflow section, and bring the rest up to date: what Bounder is, the live demo, what's in it, the controls including the debug panel, running it (Node.js 20.19 or later, `npm install`, `npm run dev`), building it (`npm run build` makes a static site in `dist/` that works from any folder), its status (the rebuild is done, and the live demo follows once it's deployed), and credits. No file paths or internal values; keep the existing voice. Keep the link to this plan for now; Phase 10 removes it.

**You** Walk the agent's checklist in `npm run dev` and again in `npm run preview`. Then, in a fresh thread, run `/commit Phase 9 of docs/r3f-port-plan.md`.

### Phase 10: merge and deploy

**You**

1. Delete this plan. Read the rest of this phase first; afterwards it is only in git history, for example `git show legacy-webpack:docs/r3f-port-plan.md`.

   ```sh
   rm docs/r3f-port-plan.md
   ```

   Then, in a fresh thread, run `/commit 0.2.0 Remove the port plan now that the port is done`. The scan lists the plan among the deleted files, and the run drops the README's link to it in the same batch. Its last commit is `Version 0.2.0`, the port's first release (D10).
2. Merge and push, in GitHub Desktop:
   1. With `development` checked out, choose **Branch → Merge into Current Branch…** and pick `main`. It should say `development` is already up to date with it, meaning `main` has no commits that `development` lacks; close the dialog. If it finds commits instead, merge them, run `/commit` if the merge needs fixes, and start this step again.
   2. Switch **Current Branch** to `main`, choose **Branch → Merge into Current Branch…**, and merge `development`. Since `main` has nothing of its own, this fast-forwards, with no merge commit.
   3. Click **Push origin**, then switch back to `development`.
3. Build and deploy:

   ```sh
   npm ci
   npm run build
   ```

   Replace the contents of `~/Sites/localhost/live/bounder/` with those of `dist/`, then publish `live/` to snovakow.com the way you do for the other sites. The webpack files there (`main.js`, its hashed chunks and their licence file, `include/`) aren't used any more. `pack.sh` in the old web root rebuilds this folder from the webpack prototype, so don't run it for bounder again.
4. Open https://snovakow.com/bounder/ and check that the scene loads with no 404s, and that the Network panel shows gtag.
5. Optionally, delete the tag once you no longer need it. GitHub Desktop deletes only tags that haven't been pushed, and this one went to GitHub in Phase 0, so it takes the command line:

   ```sh
   git tag -d legacy-webpack
   git push origin --delete legacy-webpack
   ```

## 5. The /commit skill

`.claude/skills/commit/` holds `/commit`, the final review before work enters the repository's history. It's a project copy of the generic skill in [Claude-Skills](https://github.com/snovakow/Claude-Skills/tree/main/skills/commit). Its steps, and its scan below the scan's settings, are the baseline's word for word, and its frontmatter adds only a grant for `npm outdated`. What's Bounder's own is the two settings blocks, one at the top of `SKILL.md` and its twin at the top of `scripts/scan.mjs`, and a short "Rules of this repository" section. `metadata.baseline` in the frontmatter dates the baseline it came from, and "Keeping a copy current" in the baseline's README has the diffs that compare a copy with it and the way to bring one up to date.

It runs only when you type it, on Opus at max effort, and only as the first message of a fresh thread. `/commit [x.y.z] [notes]`:

- **Surveys** with `git fetch` and a read-only scan, and stops to ask about:
  - a merge, rebase or similar in progress, or a detached HEAD
  - being on `main`, or behind the upstream
  - a version changed by hand
  - credentials or session data in added lines
  - a file that looks like it shouldn't be tracked, or a large one. Among these are `node_modules`, `dist`, `.env` files, personal Claude settings, keys, and the webpack config or `include/` coming back.
  - before the first version commit, commits above the newest pushed commit, which it asks about before reading any
- **Reviews** every commit since the baseline, the working-tree diff and every untracked file, in full. It checks messages against diffs, comments against code, references a public reader can't follow, and leftovers. Bounder's rules add a code review: correctness, React and R3F lifecycle, allocation in the frame loop, type and lint escapes, new dependencies, and the `ammoPhysics` flag left on.
- **Runs the checks**, `npm run lint`, `npm run typecheck` and `npm run build`, and asks before committing over a failure. Then it runs `npm outdated` and lists what has fallen behind, apart from D14's holds. It never installs or upgrades anything.
- **Fixes what it can** in unpushed commits after the baseline, such as a vague or file-name subject. It amends the tip, or folds `fixup!` and `amend!` commits in with one autosquash rebase and checks that the fold changed no files. Pushed commits are reported, never rewritten.
- **Commits** the batch, planned first: one concern per commit, the file as the unit, explicit paths, and an order in which each commit stands on its own. Subjects are imperative and at most 72 characters. Bodies say why and what was verified, and end with the thread's co-author trailer.
- **Keeps README.md true** for the public. This plan is yours: it commits the plan but never edits it, and says when a change makes it inaccurate.
- **Ends with a version commit** once they've started (D10). Its message is `Version X.Y.Z` alone, by snovakow, with no trailer, and it touches only `package.json` and `package-lock.json`. It's the next run's baseline, and since it's in the history it holds in every clone. Before the first one, a run ends without a version commit, and pushing is what closes it.
- **Reports** what it flagged, each commit, what it left out and why, the checks and their results, and whether the live site needs a rebuild after the merge. It also gives the undo point, `git reset --soft <start>`. It never pushes, never changes branches, and never discards your work.

After the report, more work in the same thread is ordinary development. Once a run has ended with a version commit, that work can be committed as usual, and the next run reviews it. Before then it stays uncommitted, because nothing would tell it apart from the run's own commits.

## Appendix A: behaviour reference

What the prototype does, for the port to match. D8 and the Appendix B fixes are the intended differences.

**Renderer and camera**

- Perspective camera: fov 90, near 0.3, far 1000. It starts at (0, 10, 0), then moves to 1.6 above the room surface below it, with the orbit target at (0, 0, −1).
- Renderer: a `WebGLRenderer`, antialiased; the pixel ratio follows `window.devicePixelRatio`; Neutral tone mapping at exposure 1; shadows on, with three's default type, PCF.
- The canvas fills the window, with three's Stats FPS meter in the top-left corner.
- OrbitControls with three's defaults: no damping; left drag rotates, scroll zooms, right drag pans.

**Sun and sky**

- Sun angles, in degrees: phi 45 (polar, from +Y) and theta 90 (azimuth). The sun position is `Vector3.setFromSphericalCoords(30, phi, theta)` with the angles in radians, which is (21.2, 21.2, 0) at the defaults.
- Sky: three's `Sky` addon, scaled to 30, with that sun position, turbidity 10, rayleigh 0.5, mieCoefficient 0.005 and mieDirectionalG 0.8.
- The sky, in a scene of its own, is rendered into a 2048 float cube render target by a CubeCamera (near 0.3, far 1000). That texture is the scene background, and the env map of the blue material and of the room's material. It's rendered again whenever the sun angles or a sky slider change.
- Light: directional, white, intensity 1, at the sun position, aimed at the origin, casting shadows. Its orthographic shadow camera spans ±30 (left, right, top, bottom), near 1, far 45; bias −0.0001, normalBias 0.1, radius 5, blurSamples 5, map 4096 × 4096.

**Debug panel** (lil-gui, flat, in this order)

| Label | Drives | Range | Default |
| --- | --- | --- | --- |
| shadow radius | light's shadow radius | 0 to 10 | 5 |
| shadow normalBias | light's shadow normal bias | 0 to 0.2 | 0.1 |
| Sun phi | sun's polar angle, degrees | −90 to 90 | 45 |
| Sun theta | sun's azimuth, degrees | −180 to 180 | 90 |
| turbidity | sky | 0 to 20 | 10 |
| rayleigh | sky | 0 to 4 | 0.5 |
| mieCoefficient | sky | 0 to 0.1 | 0.005 |
| mieDirectionalG | sky | 0 to 1 | 0.8 |
| intensity | light's intensity | 0 to 1 | 1 |
| bias | light's shadow bias | −0.001 to 0 | −0.0001 |
| toneMappingExposure | renderer | 0 to 1 | 1 |
| shadowMap | renderer's shadow type | Basic, PCF, PCFSoft, VSM | PCF |
| blurSamples | light's shadow blur samples | 1 to 30, step 1 | 5 |
| toneMapping | renderer | No, Linear, Reinhard, Cineon, ACESFilmic, AgX, Neutral | Neutral |

The port drops PCFSoft, which three r186 removed, and adds cloudCoverage, cloudDensity and cloudElevation, each 0 to 1, at three's defaults of 0.4, 0.4 and 0.5; the live demo has no clouds (D8).

**Room**

- `collision-world.glb`, a Blender export: one mesh, under a node scaled by 0.5 and offset by (7.68, −5.59, 26.38). It's indexed (16-bit, 5,262 indices), with one double-sided PBR material (metalness 0, roughness 1) carrying a blue grid texture.
- Its world transform is baked into the geometry, leaving an identity transform, and its bounds are recomputed. The physics trimesh and the raycasts rely on world-space vertices.
- The texture's anisotropy is the renderer's maximum; envMapIntensity 0.3; it casts and receives shadows.
- It's the editor's base surface.

**Balls**

- 1000 instances of a sphere of radius 0.3 with 24 × 12 segments, in the shared blue (#0000ff) MeshStandardMaterial, casting and receiving shadows, with dynamic draw usage.
- Layout, with s = √1000: x = (i mod s) − s/2, z = ⌊i / s⌋ − s/2, y = 17 + random × 10. The modulo is fractional, so the rows drift into a slanted grid; keep it.
- They stay still unless physics is on.

**Walking**

On keydown of W, S, A or D (by `event.code`), the camera moves one unit forward, back, left or right in its own frame, keeping its height. If the room is below it, its height becomes 1.6 above the surface. Then the orbit target becomes the camera position plus the horizontal part of its view direction, which levels the view.

**Framing editor**

- Point: a sphere of radius 0.1 with 18 × 9 segments, in the blue material, receiving shadows but not casting them.
- Link: an open-ended cylinder of radius 0.05 and height 1 with 9 radial segments, in the blue material, receiving shadows. It's placed between its two points: at their midpoint, rotated from +Y onto the direction between them, scaled along y to their distance.
- Only Shift with the primary button edits; anything else goes to the orbit controls. D7 says what each shift-press does. While dragging, orbiting is off and the point follows the room under the pointer; releasing anywhere ends the drag.
- Panel: bottom-right, with a white background and 8px padding, a column holding a select (Floor, Wall, Track) and a "Loop" checkbox.

**Physics** (off)

- Ammo.js, a WebAssembly build of Bullet, loaded by a script tag only when enabled.
- World: default collision configuration, collision dispatcher, DBVT broadphase and sequential impulse solver, with gravity (0, −6, 0).
- Balls: sphere shapes of radius 0.3 with margin 0 and mass 0.09 (the radius squared), starting at their layout positions.
- Room: a static (mass 0) BVH triangle mesh shape built from the baked room geometry, without quantized AABB compression, margin 0.
- Each frame: step by the frame time in seconds, with up to 10 substeps, then copy each body's origin into its instance. Rotation isn't copied.

**Collision module** (not wired in): 2D intersection helpers (segment and segment, segment and circle, circle and circle) and a draft of wall outlines built from circles around wall points, clipped where they overlap. Nothing imports it.

**Startup and analytics** (from the shared loader, D6): logs `App Version: 0.1.1` to the console, and loads gtag with measurement ID G-DV1KLMY93N, inserted at the top of `<head>`, only when `location.host` is exactly `snovakow.com`.

## Appendix B: defects in the prototype

| # | Where | Defect | In the port |
| --- | --- | --- | --- |
| B1 | `app.js`, `addPoint` and `moveFramingNode` | `floorArea` was removed in "Initial type setup" but is still used, so every shift-click on the room, a point or a link throws | D7's store |
| B2 | `app.js`, `addPoint` | A bare `new Framing.FrameArray()` statement does nothing | Dropped |
| B3 | `app.js`, `meshAdd` (physics) | Reads `geometry.index`, which resolves to the balls' sphere geometry, so the room's trimesh is built from the wrong indices | Use the room geometry's own index |
| B4 | `app.js`, shadow type control | Assigns `.onChange = …` instead of calling `.onChange(…)`, so the handler never runs | Apply the type from inside the Canvas; three recompiles the materials itself (Appendix C, item 4) |
| B5 | `framing.js` | `isNode` and `isLink` read an undefined `index`, and the navigation methods test `this.isNode`, which is always truthy, instead of calling it. Inserting into any link but the last attaches the new link to the wrong node | `FrameArray` retired; links derive from the order of the points |
| B6 | `collision.js` | `removeOverlaps` reassigns a `const`, which throws. `processWalls` passes undefined `angle1`, `angleOff1`, `angle2` and `angleOff2` (fields of the `circleCircle` result) and sorts clips by fields they don't have (`angle`, `angleOff`; clips have `startAngle`). `generatePath` uses many undefined names | Fix the first two, sort by `startAngle`, and stub `generatePath` |
| B7 | `framing.js` | The constructor ignores its `type` argument, and freezing the string statics does nothing | Retired with `FrameArray` |
| B8 | `app.js`, `keydown` | Raycasts against `room` before the model has loaded, which throws | Ignore keys until the room is in |
| B9 | `app.js`, physics branch | Builds a debug plane that's never added to the scene | Dropped |
| B10 | `app.js`, `collisionDetect` | Allocates a raycaster per mouse event and intersects every scene child, including the 1000 instances | R3F's event system |
| B11 | `environment.js` | `controls.update(deltaTime)` receives milliseconds; only auto-rotate reads it, and that's off | drei's controls update themselves |
| B12 | `ui.js` | Nothing reads the type select or the Loop checkbox | The type drives new bounds (D7); Loop stays inert |

## Appendix C: notes on R3F, WebGL and three r187 for this port

Checked against the source of `@react-three/fiber` 9.8.2, `@react-three/drei` 10.7.9 and three 0.186.1, and in a scratch copy of the template built with the latest toolchain. drei, three-stdlib and R3F import nothing that three 0.186.1 lacks. Items 1 to 7 were checked again on 2026-10-30 against three 0.187.0 for D13's WebGL renderer, with a scene in their shape (`<Environment>` around the `Sky` addon, `RendererSettings` and leva) type-checked, linted with the Phase 3 config and built.

1. **The renderer.** With no `gl` prop, R3F creates a `WebGLRenderer` with antialiasing on, and `useThree((s) => s.gl)` is typed as exactly that, so no guard or cast is needed.
2. **Reaching the renderer.** Read it through `get()` inside effects (item 9). Anisotropy comes from `gl.capabilities.getMaxAnisotropy()`.
3. **The Canvas defaults differ from the prototype.** Unless `flat` is set, R3F sets ACES tone mapping when it creates the renderer; apply Neutral, and later the panel's choice, from `RendererSettings` inside the Canvas. `shadows={true}` asks for PCFSoftShadowMap, which r186 removed (WebGL warns and falls back to PCF), so pass `shadows="percentage"`. R3F caps the pixel ratio at 2 by default, where the prototype used the full `devicePixelRatio`. drei's `OrbitControls` damps by default; `enableDamping={false}` matches three's default.
4. **Keep the Canvas props static, and change the renderer from inside.** R3F re-applies `shadows`, `flat` and `linear` only when those props change (by shallow comparison). Under WebGL, tone mapping is part of each material's program key, so a change recompiles the materials on the next frame, and a shadow-type change makes the shadow map mark every material in the scene for recompiling; neither needs help. PCF reads `radius` every frame, and VSM reads `radius` and `blurSamples`. If a switch doesn't show in the browser, set `needsUpdate = true` on the scene's materials.
5. **What WebGL keeps available.** GLSL `ShaderMaterial` and `onBeforeCompile`, drei's helpers, `<Environment>` included, and `@react-three/postprocessing` all run. drei's `<Sky>` does too, but it's three-stdlib's older copy without clouds, so use three's own addon (item 7).
6. **The sky cube, with drei's `<Environment>`.** `<Environment background resolution={2048} near={0.3} far={1000}>` with the sky as its child renders the child into a HalfFloat cube render target with a cube camera, as the prototype did, and sets the texture as `scene.background` and `scene.environment`. With the default `frames={1}`, it renders on mount and again whenever its component re-renders, since it re-renders whenever its `children` change. In r187, `CubeCamera.update()` sets `needsPMREMUpdate` itself, so reflections follow the new sky. Keep light, shadow and renderer controls out of the component that holds it, so they don't cost a 2048 cube render. That cube is about 200 MB of HalfFloat targets; the prototype's Float one was twice that.
7. **three r187's `Sky` addon.** It's a `Mesh` with a GLSL `ShaderMaterial`, and its parameters are uniforms: `turbidity`, `rayleigh`, `mieCoefficient`, `mieDirectionalG`, `sunPosition`, `cloudCoverage` (0.4), `cloudDensity` (0.4), `cloudElevation` (0.5), `cloudScale`, `cloudSpeed`, `showSunDisc` and `time`. Create it once with `useState(() => new Sky())`, render it with `<primitive object={sky} scale={30} />`, and set the uniforms through R3F's dash-separated props, such as `material-uniforms-turbidity-value={turbidity}` and `material-uniforms-sunPosition-value={sunPosition}`, so no code mutates what a hook returned (item 9). R3F never disposes of a primitive, so dispose of its geometry and material in an effect's cleanup. The clouds drift only as the `time` uniform advances, and nothing advances it, so they hold still in a cube rendered only on change. three's docs suggest hiding the sun disc while rendering an environment map; if reflections show a hot spot, try that, and give the background its own sky pass.
8. **`useGLTF` results are cached and shared.** Never mutate a loaded geometry in place: clone it, then bake. React's StrictMode mounts components twice in development, so one-off imperative setup has to be idempotent or undone in the effect's cleanup.
9. **Satisfying the React Compiler-style lint rules.** Oxlint's `react(immutability)` flags mutating anything a hook returned, `useMemo` and `useThree` results included, even inside an effect. These patterns pass, as checked in the scratch build:
   - Create imperative three objects that aren't rendered as JSX inside the effect that owns them, keep them in a ref for later effects, and dispose of them in that effect's cleanup.
   - Set the properties of an object rendered with `<primitive>`, such as the sky, through R3F props, dash-separated ones included, not in an effect.
   - Read the renderer, scene, camera and controls through `const get = useThree((s) => s.get)`, calling `get()` inside effects and handlers.
   - Mutate per-frame state through refs inside `useFrame`.
10. **Public assets need the base prefix.** With `base: ''`, reference files in `public/` as `` `${import.meta.env.BASE_URL}models/collision-world.glb` ``, never with a leading `/`.
11. **R3F's pointer events.** Only objects with handlers are raycast, so the balls never block a click; the prototype filtered them out by hand. Events carry `shiftKey`, `button` and `point`. Every intersected object with a handler gets the event, nearest first, until one calls `e.stopPropagation()`. So the room still receives `onPointerMove` under a dragged point, as long as the point doesn't stop it.
12. **Nothing allocates per frame.** Inside `useFrame`, reuse vectors, matrices and the dummy `Object3D` through refs or module scope. Allocating in event handlers is fine.
13. **Instance updates.** After writing instance matrices, set `instanceMatrix.needsUpdate` and recompute the mesh's bounding sphere, or moving balls get culled.
14. **Versions.** Everything installs at its latest (D14). `npm ls three` should show one three: fiber, drei and three-stdlib take it as a peer, and the `$three` override folds in the copy drei's `stats-gl` would otherwise bring. `@types/three` comes from the same release. TypeScript 7 builds the template's tsconfig unchanged, and Oxlint's type-aware rules run on it. React has to stay within R3F 9's peer range (19.0 to 19.3), and `@types/node` follows the Node in use (24). After that, `npm outdated` should list only `@types/node`.
15. **Ammo's classic build.** Calling the global `Ammo()` returns a promise for the module, and also replaces `window.Ammo` with it; use the resolved module, typed by the local declarations. Bullet objects aren't garbage-collected, so `Ammo.destroy` each one on unmount.
