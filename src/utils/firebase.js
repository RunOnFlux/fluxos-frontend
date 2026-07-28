import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAtMsozWwJhhPIOd9BGkZxk5D6Wr8jVGVM',
  authDomain: 'fluxcore-prod.firebaseapp.com',
  projectId: 'fluxcore-prod',
  storageBucket: 'fluxcore-prod.appspot.com',
  messagingSenderId: '468366888401',
  appId: '1:468366888401:web:56eb34ebe93751527ea4f0',
  measurementId: 'G-SEGT3X2737',
}

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig)
const auth = firebase.auth()

export function getUser() {
  try {
    return auth.currentUser
  } catch (error) {
    return null
  }
}

// `auth.currentUser` only exists in memory and is restored from IndexedDB
// asynchronously, so it is null for the first moments of every page load — and
// never populated at all for a session established through the Console handoff.
// Anything that needs the SSO account's email (contact fields, pre-filled forms)
// must not read it straight off Firebase, or it silently gets nothing.
const SSO_EMAIL_KEY = 'ssoEmail'

/** Persist the SSO account email at login so it survives reloads. */
export function rememberSsoEmail(email) {
  if (email) localStorage.setItem(SSO_EMAIL_KEY, email)
}

/** Forget the persisted SSO email — call alongside clearing `loginType`. */
export function forgetSsoEmail() {
  localStorage.removeItem(SSO_EMAIL_KEY)
}

/**
 * The SSO account's email, from the live Firebase user when it is already
 * restored and from the persisted copy otherwise.
 *
 * @returns {string} the email, or '' when this is not an SSO session.
 */
export function getSsoEmail() {
  return getUser()?.email || localStorage.getItem(SSO_EMAIL_KEY) || ''
}

export async function createEmailSSO(login) {
  const { email, password } = login

  // Let the error propagate to the caller so they can handle specific error codes
  return await auth.createUserWithEmailAndPassword(email, password)
}

export async function loginWithEmail(login) {
  const { email, password } = login

  // Let the error propagate to the caller so they can handle specific error codes

  return await auth.signInWithEmailAndPassword(email, password)
}

export async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider()

    provider.setCustomParameters({ prompt: 'select_account' })

    return await auth.signInWithPopup(provider)
  } catch (error) {
    console.error('Google login error:', error)
    throw error
  }
}

export async function loginWithApple() {
  try {
    const provider = new firebase.auth.OAuthProvider('apple.com')
    
    return await auth.signInWithPopup(provider)
  } catch (error) {
    return null
  }
}


export { auth, firebase, firebaseApp }

