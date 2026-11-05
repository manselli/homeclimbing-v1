import { useEffect, useRef, useState } from 'react'
import { ImageOff } from 'lucide-react'

export const HOLD_COLORS = Object.freeze({
  start: '#22c55e',
  hand: '#3b82f6',
  foot: '#eab308',
  top: '#ef4444',
})

export const HOLD_LIMITS = Object.freeze({
  start: 2,
  hand: Infinity,
  foot: Infinity,
  top: 2,
})

const HOLD_LABELS = Object.freeze({
  start: 'S',
  hand: 'H',
  foot: 'F',
  top: 'T',
})

function clampPercent(value) {
  return Math.min(100, Math.max(0, value))
}

function toImageSource(image) {
  if (!image) return null
  return image.startsWith('data:')
    ? image
    : `data:image/jpeg;base64,${image}`
}

export default function BoardCanvas({
  boardImage,
  holds = [],
  holdType = 'hand',
  editMode = true,
  onChange,
  onAddHold,
  onRemoveHold,
  onLimitReached,
  alt = 'Climbing board',
  className = '',
}) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [limitMessage, setLimitMessage] = useState(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    function updateSize() {
      const rect = element.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [boardImage])

  useEffect(() => {
    if (!limitMessage) return undefined
    const timeout = setTimeout(() => setLimitMessage(null), 3000)
    return () => clearTimeout(timeout)
  }, [limitMessage])

  const imageSource = toImageSource(boardImage)
  const holdLimit = HOLD_LIMITS[holdType] ?? Infinity
  const holdCount = holds.filter((hold) => hold.type === holdType).length
  const radius = Math.max(10, Math.min(size.width, size.height) * 0.028)
  const strokeWidth = Math.max(1.5, radius * 0.16)
  const fontSize = Math.max(8, radius * 0.9)

  function emitChange(nextHolds, hold, action, index) {
    onChange?.(nextHolds, { action, hold, index })
    if (action === 'add') onAddHold?.(hold, nextHolds)
    if (action === 'remove') onRemoveHold?.(hold, index, nextHolds)
  }

  function handleCanvasClick(event) {
    if (!editMode || !imageSource) return

    if (holdCount >= holdLimit) {
      const message = `Only ${holdLimit} ${holdType} hold${
        holdLimit === 1 ? '' : 's'
      } allowed.`
      setLimitMessage(message)
      onLimitReached?.(holdType, holdLimit)
      return
    }

    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const nativeEvent = event.nativeEvent
    const offsetX = Number.isFinite(nativeEvent.offsetX)
      ? nativeEvent.offsetX
      : event.clientX - rect.left
    const offsetY = Number.isFinite(nativeEvent.offsetY)
      ? nativeEvent.offsetY
      : event.clientY - rect.top

    const xPercent = Number(
      clampPercent((offsetX / rect.width) * 100).toFixed(2),
    )
    const yPercent = Number(
      clampPercent((offsetY / rect.height) * 100).toFixed(2),
    )

    const hold = {
      xPercent,
      yPercent,
      type: holdType,
    }
    const nextHolds = [...holds, hold]

    setLimitMessage(null)
    emitChange(nextHolds, hold, 'add')
  }

  function handleHoldClick(event, hold, index) {
    event.stopPropagation()
    if (!editMode) return

    const nextHolds = holds.filter((_, holdIndex) => holdIndex !== index)
    setLimitMessage(null)
    emitChange(nextHolds, hold, 'remove', index)
  }

  if (!imageSource) {
    return (
      <div
        className={`flex min-h-[24rem] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 px-6 py-12 text-center ${className}`}
      >
        <div className="grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
          <ImageOff className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-800">
          No board photo yet
        </p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Upload a board photo to start placing holds.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        ref={containerRef}
        className="relative w-full select-none overflow-hidden rounded-xl bg-slate-100"
      >
        <img
          src={imageSource}
          alt={alt}
          className="block h-auto w-full"
          draggable="false"
        />

        <svg
          ref={svgRef}
          className={`absolute inset-0 size-full ${
            editMode ? 'cursor-crosshair' : 'cursor-default'
          }`}
          viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`}
          preserveAspectRatio="none"
          onClick={handleCanvasClick}
          role="group"
          aria-label={
            editMode
              ? `Board holds. Click to place a ${holdType} hold.`
              : 'Board holds.'
          }
        >
          {holds.map((hold, index) => {
            const color = HOLD_COLORS[hold.type] ?? HOLD_COLORS.hand
            const cx = (hold.xPercent / 100) * size.width
            const cy = (hold.yPercent / 100) * size.height

            return (
              <g
                key={`${hold.type}-${index}-${hold.xPercent}-${hold.yPercent}`}
                onClick={(event) => handleHoldClick(event, hold, index)}
                className={editMode ? 'cursor-pointer' : 'cursor-default'}
                role={editMode ? 'button' : undefined}
                tabIndex={editMode ? 0 : undefined}
                aria-label={
                  editMode
                    ? `Remove ${hold.type} hold at ${hold.xPercent}% across and ${hold.yPercent}% down`
                    : `${hold.type} hold`
                }
                onKeyDown={(event) => {
                  if (!editMode) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    event.stopPropagation()
                    const nextHolds = holds.filter(
                      (_, holdIndex) => holdIndex !== index,
                    )
                    emitChange(nextHolds, hold, 'remove', index)
                  }
                }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={color}
                  fillOpacity="0.9"
                  stroke="white"
                  strokeWidth={strokeWidth}
                  className="transition-opacity hover:opacity-75"
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={fontSize}
                  fontWeight="700"
                  pointerEvents="none"
                >
                  {HOLD_LABELS[hold.type] ?? 'H'}
                </text>
              </g>
            )
          })}
        </svg>

        {limitMessage ? (
          <div
            className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-950/85 px-3 py-2 text-xs font-medium text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            {limitMessage}
          </div>
        ) : null}
      </div>

      {editMode ? (
        <p className="text-xs text-slate-500">
          Click the board to add a {holdType} hold. Click a hold to remove it.
          {Number.isFinite(holdLimit)
            ? ` ${holdCount}/${holdLimit} ${holdType} holds placed.`
            : ''}
        </p>
      ) : null}
    </div>
  )
}
