import { useEffect, useId, useState } from 'react'
import {
  CircleAlert,
  Flag,
  Footprints,
  Hand,
  LoaderCircle,
  Play,
  Route as RouteIcon,
  Save,
  X,
} from 'lucide-react'
import BoardCanvas, { HOLD_COLORS, HOLD_LIMITS } from './BoardCanvas.jsx'
import { getRoutes, saveRoutes } from '../utils/storage.js'

const FONT_GRADES = [
  '4',
  '4+',
  '5',
  '5+',
  '5B',
  '5B+',
  '5C',
  '5C+',
  '6A',
  '6A+',
  '6B',
  '6B+',
  '6C',
  '6C+',
  '7A',
  '7A+',
  '7B',
  '7B+',
  '7C',
  '7C+',
  '8A',
  '8A+',
  '8B',
]

const DEFAULT_GRADE = '6A'

const HOLD_OPTIONS = [
  { type: 'start', label: 'Start', icon: Play },
  { type: 'hand', label: 'Hand', icon: Hand },
  { type: 'foot', label: 'Foot', icon: Footprints },
  { type: 'top', label: 'Top', icon: Flag },
]

function createRouteId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `route-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export default function RouteEditor({
  boardImage,
  route = null,
  onSave,
  onCancel,
  onError,
  className = '',
}) {
  const nameId = useId()
  const [name, setName] = useState(route?.name ?? '')
  const [grade, setGrade] = useState(route?.grade ?? DEFAULT_GRADE)
  const [holds, setHolds] = useState(() =>
    route?.holds ? route.holds.map((hold) => ({ ...hold })) : [],
  )
  const [holdType, setHoldType] = useState('start')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    setName(route?.name ?? '')
    setGrade(route?.grade ?? DEFAULT_GRADE)
    setHolds(
      route?.holds ? route.holds.map((hold) => ({ ...hold })) : [],
    )
    setHoldType('start')
    setErrorMessage(null)
  }, [route])

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('Enter a route name before saving.')
      return
    }

    if (!grade) {
      setErrorMessage('Choose a grade before saving.')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const existingRoutes = await getRoutes()
      const savedRoute = {
        id: route?.id ?? createRouteId(),
        name: trimmedName,
        grade,
        holds: holds.map(({ xPercent, yPercent, type }) => ({
          xPercent,
          yPercent,
          type,
        })),
      }

      const routeIndex = existingRoutes.findIndex(
        (existingRoute) => existingRoute.id === savedRoute.id,
      )
      const nextRoutes =
        routeIndex === -1
          ? [...existingRoutes, savedRoute]
          : existingRoutes.map((existingRoute) =>
              existingRoute.id === savedRoute.id
                ? savedRoute
                : existingRoute,
            )

      await saveRoutes(nextRoutes)
      onSave?.(savedRoute, nextRoutes)
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error.message || 'Could not save the route. Please try again.',
      )
      onError?.(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-5 p-4 sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <RouteIcon className="size-4 text-slate-500" aria-hidden="true" />
            {route ? 'Edit route' : 'New route'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Name the route, choose its grade, then tap the board to place holds.
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close route editor"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <label
            htmlFor={nameId}
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Route name
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder="e.g. Crimp Fest"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Grade
          </span>
          <div
            role="group"
            aria-label="Route grade"
            className="flex max-w-md flex-wrap gap-1.5"
          >
            {FONT_GRADES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGrade(option)}
                aria-pressed={grade === option}
                className={`min-w-10 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  grade === option
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Place hold
          </span>
          <span className="text-xs text-slate-400">
            {holds.length} hold{holds.length === 1 ? '' : 's'} placed
          </span>
        </div>
        <div
          role="group"
          aria-label="Hold type"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {HOLD_OPTIONS.map((option) => {
            const { type, label } = option
            const Icon = option.icon
            const active = holdType === type
            const limit = HOLD_LIMITS[type]
            const count = holds.filter((hold) => hold.type === type).length

            return (
              <button
                key={type}
                type="button"
                onClick={() => setHoldType(type)}
                aria-pressed={active}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className="size-2.5 rounded-full ring-2 ring-white/30"
                  style={{ backgroundColor: HOLD_COLORS[type] }}
                  aria-hidden="true"
                />
                <Icon
                  className="size-4"
                  style={{ color: active ? '#ffffff' : HOLD_COLORS[type] }}
                  aria-hidden="true"
                />
                {label}
                {Number.isFinite(limit) ? (
                  <span
                    className={`ml-auto text-xs ${
                      active ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {count}/{limit}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <BoardCanvas
        boardImage={boardImage}
        holds={holds}
        holdType={holdType}
        editMode
        onChange={(nextHolds) => setHolds(nextHolds)}
      />

      {errorMessage ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          <CircleAlert
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-4" aria-hidden="true" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle
              className="size-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {saving ? 'Saving…' : 'Save Route'}
        </button>
      </div>
    </form>
  )
}
