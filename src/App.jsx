import { useCallback, useEffect, useState } from 'react'
import {
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  MousePointerClick,
  X,
} from 'lucide-react'
import BoardCanvas from './components/BoardCanvas.jsx'
import ImageUploader from './components/ImageUploader.jsx'
import Navbar from './components/Navbar.jsx'
import RouteEditor from './components/RouteEditor.jsx'
import RouteList from './components/RouteList.jsx'
import {
  exportBackup,
  getBoardImage,
  getRoutes,
  importBackup,
  resetBoardData,
  saveRoutes,
} from './utils/storage.js'

export default function App() {
  const [status, setStatus] = useState('loading')
  const [boardImage, setBoardImage] = useState(null)
  const [routes, setRoutes] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [editorRoute, setEditorRoute] = useState(undefined)

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? null

  const loadData = useCallback(async () => {
    setStatus('loading')
    try {
      const [storedImage, storedRoutes] = await Promise.all([
        getBoardImage(),
        getRoutes(),
      ])
      setBoardImage(storedImage)
      setRoutes(storedRoutes)
      setSelectedRouteId(storedRoutes[0]?.id ?? null)
      setStatus('ready')
    } catch (error) {
      console.error(error)
      setStatus('error')
      setNotice({
        type: 'error',
        message: 'Could not read local IndexedDB data.',
      })
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    if (editorRoute === undefined) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') setEditorRoute(undefined)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editorRoute])

  function handleImageError(error) {
    setNotice({
      type: 'error',
      message: error.message || 'Could not update the board photo.',
    })
  }

  async function handleExport() {
    setBusy(true)
    try {
      const json = await exportBackup()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `home-board-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setNotice({ type: 'success', message: 'Backup exported as JSON.' })
    } catch (error) {
      console.error(error)
      setNotice({ type: 'error', message: 'Could not export the backup.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file) {
    setBusy(true)
    try {
      const backup = await file.text()
      const imported = await importBackup(backup)
      setBoardImage(imported.boardImage)
      setRoutes(imported.routes)
      setSelectedRouteId(imported.routes[0]?.id ?? null)
      setEditorRoute(undefined)
      setStatus('ready')
      setNotice({
        type: 'success',
        message: `Imported ${imported.routes.length} route${
          imported.routes.length === 1 ? '' : 's'
        }.`,
      })
    } catch (error) {
      console.error(error)
      setNotice({
        type: 'error',
        message: error.message || 'Could not import the backup.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(
      'Delete the saved board photo and all routes from this browser?',
    )
    if (!confirmed) return

    setBusy(true)
    try {
      await resetBoardData()
      setBoardImage(null)
      setRoutes([])
      setSelectedRouteId(null)
      setEditorRoute(undefined)
      setNotice({ type: 'success', message: 'Local board data was reset.' })
    } catch (error) {
      console.error(error)
      setNotice({ type: 'error', message: 'Could not reset local data.' })
    } finally {
      setBusy(false)
    }
  }

  function handleSelectRoute(route) {
    setSelectedRouteId((currentId) =>
      currentId === route.id ? null : route.id,
    )
  }

  async function handleDeleteRoute(route) {
    const confirmed = window.confirm(
      `Delete route "${route.name}"? This cannot be undone.`,
    )
    if (!confirmed) return

    setBusy(true)
    try {
      const nextRoutes = routes.filter((item) => item.id !== route.id)
      await saveRoutes(nextRoutes)
      setRoutes(nextRoutes)

      if (selectedRouteId === route.id) {
        setSelectedRouteId(nextRoutes[0]?.id ?? null)
      }
      if (editorRoute?.id === route.id) {
        setEditorRoute(undefined)
      }

      setNotice({
        type: 'success',
        message: `Route "${route.name}" deleted.`,
      })
    } catch (error) {
      console.error(error)
      setNotice({ type: 'error', message: 'Could not delete the route.' })
    } finally {
      setBusy(false)
    }
  }

  function handleSaveRoute(savedRoute, nextRoutes) {
    setRoutes(nextRoutes)
    setSelectedRouteId(savedRoute.id)
    setEditorRoute(undefined)
    setNotice({
      type: 'success',
      message: `Route "${savedRoute.name}" saved.`,
    })
  }

  const boardSubtitle =
    status === 'loading'
      ? 'Loading your saved board…'
      : selectedRoute
        ? `${selectedRoute.holds.length} hold${
            selectedRoute.holds.length === 1 ? '' : 's'
          } highlighted`
        : boardImage
          ? 'Select a route from the list to highlight its holds.'
          : 'Add a photo of your home wall to get started.'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        status={status}
        routeCount={routes.length}
        hasBoardImage={Boolean(boardImage)}
        busy={busy}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ImagePlus
                      className="size-4 text-slate-500"
                      aria-hidden="true"
                    />
                    Board
                  </h2>
                  {selectedRoute ? (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="truncate">
                        {selectedRoute.name} · {selectedRoute.grade}
                      </span>
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">{boardSubtitle}</p>
              </div>

              {boardImage && status === 'ready' ? (
                <ImageUploader
                  compact
                  value={boardImage}
                  onChange={setBoardImage}
                  onError={handleImageError}
                  disabled={busy}
                />
              ) : null}
            </div>

            {status === 'loading' ? (
              <div className="flex min-h-[24rem] flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <LoaderCircle
                  className="size-6 animate-spin text-slate-400"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm text-slate-500">
                  Loading your board…
                </p>
              </div>
            ) : boardImage ? (
              <>
                <BoardCanvas
                  boardImage={boardImage}
                  holds={selectedRoute?.holds ?? []}
                  editMode={false}
                  alt={
                    selectedRoute
                      ? `${selectedRoute.name} route on climbing board`
                      : 'Climbing board'
                  }
                />

                {selectedRoute ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Start
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-500" />
                      Hand
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-yellow-500" />
                      Foot
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-red-500" />
                      Top
                    </span>
                    <span className="ml-auto font-medium text-slate-600">
                      {selectedRoute.holds.length} hold
                      {selectedRoute.holds.length === 1 ? '' : 's'}
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
                    <MousePointerClick
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Select a route from the list to highlight its circles on the
                    board.
                  </p>
                )}
              </>
            ) : (
              <ImageUploader
                value={boardImage}
                onChange={setBoardImage}
                onError={handleImageError}
                disabled={busy}
              />
            )}
          </section>

          <RouteList
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelect={handleSelectRoute}
            onEdit={setEditorRoute}
            onDelete={handleDeleteRoute}
            onNew={() => setEditorRoute(null)}
            disabled={busy || status !== 'ready'}
            loading={status === 'loading'}
            className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]"
          />
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-400 sm:px-6">
        Your board and routes live in this browser. Export a JSON backup to
        keep them safe.
      </footer>

      {editorRoute !== undefined ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/50 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center p-4 sm:p-8">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <RouteEditor
                boardImage={boardImage}
                route={editorRoute}
                onSave={handleSaveRoute}
                onCancel={() => setEditorRoute(undefined)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div
          className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:left-auto sm:right-6 sm:mx-0"
          role="status"
          aria-live="polite"
        >
          <CircleAlert
            className={`mt-0.5 size-4 shrink-0 ${
              notice.type === 'error' ? 'text-rose-500' : 'text-emerald-500'
            }`}
            aria-hidden="true"
          />
          <p className="flex-1 text-sm text-slate-700">{notice.message}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded p-0.5 text-slate-400 transition hover:text-slate-700"
            aria-label="Dismiss notification"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
