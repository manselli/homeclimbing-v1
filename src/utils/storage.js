import { del, get, set } from 'idb-keyval'

export const STORAGE_KEYS = Object.freeze({
  boardImage: 'boardImage',
  routes: 'routes',
})

const BACKUP_VERSION = 1

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateRoutes(routes) {
  if (!Array.isArray(routes)) {
    throw new TypeError('Routes must be an array.')
  }

  routes.forEach((route, index) => {
    if (!isPlainObject(route)) {
      throw new TypeError(`Route at index ${index} must be an object.`)
    }

    if (route.id === undefined || route.id === null) {
      throw new TypeError(`Route at index ${index} is missing an id.`)
    }

    if (typeof route.name !== 'string') {
      throw new TypeError(`Route at index ${index} is missing a name.`)
    }

    if (typeof route.grade !== 'string') {
      throw new TypeError(`Route at index ${index} is missing a grade.`)
    }

    if (!Array.isArray(route.holds)) {
      throw new TypeError(`Route at index ${index} is missing a holds array.`)
    }

    route.holds.forEach((hold, holdIndex) => {
      if (!isPlainObject(hold)) {
        throw new TypeError(
          `Hold ${holdIndex} on route "${route.name}" must be an object.`,
        )
      }

      if (
        typeof hold.xPercent !== 'number' ||
        typeof hold.yPercent !== 'number' ||
        typeof hold.type !== 'string'
      ) {
        throw new TypeError(
          `Hold ${holdIndex} on route "${route.name}" is invalid.`,
        )
      }
    })
  })
}

export async function saveBoardImage(imageBase64) {
  if (imageBase64 !== null && typeof imageBase64 !== 'string') {
    throw new TypeError('Board image must be a Base64 string or null.')
  }

  await set(STORAGE_KEYS.boardImage, imageBase64)
  return imageBase64
}

export async function getBoardImage() {
  return (await get(STORAGE_KEYS.boardImage)) ?? null
}

export async function saveRoutes(routes) {
  validateRoutes(routes)
  await set(STORAGE_KEYS.routes, routes)
  return routes
}

export async function getRoutes() {
  const routes = await get(STORAGE_KEYS.routes)
  return Array.isArray(routes) ? routes : []
}

export async function exportBackup() {
  const [boardImage, routes] = await Promise.all([
    getBoardImage(),
    getRoutes(),
  ])

  return JSON.stringify(
    {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      boardImage,
      routes,
    },
    null,
    2,
  )
}

export async function importBackup(backup) {
  let parsed = backup

  if (typeof backup === 'string') {
    try {
      parsed = JSON.parse(backup)
    } catch {
      throw new Error('The backup file is not valid JSON.')
    }
  }

  if (!isPlainObject(parsed)) {
    throw new TypeError('The backup must be an object or a JSON string.')
  }

  const boardImage = parsed.boardImage ?? null
  const routes = parsed.routes ?? []

  if (boardImage !== null && typeof boardImage !== 'string') {
    throw new TypeError('The backup board image must be a Base64 string.')
  }

  validateRoutes(routes)
  await Promise.all([saveBoardImage(boardImage), saveRoutes(routes)])

  return { boardImage, routes }
}

export async function resetBoardData() {
  await Promise.all([
    del(STORAGE_KEYS.boardImage),
    del(STORAGE_KEYS.routes),
  ])
}
