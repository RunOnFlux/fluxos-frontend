<script setup>
import AppsService from '@/services/AppsService'

// What is left of FluxShare: the files a previous release let an operator put
// on this node, so they can be collected. There is nothing to upload with,
// rename with or delete with - the node stopped being a file host, and the
// backend keeps only a listing and a download (RunOnFlux/flux#1809).
const { t } = useI18n()

const entries = ref([])
const loading = ref(false)
const failure = ref('')
const breadcrumb = ref([])

const currentFolder = computed(() => breadcrumb.value.join('/'))

const zelidauth = () => localStorage.getItem('zelidauth')

const humanSize = bytes => {
  if (bytes === null || bytes === undefined) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let n = bytes
  let u = 0
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u += 1 }

  return `${n.toFixed(u === 0 ? 0 : 1)} ${units[u]}`
}

const load = async () => {
  loading.value = true
  failure.value = ''
  try {
    const response = await AppsService.fluxShareGetFolder(zelidauth(), encodeURIComponent(currentFolder.value))
    if (response.data.status === 'success') {
      // Directories first, then by name, so a folder is never lost among files.
      entries.value = [...response.data.data].sort((a, b) => (
        a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : (a.isDirectory ? -1 : 1)
      ))
    } else {
      failure.value = response.data.data?.message || t('pages.administration.fluxShare.loadFailed')
      entries.value = []
    }
  } catch (error) {
    failure.value = error.message
    entries.value = []
  } finally {
    loading.value = false
  }
}

const open = name => { breadcrumb.value.push(name); load() }
const upTo = index => { breadcrumb.value = breadcrumb.value.slice(0, index); load() }

const download = async entry => {
  const target = [...breadcrumb.value, entry.name].join('/')

  const response = await AppsService.fluxShareDownloadFile(zelidauth(), encodeURIComponent(target))

  // The body is the file; the browser saves it under its own name.
  const url = URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')

  link.href = url
  link.download = entry.name
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(load)
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>{{ t('pages.administration.fluxShare.title') }}</VCardTitle>
      <VCardSubtitle>{{ t('pages.administration.fluxShare.readOnlyNotice') }}</VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VBreadcrumbs
        :items="[{ title: t('pages.administration.fluxShare.root'), disabled: false }, ...breadcrumb.map(b => ({ title: b }))]"
        density="compact"
        class="pa-0 mb-3"
      >
        <template #title="{ item, index }">
          <a href="#" @click.prevent="upTo(index)">{{ item.title }}</a>
        </template>
      </VBreadcrumbs>

      <VAlert v-if="failure" type="error" variant="tonal" class="mb-3">
        {{ failure }}
      </VAlert>

      <VProgressLinear v-if="loading" indeterminate class="mb-3" />

      <VTable v-if="entries.length">
        <thead>
          <tr>
            <th>{{ t('pages.administration.fluxShare.name') }}</th>
            <th>{{ t('pages.administration.fluxShare.size') }}</th>
            <th>{{ t('pages.administration.fluxShare.modified') }}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.name">
            <td>
              <VIcon :icon="entry.isDirectory ? 'mdi-folder' : 'mdi-file-outline'" size="18" class="mr-2" />
              <a v-if="entry.isDirectory" href="#" @click.prevent="open(entry.name)">{{ entry.name }}</a>
              <span v-else>{{ entry.name }}</span>
            </td>
            <td>{{ humanSize(entry.size) }}</td>
            <td>{{ new Date(entry.modifiedAt).toLocaleString() }}</td>
            <td class="text-end">
              <VBtn
                v-if="!entry.isDirectory"
                size="small"
                variant="tonal"
                prepend-icon="mdi-download"
                @click="download(entry)"
              >
                {{ t('pages.administration.fluxShare.download') }}
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>

      <!--
        Most nodes never had a share directory at all, so empty is the
        ordinary answer rather than a fault.
      -->
      <VAlert v-else-if="!loading && !failure" type="info" variant="tonal">
        {{ t('pages.administration.fluxShare.empty') }}
      </VAlert>
    </VCardText>
  </VCard>
</template>
