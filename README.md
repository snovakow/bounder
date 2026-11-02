# Bounder

**TypeScript + React + three.js + React Three Fiber + Vite + WebGL**

Bounder is a browser-based 3D prototype for marking out the bounds of a space on a model of it: shift-click the surfaces of a room to lay down chains of points, then drag and refine them. Each chain is meant to become a floor, a wall or a track.

**Live demo:** [snovakow.com/bounder](https://snovakow.com/bounder/)

## Stack

| | |
| --- | --- |
| [TypeScript](https://www.typescriptlang.org) | Strict types across the whole app |
| [React](https://react.dev) | Components and state for the scene and its panels |
| [three.js](https://threejs.org) | Rendering, lighting, shadows, the sky and the glTF model |
| [React Three Fiber](https://r3f.docs.pmnd.rs) | The three.js scene, written as React components |
| [Vite](https://vite.dev) | The dev server and the production build |
| [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) | The GPU API three.js renders with |

Around them are drei's helpers, a lil-gui debug panel, zustand for shared state, Ammo.js for physics and Oxlint for linting.

Bounder started as a plain three.js prototype bundled with webpack, and has been rebuilt onto this stack. The live demo is still the prototype until the rebuild is deployed.

## What's in it

- **A test room** to orbit around, or to walk through at eye height.
- **Daylight**: an analytic sky that lights the scene and its reflections, a sun you can move, optional clouds, and soft shadows you can tune.
- **A bounds editor**: chains of points joined by links, drawn on the room's surfaces. Each chain is a floor, a wall or a track, chosen in the editor's panel. What sets the three apart, closing a chain into a loop, and turning walls into solid outlines are still to come.
- **A physics test**: a thousand balls above the room that fall when physics is switched on, and most of them settle on it. It uses [Ammo.js](https://github.com/kripken/ammo.js), the Bullet physics engine compiled to WebAssembly, and is off by default.
- **A debug panel** with sliders for the sun, the sky, the clouds, the shadows and the tone mapping.

## Controls

| To | Do this |
| --- | --- |
| Look around | Drag with the left mouse button |
| Zoom | Scroll |
| Pan | Drag with the right mouse button |
| Step forward, back, left or right | W, S, A, D |
| Add a point | Shift-click the room |
| Move a point | Shift-drag it |
| Insert a point into a link | Shift-click the link |
| Start a new chain | Choose another type in the panel at the bottom right, then shift-click the room |
| Carry on with an earlier chain | Shift-click one of its points, with its type chosen in the panel, then shift-click the room |
| Tune the sun, sky, shadows and tone mapping | Use the debug panel at the top right |

Points stay on the room's surfaces as you drag them, and a new point joins the end of the chain you last worked on.

## Workflow

- **Planned in phases.** The rebuild followed a [written plan](docs/r3f-port-plan.md). Each phase was one focused thread, and the phases that changed code ended with lint and a type-checked production build passing.
- **Reviewed before it's committed.** Every batch of work goes through `/commit`, a [Claude Code skill](.claude/skills/commit/SKILL.md) that serves as the final code review. It's adapted from a shared [baseline](https://github.com/snovakow/Claude-Skills/tree/main/skills/commit), and it runs in a fresh thread, so the review starts without the author's assumptions. It reads every changed line for bugs, React Three Fiber and three.js pitfalls, type and lint escapes, new dependencies, leftovers and anything that shouldn't be public. Then it runs the checks, splits the work into focused commits with descriptive messages, and keeps this README accurate.
- **Versioned checkpoints.** Versions continue from the prototype's last, 0.1.1: each reviewed batch ends with a version commit, which marks where the next review starts.
- **Current dependencies.** Packages and tools track their latest releases, and each review reports anything that has fallen behind.
- **Branches and deploys.** Work lands on `development` and reaches `main` by merge. The live site is a static build of `main`.

## Running it locally

You need [Node.js](https://nodejs.org) 22.12 or later. Then, in a clone:

```sh
npm install
npm run dev
```

and open the address it prints.

## Building it

```sh
npm run build
```

makes a static site in `dist/`. Its paths are relative, so it works from any folder on any web server. `npm run preview` serves it locally to try it out.

`npm run lint` and `npm run typecheck` run the checks every review runs.

## Credits

- [three.js](https://threejs.org), including its sky shader, an implementation of the Preetham analytic daylight model, and the lil-gui panel it bundles.
- [React Three Fiber](https://r3f.docs.pmnd.rs) and [drei](https://drei.docs.pmnd.rs), from Poimandres.
- [Ammo.js](https://github.com/kripken/ammo.js), Bullet physics compiled to WebAssembly. A build of it is included in this repository under its zlib license.
