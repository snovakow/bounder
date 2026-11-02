import { boundTypeLabels, boundTypes } from '../lib/framing.ts'
import type { BoundType } from '../lib/framing.ts'
import { useEditor } from './store.ts'

function isBoundType(value: string): value is BoundType {
  return boundTypes.some((type) => type === value)
}

// The editor's panel, over the canvas in the bottom-right corner: the type new bounds take, and the Loop flag
export function EditorPanel() {
  const type = useEditor((s) => s.type)
  const loop = useEditor((s) => s.loop)
  const setType = useEditor((s) => s.setType)
  const setLoop = useEditor((s) => s.setLoop)

  return (
    <div className="editor-panel">
      <select
        value={type}
        onChange={(event) => {
          if (isBoundType(event.target.value)) setType(event.target.value)
          // Left focused, the browser's type-ahead would turn the W of walking into a switch to Wall
          event.target.blur()
        }}
      >
        {boundTypes.map((boundType) => (
          <option key={boundType} value={boundType}>
            {boundTypeLabels[boundType]}
          </option>
        ))}
      </select>
      <label>
        Loop
        <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
      </label>
    </div>
  )
}
