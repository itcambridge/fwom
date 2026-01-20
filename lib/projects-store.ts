import type { DiagramSnapshot } from "./diagram-types"

const INDEX_KEY = "fwom2:projects:index"
const PROJECT_KEY_PREFIX = "fwom2:project:"

export interface ProjectMeta {
  id: string
  name: string
  updatedAt: number
}

export interface ProjectRecord extends ProjectMeta {
  snapshot: DiagramSnapshot
}

interface ProjectsIndex {
  version: 1
  lastActiveId: string | null
  projects: ProjectMeta[]
}

const defaultIndex: ProjectsIndex = {
  version: 1,
  lastActiveId: null,
  projects: [],
}

function getStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("localStorage is not available on the server")
  }
  try {
    return window.localStorage
  } catch (error) {
    throw new Error("localStorage is not accessible")
  }
}

function getProjectKey(id: string) {
  return `${PROJECT_KEY_PREFIX}${id}`
}

function parseIndex(raw: string | null): ProjectsIndex {
  if (!raw) {
    return { ...defaultIndex }
  }
  try {
    const data = JSON.parse(raw) as Partial<ProjectsIndex>
    const projects = Array.isArray(data.projects)
      ? data.projects.filter(isProjectMeta)
      : []
    const lastActiveId = typeof data.lastActiveId === "string" ? data.lastActiveId : null
    return {
      version: 1,
      lastActiveId,
      projects: dedupeProjects(projects),
    }
  } catch (error) {
    return { ...defaultIndex }
  }
}

function parseProject(raw: string | null): ProjectRecord | null {
  if (!raw) {
    return null
  }
  try {
    const data = JSON.parse(raw) as Partial<ProjectRecord>
    if (!isProjectMeta(data)) {
      return null
    }
    if (!isSnapshot(data.snapshot)) {
      return null
    }
    return {
      id: data.id,
      name: data.name,
      updatedAt: data.updatedAt,
      snapshot: data.snapshot,
    }
  } catch (error) {
    return null
  }
}

function isProjectMeta(value: unknown): value is ProjectMeta {
  if (!value || typeof value !== "object") {
    return false
  }
  const project = value as ProjectMeta
  return (
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    typeof project.updatedAt === "number"
  )
}

function isSnapshot(value: unknown): value is DiagramSnapshot {
  if (!value || typeof value !== "object") {
    return false
  }
  const snapshot = value as DiagramSnapshot
  return Array.isArray(snapshot.nodes) && Array.isArray(snapshot.connections)
}

function dedupeProjects(projects: ProjectMeta[]): ProjectMeta[] {
  const seen = new Set<string>()
  return projects.filter((project) => {
    if (seen.has(project.id)) {
      return false
    }
    seen.add(project.id)
    return true
  })
}

function readIndex(storage: Storage): ProjectsIndex {
  return parseIndex(storage.getItem(INDEX_KEY))
}

function writeIndex(storage: Storage, index: ProjectsIndex) {
  storage.setItem(INDEX_KEY, JSON.stringify(index))
}

function cloneSnapshot(snapshot: DiagramSnapshot): DiagramSnapshot {
  if (typeof structuredClone === "function") {
    return structuredClone(snapshot)
  }
  return JSON.parse(JSON.stringify(snapshot)) as DiagramSnapshot
}

function updateIndexProjects(
  index: ProjectsIndex,
  project: ProjectMeta,
  { moveToFront }: { moveToFront: boolean }
) {
  const remaining = index.projects.filter((entry) => entry.id !== project.id)
  index.projects = moveToFront ? [project, ...remaining] : [...remaining, project]
}

export function listProjects(): ProjectMeta[] {
  const storage = getStorage()
  return readIndex(storage).projects
}

export function getLastActiveProjectId(): string | null {
  const storage = getStorage()
  return readIndex(storage).lastActiveId
}

export function setLastActiveProjectId(projectId: string | null) {
  const storage = getStorage()
  const index = readIndex(storage)
  index.lastActiveId = projectId
  writeIndex(storage, index)
}

export function getProject(projectId: string): ProjectRecord | null {
  const storage = getStorage()
  return parseProject(storage.getItem(getProjectKey(projectId)))
}

export function createProject(
  name: string,
  snapshot: DiagramSnapshot
): ProjectMeta {
  const storage = getStorage()
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const trimmedName = name.trim() || "Untitled"
  const updatedAt = Date.now()
  const record: ProjectRecord = {
    id,
    name: trimmedName,
    updatedAt,
    snapshot,
  }
  storage.setItem(getProjectKey(id), JSON.stringify(record))
  const index = readIndex(storage)
  updateIndexProjects(index, { id, name: trimmedName, updatedAt }, { moveToFront: true })
  index.lastActiveId = id
  writeIndex(storage, index)
  return { id, name: trimmedName, updatedAt }
}

export function saveProject(
  projectId: string,
  snapshot: DiagramSnapshot
): ProjectMeta {
  const storage = getStorage()
  const existing = parseProject(storage.getItem(getProjectKey(projectId)))
  if (!existing) {
    throw new Error(`Project ${projectId} does not exist`)
  }
  const updatedAt = Date.now()
  const record: ProjectRecord = {
    ...existing,
    updatedAt,
    snapshot,
  }
  storage.setItem(getProjectKey(projectId), JSON.stringify(record))
  const index = readIndex(storage)
  const meta: ProjectMeta = { id: record.id, name: record.name, updatedAt }
  updateIndexProjects(index, meta, { moveToFront: true })
  index.lastActiveId = record.id
  writeIndex(storage, index)
  return meta
}

export function renameProject(projectId: string, name: string): ProjectMeta {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("Project name cannot be empty")
  }
  const storage = getStorage()
  const existing = parseProject(storage.getItem(getProjectKey(projectId)))
  if (!existing) {
    throw new Error(`Project ${projectId} does not exist`)
  }
  const updatedAt = Date.now()
  const record: ProjectRecord = {
    ...existing,
    name: trimmedName,
    updatedAt,
  }
  storage.setItem(getProjectKey(projectId), JSON.stringify(record))
  const index = readIndex(storage)
  const meta: ProjectMeta = { id: record.id, name: record.name, updatedAt }
  updateIndexProjects(index, meta, { moveToFront: true })
  index.lastActiveId = record.id
  writeIndex(storage, index)
  return meta
}

export function deleteProject(projectId: string) {
  const storage = getStorage()
  storage.removeItem(getProjectKey(projectId))
  const index = readIndex(storage)
  index.projects = index.projects.filter((project) => project.id !== projectId)
  if (index.lastActiveId === projectId) {
    index.lastActiveId = index.projects[0]?.id ?? null
  }
  writeIndex(storage, index)
}

export function duplicateProject(projectId: string): ProjectMeta {
  const storage = getStorage()
  const existing = parseProject(storage.getItem(getProjectKey(projectId)))
  if (!existing) {
    throw new Error(`Project ${projectId} does not exist`)
  }
  const copyName = `${existing.name} Copy`
  return createProject(copyName, cloneSnapshot(existing.snapshot))
}
