"use client"

import { useEffect, useState } from "react"
import { Plus, ZoomIn, ZoomOut, Download, Upload, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { NodeColor } from "@/lib/diagram-types"
import { cn } from "@/lib/utils"
import type { ProjectMeta } from "@/lib/projects-store"

interface DiagramToolbarProps {
  selectedColor: NodeColor
  zoom: number
  onAddNode: () => void
  onColorChange: (color: NodeColor) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onExport: () => void
  onImport: () => void
  projects: ProjectMeta[]
  activeProjectId: string | null
  activeProjectName: string
  onProjectSelect: (projectId: string) => void
  onProjectNew: () => void
  onProjectRename: (name: string) => void
  onProjectDuplicate: () => void
  onProjectDelete: () => void
}

const colors: { color: NodeColor; className: string }[] = [
  { color: "blue", className: "bg-node-blue" },
  { color: "teal", className: "bg-node-teal" },
  { color: "orange", className: "bg-node-orange" },
  { color: "pink", className: "bg-node-pink" },
  { color: "green", className: "bg-node-green" },
]

export function DiagramToolbar({
  selectedColor,
  zoom,
  onAddNode,
  onColorChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExport,
  onImport,
  projects,
  activeProjectId,
  activeProjectName,
  onProjectSelect,
  onProjectNew,
  onProjectRename,
  onProjectDuplicate,
  onProjectDelete,
}: DiagramToolbarProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(activeProjectName)

  useEffect(() => {
    setRenameValue(activeProjectName)
  }, [activeProjectName])

  const handleRenameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = renameValue.trim()
    if (!trimmed) {
      return
    }
    onProjectRename(trimmed)
    setRenameOpen(false)
  }

  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
      {/* Left side - Add node and colors */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur rounded-lg border border-border p-1.5">
          <Select
            value={activeProjectId ?? undefined}
            onValueChange={onProjectSelect}
          >
            <SelectTrigger size="sm" className="min-w-[180px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onProjectNew}
            size="sm"
            variant="ghost"
          >
            New
          </Button>
          <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={!activeProjectId}
              >
                Rename
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename project</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleRenameSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <Input
                    id="project-name"
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    placeholder="Project name"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            onClick={onProjectDuplicate}
            size="sm"
            variant="ghost"
            disabled={!activeProjectId}
          >
            Duplicate
          </Button>
          <Button
            onClick={onProjectDelete}
            size="sm"
            variant="ghost"
            disabled={!activeProjectId}
          >
            Delete
          </Button>
        </div>

        <Button onClick={onAddNode} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Node
        </Button>

        <div className="flex items-center gap-1 bg-card/90 backdrop-blur rounded-lg border border-border p-1.5">
          {colors.map(({ color, className }) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorChange(color)}
              className={cn(
                "w-6 h-6 rounded-md transition-all",
                className,
                selectedColor === color
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                  : "hover:scale-110"
              )}
              title={`${color} color`}
            />
          ))}
        </div>
      </div>

      {/* Right side - Zoom and file controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 bg-card/90 backdrop-blur rounded-lg border border-border p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomOut}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="w-12 text-center text-sm font-medium text-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomIn}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onResetView}
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-card/90 backdrop-blur rounded-lg border border-border p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onImport}
            title="Import diagram"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onExport}
            title="Export diagram"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
