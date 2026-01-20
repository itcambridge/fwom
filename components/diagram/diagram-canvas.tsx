"use client"

import React from "react"

import { useReducer, useRef, useState, useCallback, useEffect } from "react"
import { DiagramNode } from "./diagram-node"
import { DiagramConnection } from "./diagram-connection"
import { DiagramToolbar } from "./diagram-toolbar"
import { NodeEditorPanel } from "./node-editor-panel"
import { diagramReducer, initialState } from "@/lib/diagram-reducer"
import type { NodeColor, DiagramNode as DiagramNodeType } from "@/lib/diagram-types"
import { cn } from "@/lib/utils"

const SAMPLE_DIAGRAM = {
  nodes: [
    { id: "1", text: "User Request", x: 200, y: 150, color: "blue" as NodeColor },
    { id: "2", text: "API Gateway", x: 450, y: 150, color: "teal" as NodeColor },
    { id: "3", text: "Auth Service", x: 450, y: 320, color: "orange" as NodeColor },
    { id: "4", text: "Database", x: 700, y: 320, color: "pink" as NodeColor },
    { id: "5", text: "Cache Layer", x: 700, y: 150, color: "green" as NodeColor },
    { id: "6", text: "Response", x: 950, y: 150, color: "blue" as NodeColor },
  ],
  connections: [
    { id: "c1", fromId: "1", toId: "2", label: "HTTP" },
    { id: "c2", fromId: "2", toId: "3", label: "validates" },
    { id: "c3", fromId: "3", toId: "4", label: "queries" },
    { id: "c4", fromId: "2", toId: "5", label: "checks" },
    { id: "c5", fromId: "5", toId: "6", label: "hit" },
    { id: "c6", fromId: "4", toId: "6", label: "returns" },
  ],
}

export function DiagramCanvas() {
  const [state, dispatch] = useReducer(diagramReducer, initialState)
  const [selectedColor, setSelectedColor] = useState<NodeColor>("blue")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const isPanning = useRef(false)
  const lastPanPosition = useRef({ x: 0, y: 0 })

  // Load sample diagram on mount
  useEffect(() => {
    dispatch({ type: "LOAD_DIAGRAM", payload: SAMPLE_DIAGRAM })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected node or connection
      if ((e.key === "Delete" || e.key === "Backspace") && !e.target?.toString().includes("Input")) {
        if (state.selectedNodeId) {
          dispatch({ type: "DELETE_NODE", payload: state.selectedNodeId })
        } else if (state.selectedConnectionId) {
          dispatch({ type: "DELETE_CONNECTION", payload: state.selectedConnectionId })
        }
      }

      // Escape to deselect or cancel connecting
      if (e.key === "Escape") {
        if (state.isConnecting) {
          dispatch({ type: "END_CONNECTING" })
        } else {
          dispatch({ type: "SELECT_NODE", payload: null })
          dispatch({ type: "SELECT_CONNECTION", payload: null })
        }
      }

      // Add new node with 'n' key
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          handleAddNode()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state.selectedNodeId, state.selectedConnectionId, state.isConnecting])

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 }
      const rect = canvasRef.current.getBoundingClientRect()
      return {
        x: (clientX - rect.left - state.panOffset.x) / state.zoom,
        y: (clientY - rect.top - state.panOffset.y) / state.zoom,
      }
    },
    [state.zoom, state.panOffset]
  )

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current) {
      // Deselect when clicking on empty canvas
      dispatch({ type: "SELECT_NODE", payload: null })
      dispatch({ type: "SELECT_CONNECTION", payload: null })
      
      if (state.isConnecting) {
        dispatch({ type: "END_CONNECTING" })
      }
    }

    // Middle mouse button or space + left click for panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      isPanning.current = true
      lastPanPosition.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    setMousePosition(getCanvasPoint(e.clientX, e.clientY))

    if (isPanning.current) {
      const dx = e.clientX - lastPanPosition.current.x
      const dy = e.clientY - lastPanPosition.current.y
      dispatch({
        type: "SET_PAN_OFFSET",
        payload: {
          x: state.panOffset.x + dx,
          y: state.panOffset.y + dy,
        },
      })
      lastPanPosition.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleCanvasMouseUp = () => {
    isPanning.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      dispatch({ type: "SET_ZOOM", payload: state.zoom * delta })
    } else {
      // Pan with scroll
      dispatch({
        type: "SET_PAN_OFFSET",
        payload: {
          x: state.panOffset.x - e.deltaX,
          y: state.panOffset.y - e.deltaY,
        },
      })
    }
  }

  const handleAddNode = () => {
    const canvasCenter = canvasRef.current
      ? {
          x: canvasRef.current.clientWidth / 2,
          y: canvasRef.current.clientHeight / 2,
        }
      : { x: 400, y: 300 }

    const position = getCanvasPoint(canvasCenter.x, canvasCenter.y)
    
    dispatch({
      type: "ADD_NODE",
      payload: {
        text: "New Node",
        x: position.x + Math.random() * 100 - 50,
        y: position.y + Math.random() * 100 - 50,
        color: selectedColor,
      },
    })
  }

  const handleExport = () => {
    const data = {
      nodes: state.nodes,
      connections: state.connections,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mindflow-diagram.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (data.nodes && data.connections) {
            dispatch({ type: "LOAD_DIAGRAM", payload: data })
          }
        } catch {
          alert("Invalid diagram file")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleResetView = () => {
    dispatch({ type: "SET_ZOOM", payload: 1 })
    dispatch({ type: "SET_PAN_OFFSET", payload: { x: 0, y: 0 } })
  }

  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId)
  const connectingFromNode = state.nodes.find((n) => n.id === state.connectingFromId)

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: `${40 * state.zoom}px ${40 * state.zoom}px`,
          backgroundPosition: `${state.panOffset.x}px ${state.panOffset.y}px`,
        }}
      />

      {/* Toolbar */}
      <DiagramToolbar
        selectedColor={selectedColor}
        zoom={state.zoom}
        onAddNode={handleAddNode}
        onColorChange={setSelectedColor}
        onZoomIn={() => dispatch({ type: "SET_ZOOM", payload: state.zoom * 1.2 })}
        onZoomOut={() => dispatch({ type: "SET_ZOOM", payload: state.zoom / 1.2 })}
        onResetView={handleResetView}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "absolute inset-0 overflow-hidden",
          state.isConnecting && "cursor-crosshair",
          isPanning.current && "cursor-grabbing"
        )}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        {/* Transformed container */}
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${state.panOffset.x}px, ${state.panOffset.y}px) scale(${state.zoom})`,
          }}
        >
          {/* SVG for connections */}
          <svg
            ref={svgRef}
            className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none"
            style={{ overflow: "visible" }}
          >
            {/* Render connections */}
            {state.connections.map((connection) => {
              const fromNode = state.nodes.find((n) => n.id === connection.fromId)
              const toNode = state.nodes.find((n) => n.id === connection.toId)
              if (!fromNode || !toNode) return null

              return (
                <DiagramConnection
                  key={connection.id}
                  connection={connection}
                  fromNode={fromNode}
                  toNode={toNode}
                  isSelected={state.selectedConnectionId === connection.id}
                  onSelect={() =>
                    dispatch({ type: "SELECT_CONNECTION", payload: connection.id })
                  }
                  onUpdate={(updates) =>
                    dispatch({
                      type: "UPDATE_CONNECTION",
                      payload: { id: connection.id, updates },
                    })
                  }
                  onDelete={() =>
                    dispatch({ type: "DELETE_CONNECTION", payload: connection.id })
                  }
                />
              )
            })}

            {/* Connecting line preview */}
            {state.isConnecting && connectingFromNode && (
              <line
                x1={connectingFromNode.x}
                y1={connectingFromNode.y}
                x2={mousePosition.x}
                y2={mousePosition.y}
                stroke="var(--primary)"
                strokeWidth={2}
                strokeDasharray="8,4"
                className="pointer-events-none"
              />
            )}
          </svg>

          {/* Render nodes */}
          {state.nodes.map((node) => (
            <DiagramNode
              key={node.id}
              node={node}
              isSelected={state.selectedNodeId === node.id}
              isConnecting={state.isConnecting}
              zoom={state.zoom}
              onSelect={() => dispatch({ type: "SELECT_NODE", payload: node.id })}
              onUpdate={(updates) =>
                dispatch({ type: "UPDATE_NODE", payload: { id: node.id, updates } })
              }
              onDelete={() => dispatch({ type: "DELETE_NODE", payload: node.id })}
              onStartConnect={() => dispatch({ type: "START_CONNECTING", payload: node.id })}
              onEndConnect={() => {
                if (state.connectingFromId && state.connectingFromId !== node.id) {
                  dispatch({
                    type: "ADD_CONNECTION",
                    payload: {
                      fromId: state.connectingFromId,
                      toId: node.id,
                    },
                  })
                }
                dispatch({ type: "END_CONNECTING" })
              }}
              onDragStart={() => dispatch({ type: "SET_DRAGGING", payload: true })}
              onDragEnd={() => dispatch({ type: "SET_DRAGGING", payload: false })}
            />
          ))}
        </div>
      </div>

      {/* Node editor panel */}
      {selectedNode && (
        <NodeEditorPanel
          node={selectedNode}
          onUpdate={(updates) =>
            dispatch({
              type: "UPDATE_NODE",
              payload: { id: selectedNode.id, updates },
            })
          }
          onClose={() => dispatch({ type: "SELECT_NODE", payload: null })}
          onDelete={() => dispatch({ type: "DELETE_NODE", payload: selectedNode.id })}
        />
      )}

      {/* Help text */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-card/80 backdrop-blur rounded-lg px-3 py-2 border border-border">
        <p>
          <span className="font-medium">N</span> new node •{" "}
          <span className="font-medium">Double-click</span> to edit •{" "}
          <span className="font-medium">Alt+Drag</span> to pan •{" "}
          <span className="font-medium">Ctrl+Scroll</span> to zoom •{" "}
          <span className="font-medium">Del</span> to delete
        </p>
      </div>

      {/* Connection mode indicator */}
      {state.isConnecting && (
        <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
          Click on another node to connect
        </div>
      )}
    </div>
  )
}
