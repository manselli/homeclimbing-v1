import { useRef } from 'react'
import {
  Download,
  LoaderCircle,
  Mountain,
  RotateCcw,
  Upload,
} from 'lucide-react'

const statusStyles = {
  loading: {
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    background: 'bg-amber-50 ring-amber-200',
  },
  ready: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    background: 'bg-emerald-50 ring-emerald-200',
  },
  error: {
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    background: 'bg-rose-50 ring-rose-200',
  },
}

export default function Navbar({
  status,
  routeCount,
  hasBoardImage,
  busy,
  onExport,
  onImport,
  onReset,
}) {
  const fileInputRef = useRef(null)
  const style = statusStyles[status] ?? statusStyles.loading

  const statusLabel =
    status === 'loading'
      ? 'Loading local data'
      : status === 'error'
        ? 'Local data unavailable'
        : `${routeCount} route${routeCount === 1 ? '' : 's'} · ${
            hasBoardImage ? 'board ready' : 'no board photo'
          }`

  function handleFileChange(event) {
    const [file] = event.target.files
    if (file) onImport(file)
    event.target.value = ''
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <div className="mr-auto flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Mountain className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              Home Board
            </h1>
            <p className="text-xs text-slate-500">
              Climbing route manager
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${style.background} ${style.text}`}
          role="status"
          aria-live="polite"
        >
          <span className={`size-2 rounded-full ${style.dot}`} />
          {status === 'loading' ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          ) : null}
          <span>{statusLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Import JSON backup"
            title="Import JSON backup"
          >
            <Upload className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Import JSON</span>
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={busy || status !== 'ready'}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Export JSON backup"
            title="Export JSON backup"
          >
            <Download className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={busy || status !== 'ready'}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Reset local data"
            title="Reset local data"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  )
}
