"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { GripVertical, Link, Trash2 } from "lucide-react"
import type { DiagramNode as DiagramNodeType, NodeColor } from "@/lib/diagram-types"
import { cn } from "@/lib/utils"

interface DiagramNodeProps {
  node: DiagramNodeType
  isSelected: boolean
  isConnecting: boolean
  zoom: number
  onSelect: () => void
  onUpdate: (updates: Partial<DiagramNodeType>) => void
  onDelete: () => void
  onStartConnect: () => void
  onEndConnect: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

const colorClasses: Record<NodeColor, string> = {
  blue: "bg-node-blue/20 border-node-blue/50 hover:border-node-blue",
  teal: "bg-node-teal/20 border-node-teal/50 hover:border-node-teal",
  orange: "bg-node-orange/20 border-node-orange/50 hover:border-node-orange",
  pink: "bg-node-pink/20 border-node-pink/50 hover:border-node-pink",
  green: "bg-node-green/20 border-node-green/50 hover:border-node-green",
}

const selectedColorClasses: Record<NodeColor, string> = {
  blue: "border-node-blue ring-2 ring-node-blue/30",
  teal: "border-node-teal ring-2 ring-node-teal/30",
  orange: "border-node-orange ring-2 ring-node-orange/30",
  pink: "border-node-pink ring-2 ring-node-pink/30",
  green: "border-node-green ring-2 ring-node-green/30",
}

export function DiagramNode({
  node,
  isSelected,
  isConnecting,
  zoom,
  onSelect,
  onUpdate,
  onDelete,
  onStartConnect,
  onEndConnect,
  onDragStart,
  onDragEnd,
}: DiagramNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(node.text)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const element = nodeRef.current
    if (!element || typeof ResizeObserver === "undefined") {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      const { width, height } = entry.contentRect
      if (width !== node.width || height !== node.height) {
        onUpdate({ width, height })
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [node.width, node.height, onUpdate])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditText(node.text)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editText.trim() !== node.text) {
      onUpdate({ text: editText.trim() || "New Node" })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === "Escape") {
      setEditText(node.text)
      setIsEditing(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isEditing) return
    e.stopPropagation()

    if (isConnecting) {
      onEndConnect()
      return
    }

    onSelect()
    onDragStart()

    const startX = e.clientX
    const startY = e.clientY
    const startNodeX = node.x
    const startNodeY = node.y

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom
      const dy = (moveEvent.clientY - startY) / zoom
      onUpdate({
        x: startNodeX + dx,
        y: startNodeY + dy,
      })
    }

    const handleMouseUp = () => {
      onDragEnd()
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  const handleConnectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartConnect()
  }

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute min-w-[140px] max-w-[280px] rounded-lg border-2 transition-all cursor-move select-none",
        colorClasses[node.color],
        isSelected && selectedColorClasses[node.color],
        isConnecting && "cursor-crosshair"
      )}
      style={{
        left: node.x,
        top: node.y,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Drag handle and actions - only show when selected */}
      {isSelected && !isEditing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card rounded-md border border-border px-1 py-0.5 shadow-lg">
          <button
            type="button"
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
            title="Drag to move"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
            onClick={handleConnectClick}
            title="Connect to another node"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Node content */}
      <div className="px-4 py-3">
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[24px] bg-transparent text-foreground text-sm font-medium resize-none outline-none"
            rows={1}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">
            {node.text}
          </p>
        )}
      </div>

      {/* Connection points */}
      <div
        className={cn(
          "absolute top-1/2 -left-2 w-4 h-4 rounded-full border-2 bg-background transition-all",
          isConnecting ? "scale-125 border-primary" : "border-muted-foreground/50"
        )}
        style={{ transform: "translateY(-50%)" }}
      />
      <div
        className={cn(
          "absolute top-1/2 -right-2 w-4 h-4 rounded-full border-2 bg-background transition-all",
          isConnecting ? "scale-125 border-primary" : "border-muted-foreground/50"
        )}
        style={{ transform: "translateY(-50%)" }}
      />
    </div>
  )
}
