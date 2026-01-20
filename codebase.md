# Codebase Architecture

## Overview
- `Next.js` App Router single-page app focused on interactive diagramming.
- Core UI is the diagram canvas rendered on the home route (`app/page.tsx`).
- State is fully client-side and managed via a reducer (`lib/diagram-reducer.ts`).
- Styling is Tailwind CSS with design tokens in `app/globals.css`.

## High-Level Structure
- `app/`: Next.js entrypoints and layout.
  - `app/layout.tsx` provides global HTML structure and analytics.
  - `app/page.tsx` renders the diagram canvas.
  - `app/globals.css` defines theme tokens and Tailwind base styles.
- `components/diagram/`: Diagram UI and interactions.
  - `diagram-canvas.tsx` orchestrates state, input handling, and rendering.
  - `diagram-node.tsx` renders draggable nodes with inline editing.
  - `diagram-connection.tsx` renders curved connections with label editing.
  - `diagram-toolbar.tsx` renders controls for add/zoom/import/export.
  - `node-editor-panel.tsx` provides side panel editing for a node.
- `lib/`: shared types and reducer logic.
  - `diagram-types.ts` defines the domain model.
  - `diagram-reducer.ts` implements state updates.
  - `utils.ts` contains Tailwind class name helper.
- `components/ui/`: shadcn/Radix-based UI primitives used by diagram UI.
- `hooks/`: shared hooks (toast utilities, mobile detection).

## Core Data Model
- `DiagramNode`: position, text, color, optional size.
- `Connection`: directional link between nodes with label/style.
- `DiagramState`: nodes + connections plus selection, pan, zoom, and
  interaction flags.
  See `lib/diagram-types.ts` for the canonical schema.

## State Management
- State lives in `DiagramCanvas` via `useReducer` with `diagramReducer`.
- Actions cover CRUD for nodes/connections, selection changes, pan/zoom,
  and connection mode.
- `diagramReducer` is a pure function with defensive constraints:
  - Prevents duplicate or self connections.
  - Clamps zoom between 0.25 and 2.0.

## Rendering & Interaction Flow
- `app/page.tsx` renders `DiagramCanvas` as the main screen.
- `DiagramCanvas`:
  - Initializes state and loads a sample diagram on mount.
  - Handles keyboard shortcuts and mouse interactions.
  - Owns pan/zoom transform and computes canvas coordinates.
  - Renders:
    - `DiagramToolbar` for controls.
    - SVG connections + live "connecting" preview line.
    - `DiagramNode` components for each node.
    - `NodeEditorPanel` for selected node details.
- `DiagramNode`:
  - Handles drag, selection, and inline text editing.
  - Triggers "connect" mode and dispatches node updates.
- `DiagramConnection`:
  - Computes curved SVG path and arrowhead.
  - Supports label editing and deletion.
- Import/export:
  - JSON file download is generated in `DiagramCanvas`.
  - JSON upload uses FileReader and dispatches `LOAD_DIAGRAM`.

## Styling & Theming
- Tailwind CSS is configured with tokenized CSS variables in
  `app/globals.css`.
- Custom node colors are provided via CSS variables
  (`--node-blue`, `--node-teal`, etc.).
- `components/ui/` provides consistent UI elements (buttons, inputs,
  labels) built on Radix/shadcn.

## External Dependencies
- UI: Radix UI, lucide-react icons, shadcn UI primitives.
- Framework: Next.js 16, React 19.
- Styling: Tailwind CSS v4, tw-animate-css, class-variance-authority.
- Optional analytics: `@vercel/analytics`.

## Testing
- No test suite is present in the repo currently.
- If adding features, consider unit tests for reducer logic and pure
  utility functions.
