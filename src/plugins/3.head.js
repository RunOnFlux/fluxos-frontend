import { createHead } from '@vueuse/head'

export const head = createHead()

export default function (app) {
  app.use(head)
}
