import { useState } from 'react'

interface Props {
  value: string
  onSave: (next: string) => void
  className?: string
  multiline?: boolean
}

/** Inline-edit field with a ✎ icon, per admin content-editing spec. */
export function EditableField({ value, onSave, className, multiline }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editing) {
    return (
      <span className={`group inline-flex items-center gap-1 ${className ?? ''}`}>
        {value}
        <button
          aria-label="편집"
          onClick={() => {
            setDraft(value)
            setEditing(true)
          }}
          className="text-text-muted opacity-60 hover:opacity-100"
        >
          ✎
        </button>
      </span>
    )
  }

  const commit = () => {
    onSave(draft)
    setEditing(false)
  }

  const Field = multiline ? 'textarea' : 'input'
  return (
    <span className="inline-flex items-center gap-1">
      <Field
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        className={`border border-accent bg-accent-soft px-1 ${className ?? ''}`}
      />
    </span>
  )
}
