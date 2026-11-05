import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  Database,
  LoaderCircle,
  MousePointerClick,
  Pencil,
  Plus,
  Route as RouteIcon,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'

export default function RouteList({
  routes = [],
  selectedRouteId = null,
  onSelect,
  onEdit,
  onDelete,
  onNew,
  disabled = false,
  loading = false,
  className = '',
}) {
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')

  const grades = useMemo(
    () =>
      [...new Set(routes.map((route) => route.grade).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, undefined, { numeric: true }),
      ),
    [routes],
  )

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    return routes.filter((route) => {
      const matchesName =
        !query || route.name.toLocaleLowerCase().includes(query)
      const matchesGrade =
        gradeFilter === 'all' || route.grade === gradeFilter
      return matchesName && matchesGrade
    })
  }, [gradeFilter, routes, search])

  useEffect(() => {
    if (gradeFilter !== 'all' && !grades.includes(gradeFilter)) {
      setGradeFilter('all')
    }
  }, [gradeFilter, grades])

  const hasFilters = search.trim() !== '' || gradeFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setGradeFilter('all')
  }

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <RouteIcon className="size-4 text-slate-500" aria-hidden="true" />
            Routes
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {routes.length} saved route{routes.length === 1 ? '' : 's'}
          </p>
        </div>
        {onNew ? (
          <button
            type="button"
            onClick={onNew}
            disabled={disabled || loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            New
          </button>
        ) : null}
      </div>

      {routes.length > 0 ? (
        <div className="shrink-0 space-y-2 border-b border-slate-100 bg-slate-50/70 p-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <label className="relative block">
              <span className="sr-only">Search routes by name</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </label>

            <div className="relative">
              <SlidersHorizontal
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <select
                value={gradeFilter}
                onChange={(event) => setGradeFilter(event.target.value)}
                aria-label="Filter routes by grade"
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">All grades</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>
          </div>

          {hasFilters ? (
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Showing {filteredRoutes.length} of {routes.length}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="font-medium text-slate-600 transition hover:text-slate-900"
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                    <div className="h-2.5 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : routes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
              <Database className="size-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              No routes saved
            </p>
            <p className="mt-1 max-w-[16rem] text-xs leading-5 text-slate-500">
              Upload a board photo and create your first route to see it here.
            </p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
              <Search className="size-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              No matching routes
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try a different name or grade.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-xs font-medium text-slate-700 underline-offset-4 transition hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredRoutes.map((route) => {
              const selected = route.id === selectedRouteId
              const holdCount = route.holds.length

              return (
                <li
                  key={route.id}
                  className={`rounded-xl border p-3 transition ${
                    selected
                      ? 'border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                        selected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <RouteIcon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {route.name}
                        </p>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold ${
                            selected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {route.grade}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {holdCount} hold{holdCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelect?.(route)}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {selected ? (
                        <Check className="size-3.5" aria-hidden="true" />
                      ) : (
                        <MousePointerClick
                          className="size-3.5"
                          aria-hidden="true"
                        />
                      )}
                      {selected ? 'Selected' : 'Select'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit?.(route)}
                      disabled={disabled}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Edit ${route.name}`}
                      title="Edit route"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(route)}
                      disabled={disabled}
                      className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${route.name}`}
                      title="Delete route"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {loading ? (
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-100 p-3 text-xs text-slate-400">
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          Loading routes…
        </div>
      ) : null}
    </section>
  )
}
