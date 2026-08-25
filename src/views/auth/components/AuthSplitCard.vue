<script setup lang="ts">
defineSlots<{
  form(): unknown
  visual(): unknown
}>()
</script>

<template>
  <div
    class="border-border/70 bg-card/80 overflow-hidden rounded-[2rem] border shadow-[0_24px_80px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md"
  >
    <div class="grid md:grid-cols-2">
      <div class="p-6 md:p-9">
        <slot name="form" />
      </div>
      <div
        class="relative hidden min-h-[28rem] overflow-hidden bg-linear-to-br from-primary/25 via-secondary/20 to-accent/15 md:block"
      >
        <div class="auth-orb auth-orb-accent absolute -top-16 -right-10 size-56 rounded-full bg-accent/25 blur-3xl" />
        <div class="auth-orb auth-orb-primary absolute -bottom-20 -left-10 size-64 rounded-full bg-primary/30 blur-3xl" />
        <slot name="visual" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-orb {
  animation: auth-orb-drift 10s ease-in-out infinite;
}

.auth-orb-primary {
  animation-delay: -4s;
  animation-duration: 13s;
}

@keyframes auth-orb-drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translate(-18px, 12px) scale(1.08);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-orb {
    animation: none;
  }
}
</style>
