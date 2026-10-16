<template>
  <div class="pa-8 text-center">
    <h1 class="text-h5 mb-2">
      Game server hosting has moved
    </h1>
    <p class="mb-4">
      Every game on Flux now lives in the Flux games hub.
    </p>
    <a :href="target">Continue to game server hosting on Flux</a>
  </div>
</template>

<script setup>
const target = 'https://runonflux.com/games/'

// The games list moved to the games hub. This page only sends the visitor there; a direct load is
// answered first by the static stub the build writes (scripts/retired-routes.js).
if (typeof window !== 'undefined') window.location.replace(target)
</script>
