import { ref } from 'vue'

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000,
})

export function useSnackbar() {
  const showSnackbar = (message, color = 'success', timeout = 3000) => {
    snackbar.value = {
      show: true,
      message,
      color,
      timeout,
    }
  }

  const hideSnackbar = () => {
    snackbar.value.show = false
  }

  return {
    snackbar,
    showSnackbar,
    hideSnackbar,
  }
}