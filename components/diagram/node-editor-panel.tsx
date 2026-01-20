"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { DiagramNode, NodeColor } from "@/lib/diagram-types"
import { cn } from "@/lib/utils"

interface NodeEditorPanelProps {
  node: DiagramNode
  onUpdate: (updates: Partial<DiagramNode>) => void
  onClose: () => void
  onDelete: () => void
}

const colors: { color: NodeColor; label: string; className: string }[] = [
  { color: "blue", label: "Blue", className: "bg-node-blue" },
  { color: "teal", label: "Teal", className: "bg-node-teal" },
  { color: "orange", label: "Orange", className: "bg-node-orange" },
  { color: "pink", label: "Pink", className: "bg-node-pink" },
  { color: "green", label: "Green", className: "bg-node-green" },
]

export function NodeEditorPanel({
  node,
  onUpdate,
  onClose,
  onDelete,
}: NodeEditorPanelProps) {
  return (
    <div className="absolute right-4 top-20 w-72 bg-card rounded-xl border border-border shadow-xl overflow-hidden z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Edit Node</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Text content */}
        <div className="space-y-2">
          <Label htmlFor="node-text" className="text-foreground">Text</Label>
          <Textarea
            id="node-text"
            value={node.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Enter node text..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Color selection */}
        <div className="space-y-2">
          <Label className="text-foreground">Color</Label>
          <div className="flex items-center gap-2">
            {colors.map(({ color, label, className }) => (
              <button
                key={color}
                type="button"
                onClick={() => onUpdate({ color })}
                className={cn(
                  "w-8 h-8 rounded-lg transition-all",
                  className,
                  node.color === color
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                    : "hover:scale-110"
                )}
                title={label}
              />
            ))}
          </div>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-foreground">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="node-x" className="text-xs text-muted-foreground">
                X
              </Label>
              <input
                id="node-x"
                type="number"
                value={Math.round(node.x)}
                onChange={(e) => onUpdate({ x: Number(e.target.value) })}
                className="w-full h-9 px-3 text-sm bg-input border border-border rounded-md outline-none focus:border-primary text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="node-y" className="text-xs text-muted-foreground">
                Y
              </Label>
              <input
                id="node-y"
                type="number"
                value={Math.round(node.y)}
                onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                className="w-full h-9 px-3 text-sm bg-input border border-border rounded-md outline-none focus:border-primary text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Delete button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={onDelete}
        >
          Delete Node
        </Button>
      </div>
    </div>
  )
}
