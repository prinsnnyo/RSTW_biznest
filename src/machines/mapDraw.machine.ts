import { setup, assign } from 'xstate'
import type { MapDrawPoint } from '@/types/zoning.types'

export type MapDrawMode = 'manual' | 'freehand'

interface MapDrawContext {
  vertices: MapDrawPoint[]
  mode: MapDrawMode
}

export type MapDrawEvent =
  | { type: 'START'; mode: MapDrawMode; initialPoints?: MapDrawPoint[] }
  | { type: 'SET_MODE'; mode: MapDrawMode }
  | { type: 'ADD_POINT'; point: MapDrawPoint }
  | { type: 'MOVE_POINT'; index: number; point: MapDrawPoint }
  | { type: 'UNDO_POINT' }
  | { type: 'RESET' }

// Scoped to point-capture mechanics only — this machine has no idea whether
// it's drawing a zoning zone or placing a hazard. That "purpose" stays in
// admin.map.store.ts, same as it already does for hazardPlacementType /
// editingMappedZoneGeometryId / pendingZoneLayerId.
//
// `mode` is deliberately context, not a state: ADD_POINT behaves identically
// either way — the manual/freehand difference is entirely in *how* events
// get sent (one per click vs. distance-throttled during a drag), which
// lives in the MapLibre adapter, not here.
export const mapDrawMachine = setup({
  types: {
    context: {} as MapDrawContext,
    events: {} as MapDrawEvent,
  },
  guards: {
    hasVertices: ({ context }) => context.vertices.length > 0,
  },
  actions: {
    seed: assign({
      vertices: ({ event }) => (event.type === 'START' ? event.initialPoints ?? [] : []),
      mode: ({ event }) => (event.type === 'START' ? event.mode : 'manual'),
    }),
    setMode: assign({
      mode: ({ context, event }) => (event.type === 'SET_MODE' ? event.mode : context.mode),
    }),
    addPoint: assign({
      vertices: ({ context, event }) =>
        event.type === 'ADD_POINT' ? [...context.vertices, event.point] : context.vertices,
    }),
    movePoint: assign({
      vertices: ({ context, event }) =>
        event.type === 'MOVE_POINT'
          ? context.vertices.map((vertex, index) => (index === event.index ? event.point : vertex))
          : context.vertices,
    }),
    undoPoint: assign({
      vertices: ({ context }) => context.vertices.slice(0, -1),
    }),
    clear: assign({
      vertices: () => [],
    }),
  },
}).createMachine({
  id: 'mapDraw',
  context: { vertices: [], mode: 'manual' },
  initial: 'idle',
  states: {
    idle: {
      on: {
        START: { target: 'drawing', actions: 'seed' },
      },
    },
    drawing: {
      on: {
        SET_MODE: { actions: 'setMode' },
        ADD_POINT: { actions: 'addPoint' },
        MOVE_POINT: { actions: 'movePoint' },
        UNDO_POINT: { guard: 'hasVertices', actions: 'undoPoint' },
        RESET: { target: 'idle', actions: 'clear' },
      },
    },
  },
})
