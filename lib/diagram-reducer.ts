import type { DiagramState, DiagramAction } from "./diagram-types"

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const initialState: DiagramState = {
  nodes: [],
  connections: [],
  selectedNodeId: null,
  selectedConnectionId: null,
  isDragging: false,
  isConnecting: false,
  connectingFromId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
}

export function diagramReducer(state: DiagramState, action: DiagramAction): DiagramState {
  switch (action.type) {
    case "ADD_NODE":
      return {
        ...state,
        nodes: [...state.nodes, { ...action.payload, id: generateId() }],
      }

    case "UPDATE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.payload.id
            ? { ...node, ...action.payload.updates }
            : node
        ),
      }

    case "DELETE_NODE": {
      const nodeId = action.payload
      return {
        ...state,
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        connections: state.connections.filter(
          (conn) => conn.fromId !== nodeId && conn.toId !== nodeId
        ),
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      }
    }

    case "SELECT_NODE":
      return {
        ...state,
        selectedNodeId: action.payload,
        selectedConnectionId: action.payload ? null : state.selectedConnectionId,
      }

    case "ADD_CONNECTION": {
      const existingConnection = state.connections.find(
        (conn) =>
          (conn.fromId === action.payload.fromId && conn.toId === action.payload.toId) ||
          (conn.fromId === action.payload.toId && conn.toId === action.payload.fromId)
      )
      if (existingConnection || action.payload.fromId === action.payload.toId) {
        return state
      }
      return {
        ...state,
        connections: [...state.connections, { ...action.payload, id: generateId() }],
      }
    }

    case "UPDATE_CONNECTION":
      return {
        ...state,
        connections: state.connections.map((conn) =>
          conn.id === action.payload.id
            ? { ...conn, ...action.payload.updates }
            : conn
        ),
      }

    case "DELETE_CONNECTION":
      return {
        ...state,
        connections: state.connections.filter((conn) => conn.id !== action.payload),
        selectedConnectionId:
          state.selectedConnectionId === action.payload
            ? null
            : state.selectedConnectionId,
      }

    case "SELECT_CONNECTION":
      return {
        ...state,
        selectedConnectionId: action.payload,
        selectedNodeId: action.payload ? null : state.selectedNodeId,
      }

    case "SET_DRAGGING":
      return {
        ...state,
        isDragging: action.payload,
      }

    case "START_CONNECTING":
      return {
        ...state,
        isConnecting: true,
        connectingFromId: action.payload,
      }

    case "END_CONNECTING":
      return {
        ...state,
        isConnecting: false,
        connectingFromId: null,
      }

    case "SET_ZOOM":
      return {
        ...state,
        zoom: Math.max(0.25, Math.min(2, action.payload)),
      }

    case "SET_PAN_OFFSET":
      return {
        ...state,
        panOffset: action.payload,
      }

    case "LOAD_DIAGRAM":
      return {
        ...state,
        nodes: action.payload.nodes,
        connections: action.payload.connections,
        selectedNodeId: null,
        selectedConnectionId: null,
      }

    default:
      return state
  }
}
