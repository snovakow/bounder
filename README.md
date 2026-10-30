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

Around them are drei's helpers, a leva debug panel, zustand for shared state, Ammo.js for physics and Oxlint for linting.

The rebuild onto this stack is in progress. The live demo and the code on `main` are still the original prototype: plain three.js, bundled with webpack.

## What's in it

- **A test room** to orbit around, or to walk through at eye height.
- **Daylight**: an analytic sky that lights the scene and its reflections, a sun you can move, and soft shadows you can tune.
- **A bounds editor**: chains of points joined by links, drawn on the room's surfaces. Telling floors, walls and tracks apart, and turning walls into solid outlines, are work in progress.
- **A physics test**: a thousand balls above the room that fall and settle on it when physics is switched on. It uses [Ammo.js](https://github.com/kripken/ammo.js), the Bullet physics engine compiled to WebAssembly, and is off by default.
- **A debug panel** with sliders for the sun, the sky, the shadows and the tone mapping.

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

Points stay on the room's surfaces as you drag them.

## Workflow

- **Planned in phases.** The rebuild follows a [written plan](docs/r3f-port-plan.md). Each phase is one focused thread, and the phases that change code end with lint and a type-checked production build passing.
- **Reviewed before it's committed.** Every batch of work goes through `/commit`, a [Claude Code skill](.claude/skills/commit/SKILL.md) that serves as the final code review. It's adapted from a shared [baseline](https://github.com/snovakow/Claude-Skills/tree/main/skills/commit), and it runs in a fresh thread, so the review starts without the author's assumptions. It reads every changed line for bugs, React Three Fiber and three.js pitfalls, type and lint escapes, new dependencies, leftovers and anything that shouldn't be public. Then it runs the checks, splits the work into focused commits with descriptive messages, and keeps this README accurate.
- **Versioned checkpoints.** Versions continue from the prototype's last, 0.1.1: each reviewed batch ends with a version commit, which marks where the next review starts.
- **Current dependencies.** Packages and tools track their latest releases, and each review reports anything that has fallen behind.
- **Branches and deploys.** Work lands on `development` and reaches `main` by merge. The live site is a static build of `main`.

## Running it locally

Until the rebuild lands, a fresh clone doesn't run on its own, because the prototype expects a local three.js checkout and a site-wide loader script in folders outside the repository. Afterwards it runs like any Vite app: `npm install`, then `npm run dev`.

## Credits

- [three.js](https://threejs.org), including its sky shader, an implementation of the Preetham analytic daylight model.
- [Ammo.js](https://github.com/kripken/ammo.js), Bullet physics compiled to WebAssembly. A build of it is included in this repository under its zlib license.
