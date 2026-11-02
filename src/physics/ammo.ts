const scriptUrl = `${import.meta.env.BASE_URL}ammo/ammo.wasm.js`

let module: Promise<Ammo.Module> | undefined

// Loads Ammo with a script tag the first time it's asked for, and resolves to its module. The global factory is
// called only once, since calling it replaces it with the module. The script finds its .wasm beside itself
export function loadAmmo(): Promise<Ammo.Module> {
  module ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = scriptUrl
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Couldn't load ${scriptUrl}`))
    document.head.append(script)
  }).then(() => Ammo())
  return module
}
