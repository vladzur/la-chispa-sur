<template>
  <div class="kudos-wrapper" aria-label="Sección de kudos">
    <p class="kudos-label">{{ labelText }}</p>

    <button
      id="kudos-btn"
      class="kudos-btn"
      :class="{ 'kudos-btn--maxed': isMaxed, 'kudos-btn--animate': animating }"
      :disabled="isMaxed"
      :aria-label="`Dar aplauso al artículo. Total de aplausos: ${displayCount}`"
      @click="handleKudos"
      @animationend="animating = false"
    >
      <span class="kudos-icon" aria-hidden="true">👏</span>
      <span class="kudos-ripple" v-if="animating"></span>
    </button>

    <!-- Contador con transición numérica -->
    <transition name="count-pop" mode="out-in">
      <span :key="displayCount" class="kudos-count">{{ displayCount.toLocaleString('es-CL') }}</span>
    </transition>

    <!-- Indicador de aplausos propios -->
    <div class="kudos-own-indicator" v-if="ownKudos > 0">
      <span class="kudos-own-bar-wrap" aria-label="Tus aplausos">
        <span
          class="kudos-own-bar"
          :style="{ width: ownKudosPercent + '%' }"
        ></span>
      </span>
      <span class="kudos-own-count">Tus aplausos: {{ ownKudos }} / {{ MAX_KUDOS }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { addKudos } from '../services/postService';

const props = defineProps<{
  postId: string;
  initialCount: number;
}>();

const MAX_KUDOS = 10;

// Reactive state
const displayCount = ref(props.initialCount ?? 0);
const ownKudos = ref(0);
const animating = ref(false);

// LocalStorage key per post
const lsKey = computed(() => `lcs_kudos_${props.postId}`);

const isMaxed = computed(() => ownKudos.value >= MAX_KUDOS);

const ownKudosPercent = computed(() =>
  Math.round((ownKudos.value / MAX_KUDOS) * 100)
);

const labelText = computed(() => {
  if (ownKudos.value === 0) return '¿Te gustó el artículo?';
  if (ownKudos.value < MAX_KUDOS) return '¡Gracias por tu apoyo!';
  return '¡Llegaste al límite de aplausos!';
});

onMounted(() => {
  const stored = localStorage.getItem(lsKey.value);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) ownKudos.value = parsed;
  }
});

const handleKudos = async () => {
  if (isMaxed.value || animating.value) return;

  animating.value = true;
  displayCount.value += 1;
  ownKudos.value += 1;
  localStorage.setItem(lsKey.value, String(ownKudos.value));

  try {
    await addKudos(props.postId, 1);
  } catch (err) {
    // Rollback optimistic update on error
    console.error('Error al guardar kudos:', err);
    displayCount.value -= 1;
    ownKudos.value -= 1;
    localStorage.setItem(lsKey.value, String(ownKudos.value));
  }
};
</script>

<style scoped>
.kudos-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem 1.5rem;
  margin-top: 3rem;
  border-top: 1px solid #e5e7eb;
}

.kudos-label {
  font-family: var(--font-sans, sans-serif);
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin: 0;
  transition: color 0.3s ease;
}

/* ── Button ── */
.kudos-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  border: 2.5px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.25s ease, background 0.25s ease, transform 0.1s ease, box-shadow 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  outline: none;
  overflow: hidden;
}

.kudos-btn:hover:not(:disabled) {
  border-color: var(--color-primary, #e05a2b);
  background: #fff8f5;
  box-shadow: 0 4px 20px rgba(224, 90, 43, 0.2);
  transform: scale(1.08);
}

.kudos-btn:focus-visible {
  outline: 3px solid var(--color-primary, #e05a2b);
  outline-offset: 3px;
}

.kudos-btn--maxed {
  border-color: #d1d5db;
  cursor: not-allowed;
  opacity: 0.55;
}

.kudos-btn--animate {
  animation: kudos-pop 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes kudos-pop {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.35) rotate(-8deg); }
  50%  { transform: scale(1.2)  rotate(5deg); }
  75%  { transform: scale(1.28) rotate(-4deg); }
  100% { transform: scale(1)   rotate(0deg); }
}

.kudos-icon {
  font-size: 2rem;
  line-height: 1;
  user-select: none;
  pointer-events: none;
}

/* Ripple overlay on click */
.kudos-ripple {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(224, 90, 43, 0.18) 0%, transparent 70%);
  animation: ripple-out 0.45s ease-out forwards;
  pointer-events: none;
}

@keyframes ripple-out {
  from { opacity: 1; transform: scale(0.6); }
  to   { opacity: 0; transform: scale(1.6); }
}

/* ── Counter ── */
.kudos-count {
  font-family: var(--font-sans, sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  display: block;
}

/* Count pop transition */
.count-pop-enter-active,
.count-pop-leave-active {
  transition: all 0.2s ease;
}
.count-pop-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.85);
}
.count-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.85);
}

/* ── Own kudos progress bar ── */
.kudos-own-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.25rem;
  width: 100%;
  max-width: 180px;
}

.kudos-own-bar-wrap {
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 99px;
  background: #e5e7eb;
  overflow: hidden;
}

.kudos-own-bar {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: var(--color-primary, #e05a2b);
  transition: width 0.35s ease;
}

.kudos-own-count {
  font-family: var(--font-sans, sans-serif);
  font-size: 0.7rem;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}
</style>
