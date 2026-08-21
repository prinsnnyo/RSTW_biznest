<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-vue-next'
import { useChatbot } from '../composables/useChatbot'
import ChatbotPanel from './ChatbotPanel.vue'

const BUTTON_SIZE_PX = 48
const EDGE_MARGIN_PX = 8
const NAVBAR_HEIGHT_PX = 64
const DRAG_THRESHOLD_PX = 5
const MAX_PANEL_HEIGHT_PX = 600
const MIN_PANEL_HEIGHT_PX = 240
const DOCKED_MARGIN_PX = 20

interface DragState {
  pointerId: number
  startClientX: number
  startClientY: number
  originX: number
  originY: number
  hasMoved: boolean
}

const router = useRouter()
const isOpen = ref(false)

const { messages, isThinking, sendMessage, reset } = useChatbot({
  onConversationEnd: () => {
    isOpen.value = false
  },
})

// Closing the chat — manually or automatically — always starts a fresh conversation.
watch(isOpen, (open) => {
  if (!open) {
    reset()
  }
})

// null = docked at the default bottom-right corner
const draggedPosition = ref<{ x: number; y: number } | null>(null)

let dragState: DragState | null = null

function getDockedOrigin(): { x: number; y: number } {
  return {
    x: window.innerWidth - BUTTON_SIZE_PX - DOCKED_MARGIN_PX,
    y: window.innerHeight - BUTTON_SIZE_PX - DOCKED_MARGIN_PX,
  }
}

function clampToViewport(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(Math.max(x, EDGE_MARGIN_PX), window.innerWidth - BUTTON_SIZE_PX - EDGE_MARGIN_PX),
    y: Math.min(
      Math.max(y, NAVBAR_HEIGHT_PX + EDGE_MARGIN_PX),
      window.innerHeight - BUTTON_SIZE_PX - EDGE_MARGIN_PX,
    ),
  }
}

const buttonOrigin = computed(() => draggedPosition.value ?? getDockedOrigin())

const containerStyle = computed(() => {
  if (!draggedPosition.value) {
    return undefined
  }

  return {
    left: `${draggedPosition.value.x}px`,
    top: `${draggedPosition.value.y}px`,
    right: 'auto',
    bottom: 'auto',
  }
})

// The panel always opens upward from the button, extending to the left.
const panelHeightPx = computed(() => {
  const spaceAbove = buttonOrigin.value.y - NAVBAR_HEIGHT_PX - EDGE_MARGIN_PX * 2

  return Math.max(MIN_PANEL_HEIGHT_PX, Math.min(MAX_PANEL_HEIGHT_PX, spaceAbove))
})

function handlePointerDown(event: PointerEvent): void {
  dragState = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    originX: buttonOrigin.value.x,
    originY: buttonOrigin.value.y,
    hasMoved: false,
  }

  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function handlePointerMove(event: PointerEvent): void {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return
  }

  const deltaX = event.clientX - dragState.startClientX
  const deltaY = event.clientY - dragState.startClientY

  if (!dragState.hasMoved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
    return
  }

  dragState.hasMoved = true
  draggedPosition.value = clampToViewport(
    dragState.originX + deltaX,
    dragState.originY + deltaY,
  )
}

function handlePointerUp(event: PointerEvent): void {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return
  }

  const shouldToggle = !dragState.hasMoved
  dragState = null

  if (shouldToggle) {
    isOpen.value = !isOpen.value
  }
}

function handlePointerCancel(event: PointerEvent): void {
  if (dragState?.pointerId === event.pointerId) {
    dragState = null
  }
}

function handleViewOnMap(location: { lat: number; lng: number; name: string }): void {
  isOpen.value = false
  void router.push({
    name: 'admin-map',
    query: { lat: String(location.lat), lng: String(location.lng), label: location.name },
  })
}
</script>

<template>
  <div
    class="pointer-events-none fixed z-[1800] flex gap-3"
    :class="[draggedPosition ? '' : 'bottom-5 right-5', 'flex-col items-end']"
    :style="containerStyle"
  >
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="isOpen"
        class="pointer-events-auto w-[min(440px,calc(100vw-2.5rem))]"
        :style="{ height: `${panelHeightPx}px` }"
      >
        <ChatbotPanel
          :messages="messages"
          :is-thinking="isThinking"
          @close="isOpen = false"
          @send="sendMessage"
          @view-on-map="handleViewOnMap"
        />
      </div>
    </transition>

    <Button
      size="icon"
      class="pointer-events-auto h-12 w-12 touch-none select-none rounded-full shadow-lg"
      :aria-label="isOpen ? 'Close chat assistant' : 'Open chat assistant'"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
    >
      <X v-if="isOpen" class="h-5 w-5" />
      <MessageCircle v-else class="h-5 w-5" />
    </Button>
  </div>
</template>
