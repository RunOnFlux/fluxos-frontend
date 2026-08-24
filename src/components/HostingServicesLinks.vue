<template>
  <!--
    Crawlable internal-link section: real <a href> anchors (NOT window.open) with
    keyword-rich anchor text pointing to each dedicated hosting landing site.
    Rendered on the prerendered homepage so the links are in the static snapshot
    and pass link equity from cloud.runonflux.com to the product subdomains.
    Links are followed on purpose (no rel="nofollow") — these are first-party
    related properties we want search engines to associate and rank.
    Each card shows the destination's social share image (og:image) as a banner
    on top, hot-linked from the subdomain, lazily loaded and hidden on load error.
  -->
  <section class="hosting-links" aria-labelledby="hosting-links-title">
    <div class="container">
      <h2 id="hosting-links-title" class="section-title">
        {{ t('hostingLinks.title') }}
      </h2>
      <p class="section-subtitle">{{ t('hostingLinks.subtitle') }}</p>

      <ul class="links-grid">
        <li
          v-for="service in services"
          :key="service.url"
          class="link-item"
        >
          <a
            :href="service.url"
            target="_blank"
            rel="noopener noreferrer"
            class="service-link"
          >
            <img
              :src="service.img"
              :alt="service.anchor"
              class="service-thumb"
              width="400"
              height="210"
              loading="lazy"
              decoding="async"
              @error="onImgError"
            >
            <span class="service-text">
              <span class="service-name-row">
                <span class="service-name">{{ service.anchor }}</span>
                <VIcon size="small" class="service-arrow">mdi-arrow-top-right</VIcon>
              </span>
              <span class="service-desc">{{ service.desc }}</span>
            </span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Hide a thumbnail if the cross-origin image fails to load (e.g. the subdomain
// is temporarily unreachable) so no broken-image icon is shown.
const onImgError = e => {
  e.target.style.display = 'none'
}

// Anchor text is intentionally hardcoded English keyword phrasing: these are
// the exact commercial search terms each subdomain targets, and they must stay
// stable across locales for SEO. `img` is each destination's og:image (social
// share preview), hot-linked from the subdomain. Descriptions are translatable.
const services = [
  { anchor: 'Minecraft Server Hosting', url: 'https://minecraft.runonflux.com', img: 'https://minecraft.runonflux.com/games/minecraft/banner.webp', desc: 'minecraft' },
  { anchor: 'Palworld Server Hosting', url: 'https://palworld.runonflux.com', img: 'https://palworld.runonflux.com/games/palworld/banner.webp', desc: 'palworld' },
  { anchor: 'Enshrouded Server Hosting', url: 'https://enshrouded.runonflux.com', img: 'https://enshrouded.runonflux.com/games/enshrouded/banner.webp', desc: 'enshrouded' },
  { anchor: 'Rust Server Hosting', url: 'https://rust.runonflux.com', img: 'https://rust.runonflux.com/games/rust/banner.webp', desc: 'rust' },
  { anchor: 'Windrose Server Hosting', url: 'https://windrose.runonflux.com', img: 'https://windrose.runonflux.com/games/windrose/banner.webp', desc: 'windrose' },
  { anchor: 'Project Zomboid Server Hosting', url: 'https://projectzomboid.runonflux.com', img: 'https://projectzomboid.runonflux.com/games/projectzomboid/banner.webp', desc: 'projectzomboid' },
  { anchor: 'Valheim Server Hosting', url: 'https://valheim.runonflux.com', img: 'https://valheim.runonflux.com/apps/valheim/banner.webp', desc: 'valheim' },
  { anchor: 'FiveM Server Hosting', url: 'https://fivem.runonflux.com', img: 'https://fivem.runonflux.com/apps/fivem/banner.webp', desc: 'fivem' },
  { anchor: 'Web3 WordPress Hosting', url: 'https://wordpress.runonflux.com', img: 'https://wordpress.runonflux.com/apps/wordpress/banner.webp', desc: 'wordpress' },
  { anchor: 'n8n Hosting', url: 'https://n8n.runonflux.com', img: 'https://n8n.runonflux.com/apps/n8n/banner.webp', desc: 'n8n' },
  { anchor: 'OpenClaw AI Assistant Hosting', url: 'https://openclaw.runonflux.com', img: 'https://openclaw.runonflux.com/apps/openclaw/banner.webp', desc: 'openclaw' },
  { anchor: 'Hermes AI Agent Hosting', url: 'https://hermes.runonflux.com', img: 'https://hermes.runonflux.com/apps/hermes/banner.webp', desc: 'hermes' },
  { anchor: 'Orbit — Deploy with Git', url: 'https://orbit.runonflux.com', img: 'https://orbit.runonflux.com/og-banner.webp', desc: 'orbit' },
].map(s => ({ ...s, desc: t(`hostingLinks.services.${s.desc}`) }))
</script>

<style scoped>
.hosting-links {
  padding: 4rem 1rem 5rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  text-align: center;
  margin: 0 0 0.5rem;
  color: rgb(var(--v-theme-on-surface));
}

.section-subtitle {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0 auto 2.5rem;
  max-width: 640px;
}

.links-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
}

.link-item {
  display: flex;
}

.service-link {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0.75rem;
  border-radius: 14px;
  text-decoration: none;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.service-link:hover {
  transform: translateY(-3px);
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.06);
}

.service-thumb {
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 40 / 21;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.service-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem 0.5rem 0.35rem;
}

.service-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.service-name {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.service-desc {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.service-arrow {
  color: rgba(var(--v-theme-on-surface), 0.4);
  flex-shrink: 0;
}

.service-link:hover .service-arrow {
  color: rgb(var(--v-theme-primary));
}
</style>
