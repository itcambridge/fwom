"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import type { Connection, DiagramNode } from "@/lib/diagram-types"
import { cn } from "@/lib/utils"

interface DiagramConnectionProps {
  connection: Connection
  fromNode: DiagramNode
  toNode: DiagramNode
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Connection>) => void
  onDelete: () => void
}

export function DiagramConnection({
  connection,
  fromNode,
  toNode,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: DiagramConnectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(connection.label || "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const fallbackWidth = 140
  const fromWidth = fromNode.width ?? fallbackWidth
  const toWidth = toNode.width ?? fallbackWidth

  // Calculate line points (connect from right dot to left dot)
  const x1 = fromNode.x + fromWidth / 2
  const y1 = fromNode.y
  const x2 = toNode.x - toWidth / 2
  const y2 = toNode.y

  // Calculate control points for curved line
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  const curvature = Math.min(distance * 0.2, 50)

  // Perpendicular offset for curve
  const perpX = -dy / distance
  const perpY = dx / distance
  const controlX = midX + perpX * curvature * 0.5
  const controlY = midY + perpY * curvature * 0.5

  // Path for the connection
  const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`

  // Calculate label position
  const labelX = midX + perpX * curvature * 0.25
  const labelY = midY + perpY * curvature * 0.25

  // Calculate arrow rotation
  const angle = Math.atan2(y2 - controlY, x2 - controlX) * (180 / Math.PI)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditLabel(connection.label || "")
  }

  const handleBlur = () => {
    setIsEditing(false)
    onUpdate({ label: editLabel.trim() || undefined })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === "Escape") {
      setEditLabel(connection.label || "")
      setIsEditing(false)
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (!isEditing) {
        e.preventDefault()
        onDelete()
      }
    }
  }

  const strokeDasharray =
    connection.style === "dashed"
      ? "8,4"
      : connection.style === "dotted"
        ? "2,4"
        : undefined

  return (
    <g
      className={cn("cursor-pointer", isSelected && "filter drop-shadow-md")}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Invisible wider path for easier selection */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
      />
      
      {/* Visible connection line */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? "var(--primary)" : "var(--muted-foreground)"}
        strokeWidth={isSelected ? 2.5 : 2}
        strokeDasharray={strokeDasharray}
        className="transition-all"
        markerEnd="url(#arrowhead)"
      />

      {/* Arrow marker */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={isSelected ? "var(--primary)" : "var(--muted-foreground)"}
          />
        </marker>
      </defs>

      {/* Label */}
      {(connection.label || isEditing) && (
        <foreignObject
          x={labelX - 60}
          y={labelY - 14}
          width={120}
          height={28}
          className="pointer-events-auto"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full px-2 text-xs font-medium text-center bg-card border border-border rounded outline-none focus:border-primary text-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="px-2 py-0.5 text-xs font-medium bg-card/90 border border-border rounded text-muted-foreground">
                {connection.label}
              </span>
            </div>
          )}
        </foreignObject>
      )}

      {/* Delete button when selected */}
      {isSelected && !isEditing && (
        <foreignObject x={labelX - 10} y={labelY + 14} width={20} height={20}>
          <button
            type="button"
            className="w-5 h-5 flex items-center justify-center bg-destructive rounded-full text-destructive-foreground text-xs hover:bg-destructive/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Delete connection"
          >
            ×
          </button>
        </foreignObject>
      )}
    </g>
  )
}
