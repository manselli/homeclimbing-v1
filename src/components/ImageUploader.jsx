import { useEffect, useRef, useState } from 'react'
import {
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { getBoardImage, saveBoardImage } from '../utils/storage.js'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
  })
}

function toImageSource(image) {
  if (!image) return null
  return image.startsWith('data:')
    ? image
    : `data:image/jpeg;base64,${image}`
}

export default function ImageUploader({
  value,
  onChange,
  onError,
  disabled = false,
  compact = false,
  className = '',
}) {
  const isControlled = value !== undefined
  const [internalImage, setInternalImage] = useState(null)
  const [loading, setLoading] = useState(!isControlled)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const inputRef = useRef(null)
  const dragDepthRef = useRef(0)
  const onChangeRef = useRef(onChange)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onChangeRef.current = onChange
    onErrorRef.current = onError
  }, [onChange, onError])

  useEffect(() => {
    if (isControlled) return undefined

    let cancelled = false
    setLoading(true)

    getBoardImage()
      .then((storedImage) => {
        if (cancelled) return
        setInternalImage(storedImage)
        onChangeRef.current?.(storedImage)
      })
      .catch((error) => {
        if (cancelled) return
        console.error(error)
        setErrorMessage('Could not load the saved board photo.')
        onErrorRef.current?.(error)
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isControlled])

  const image = isControlled ? value : internalImage
  const imageSource = toImageSource(image)
  const busy = disabled || saving

  function reportError(message, cause) {
    setErrorMessage(message)
    onErrorRef.current?.(
      cause instanceof Error ? cause : new Error(message),
    )
  }

  async function processFile(file) {
    if (!file || busy) return

    if (!file.type.startsWith('image/')) {
      reportError('Please choose an image file.')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const imageBase64 = await readFileAsDataUrl(file)
      if (typeof imageBase64 !== 'string') {
        throw new Error('Could not read the selected image.')
      }

      await saveBoardImage(imageBase64)
      if (!isControlled) setInternalImage(imageBase64)
      onChangeRef.current?.(imageBase64)
    } catch (error) {
      console.error(error)
      reportError(
        error.message || 'Could not save the board photo.',
        error,
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeImage() {
    if (busy) return

    setSaving(true)
    setErrorMessage(null)

    try {
      await saveBoardImage(null)
      if (!isControlled) setInternalImage(null)
      onChangeRef.current?.(null)
    } catch (error) {
      console.error(error)
      reportError(
        error.message || 'Could not remove the board photo.',
        error,
      )
    } finally {
      setSaving(false)
    }
  }

  function openPicker() {
    if (!busy) inputRef.current?.click()
  }

  function handleInputChange(event) {
    const [file] = event.target.files ?? []
    event.target.value = ''
    if (file) processFile(file)
  }

  function handleDragEnter(event) {
    event.preventDefault()
    event.stopPropagation()
    if (busy) return
    dragDepthRef.current += 1
    setDragging(true)
  }

  function handleDragOver(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!busy) event.dataTransfer.dropEffect = 'copy'
  }

  function handleDragLeave(event) {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current = 0
    setDragging(false)
    if (busy) return

    const [file] = event.dataTransfer.files ?? []
    if (file) processFile(file)
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />

        {loading ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
            <LoaderCircle
              className="size-3.5 animate-spin"
              aria-hidden="true"
            />
            Loading photo…
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  className="size-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : imageSource ? (
                <RefreshCw className="size-3.5" aria-hidden="true" />
              ) : (
                <Upload className="size-3.5" aria-hidden="true" />
              )}
              {saving
                ? 'Saving…'
                : imageSource
                  ? 'Replace photo'
                  : 'Upload photo'}
            </button>
            {imageSource ? (
              <button
                type="button"
                onClick={removeImage}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </div>
        )}

        {errorMessage ? (
          <p role="alert" className="text-xs text-rose-600">
            {errorMessage}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className={`relative flex min-h-[24rem] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
          dragging
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-slate-300 bg-slate-100'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-busy={saving}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <LoaderCircle
              className="size-6 animate-spin text-slate-500"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-500">
              Loading saved board photo…
            </p>
          </div>
        ) : imageSource ? (
          <>
            <img
              src={imageSource}
              alt="Climbing board layout"
              className="max-h-[70vh] w-full object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-3 pt-10">
              <p className="text-xs font-medium text-white/90">
                Board photo saved locally
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden="true" />
                  )}
                  Replace
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-sm px-6 py-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
              <ImagePlus className="size-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              Drop your board photo here
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Drag and drop an image, or choose a file from your device.
            </p>
            <button
              type="button"
              onClick={openPicker}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {saving ? 'Saving…' : 'Choose photo'}
            </button>
            <p className="mt-3 text-xs text-slate-400">
              PNG, JPG or WebP · stored locally in IndexedDB
            </p>
          </div>
        )}

        {dragging ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-emerald-950/50 p-6">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-white px-8 py-6 text-center shadow-xl">
              <Upload className="size-6 text-emerald-600" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-800">
                Drop image to {imageSource ? 'replace' : 'upload'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-rose-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
