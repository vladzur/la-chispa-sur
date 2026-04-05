<template>
  <div class="pending-bg">
    <div class="pending-card">
      <!-- Animación -->
      <div class="pending-icon-wrapper">
        <div class="pending-icon-ring"></div>
        <div class="pending-icon-ring pending-icon-ring--2"></div>
        <span class="pending-icon">⏳</span>
      </div>

      <h1 class="pending-title">Registro exitoso</h1>
      <p class="pending-subtitle">
        Tu cuenta ha sido creada y está <strong>pendiente de aprobación</strong> por el administrador.
        Recibirás acceso una vez que sea revisada.
      </p>

      <div class="pending-steps">
        <div class="step step--done">
          <span class="step-icon">✅</span>
          <span class="step-label">Cuenta creada</span>
        </div>
        <div class="step-connector step-connector--done"></div>
        <div class="step step--active">
          <span class="step-icon">🔍</span>
          <span class="step-label">Revisión del administrador</span>
        </div>
        <div class="step-connector"></div>
        <div class="step step--pending">
          <span class="step-icon">🚀</span>
          <span class="step-label">Acceso al editor</span>
        </div>
      </div>

      <p class="pending-note">
        Si tienes preguntas, contacta al administrador del sitio.
      </p>

      <button @click="handleSignOut" class="btn-signout">
        Cerrar sesión
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleSignOut = async () => {
  await authStore.signOut();
  router.push('/');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.pending-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1a1f35 100%);
  padding: 2rem 1rem;
  font-family: 'Inter', sans-serif;
}

.pending-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  max-width: 460px;
  width: 100%;
  text-align: center;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* Icono animado */
.pending-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending-icon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(99, 102, 241, 0.4);
  animation: pulse-ring 2s cubic-bezier(0.25, 0.5, 0.5, 0.9) infinite;
}

.pending-icon-ring--2 {
  animation-delay: 0.7s;
  border-color: rgba(139, 92, 246, 0.3);
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

.pending-icon {
  font-size: 2.25rem;
  position: relative;
  z-index: 1;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* Textos */
.pending-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
}

.pending-subtitle {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.95rem;
  line-height: 1.7;
  margin: 0 0 2rem;
}

.pending-subtitle strong {
  color: #a5b4fc;
  font-weight: 600;
}

/* Steps */
.pending-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 80px;
}

.step-icon {
  font-size: 1.4rem;
  line-height: 1;
}

.step-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  line-height: 1.3;
}

.step--done .step-label { color: #6ee7b7; }
.step--active .step-label { color: #a5b4fc; font-weight: 600; }
.step--pending .step-label { color: rgba(255, 255, 255, 0.25); }

.step-connector {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 1.2rem;
  max-width: 40px;
}

.step-connector--done {
  background: linear-gradient(90deg, #6ee7b7, #6366f1);
}

/* Nota */
.pending-note {
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.82rem;
  margin: 0 0 2rem;
  line-height: 1.5;
}

/* Botón */
.btn-signout {
  width: 100%;
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
}

.btn-signout:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
