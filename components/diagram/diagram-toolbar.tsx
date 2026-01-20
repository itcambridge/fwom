"use client"

import { Plus, ZoomIn, ZoomOut, Maximize2, Download, Upload, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NodeColor } from "@/lib/diagram-types"
import { cn } from "@/lib/utils"

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
}: DiagramToolbarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
      {/* Left side - Add node and colors */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <Button
          onClick={onAddNode}
          size="sm"
          className="gap-2"
        >
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
