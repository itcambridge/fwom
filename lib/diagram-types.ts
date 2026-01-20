export interface DiagramNode {
  id: string
  text: string
  x: number
  y: number
  color: NodeColor
  width?: number
  height?: number
}

export interface Connection {
  id: string
  fromId: string
  toId: string
  label?: string
  style?: "solid" | "dashed" | "dotted"
}

export type NodeColor = "blue" | "teal" | "orange" | "pink" | "green"

export interface DiagramState {
  nodes: DiagramNode[]
  connections: Connection[]
  selectedNodeId: string | null
  selectedConnectionId: string | null
  isDragging: boolean
  isConnecting: boolean
  connectingFromId: string | null
  zoom: number
  panOffset: { x: number; y: number }
}

export type DiagramAction =
  | { type: "ADD_NODE"; payload: Omit<DiagramNode, "id"> }
  | { type: "UPDATE_NODE"; payload: { id: string; updates: Partial<DiagramNode> } }
  | { type: "DELETE_NODE"; payload: string }
  | { type: "SELECT_NODE"; payload: string | null }
  | { type: "ADD_CONNECTION"; payload: Omit<Connection, "id"> }
  | { type: "UPDATE_CONNECTION"; payload: { id: string; updates: Partial<Connection> } }
  | { type: "DELETE_CONNECTION"; payload: string }
  | { type: "SELECT_CONNECTION"; payload: string | null }
  | { type: "SET_DRAGGING"; payload: boolean }
  | { type: "START_CONNECTING"; payload: string }
  | { type: "END_CONNECTING" }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_PAN_OFFSET"; payload: { x: number; y: number } }
  | { type: "LOAD_DIAGRAM"; payload: { nodes: DiagramNode[]; connections: Connection[] } }

export const NODE_COLORS: Record<NodeColor, string> = {
  blue: "var(--node-blue)",
  teal: "var(--node-teal)",
  orange: "var(--node-orange)",
  pink: "var(--node-pink)",
  green: "var(--node-green)",
}
