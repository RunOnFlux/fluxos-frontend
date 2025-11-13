<template>
  <div class="loading-container">
    <div class="modern-loader">
      <div class="loader-ring"></div>
      <VAvatar :size="80" color="primary" variant="flat" class="icon-avatar">
        <VIcon :icon="icon" :size="iconSize" :class="{ 'rotate-icon': rotateIcon }" />
      </VAvatar>
    </div>
    <h2 v-if="title" :class="titleClass">
      <span v-if="title.endsWith('...')">
        {{ title.slice(0, -3) }}<span class="animated-dots">
          <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
        </span>
      </span>
      <span v-else>{{ title }}</span>
    </h2>
    <p v-if="message" :class="messageClass">{{ message }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: 'mdi-apps',
  },
  iconSize: {
    type: [Number, String],
    default: 64,
  },
  rotateIcon: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  titleClass: {
    type: String,
    default: 'text-h4 font-weight-medium mb-3',
  },
  message: {
    type: String,
    default: '',
  },
  messageClass: {
    type: String,
    default: 'text-body-1 text-medium-emphasis',
  },
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 100vh;
  margin-top: -150px;
}

.modern-loader {
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.loader-ring {
  position: absolute;
  width: 120px;
  height: 120px;
  border: 4px solid transparent;
  border-top-color: rgb(var(--v-theme-primary));
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
  pointer-events: none;
  filter: drop-shadow(0 0 12px rgb(var(--v-theme-primary))) drop-shadow(0 0 20px rgb(var(--v-theme-primary)));
}

.icon-avatar {
  position: relative;
  z-index: 10;
  box-shadow:
    0 0 25px rgba(var(--v-theme-primary), 0.5),
    0 0 50px rgba(var(--v-theme-primary), 0.25),
    inset 0 0 20px rgba(var(--v-theme-primary), 0.1);
  pointer-events: none;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Icon rotation */
:deep(.rotate-icon) {
  animation: spin-reverse 2s linear infinite;
}

@keyframes spin-reverse {
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
}

/* Text gradient effect - similar to games section */
.loading-container h2 {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  animation: pulse 2s ease-in-out infinite;
  white-space: nowrap;
  text-align: center;
}

.loading-container h2 span {
  white-space: nowrap;
}

.loading-container p {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.25rem;
  text-align: center;
  margin-top: -10px;
  opacity: 0.9;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Animated dots */
.animated-dots {
  display: inline-block;
}

.animated-dots .dot {
  animation: dot-blink 1.4s infinite;
  opacity: 0;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animated-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.animated-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.animated-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-blink {
  0%, 20% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
