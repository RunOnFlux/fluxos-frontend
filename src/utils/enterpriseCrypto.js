import { Buffer } from 'buffer'
import * as openpgp from 'openpgp'
import axios from 'axios'

async function importRsaPublicKey(base64SpkiDer) {
  const spkiDer = Buffer.from(base64SpkiDer, 'base64')
   
  return await crypto.subtle.importKey(
    'spki',
    spkiDer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
}

function base64ToUint8Array(base64) {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)

  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}

function arrayBufferToBase64(buffer) {
  const data = []

  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength

  for (let i = 0; i < len; i += 1) {
    data.push(String.fromCharCode(bytes[i]))
  }

  return btoa(data.join(''))
}

async function encryptAesKeyWithRsaKey(aesKey, rsaPubKey) {
  const base64AesKey = arrayBufferToBase64(aesKey)

  const rsaEncryptedBase64AesKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaPubKey,
    Buffer.from(base64AesKey),
  )

  const base64RsaEncryptedBase64AesKey = arrayBufferToBase64(
    rsaEncryptedBase64AesKey,
  )

  return base64RsaEncryptedBase64AesKey
}

async function encryptEnterpriseWithAes(
  plainText,
  aesKey,
  base64RsaEncryptedAesKey,
) {
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const plaintextEncoded = new TextEncoder().encode(plainText)
  const rsaEncryptedAesKey = base64ToUint8Array(base64RsaEncryptedAesKey)

  const aesCryptoKey = await crypto.subtle.importKey(
    'raw',
    aesKey,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt'],
  )

  const ciphertextTagBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesCryptoKey,
    plaintextEncoded,
  )

  const ciphertextTag = new Uint8Array(ciphertextTagBuf)

  const keyNonceCiphertextTag = new Uint8Array(
    rsaEncryptedAesKey.length + nonce.length + ciphertextTag.length,
  )

  keyNonceCiphertextTag.set(rsaEncryptedAesKey)
  keyNonceCiphertextTag.set(nonce, rsaEncryptedAesKey.byteLength)
  keyNonceCiphertextTag.set(
    ciphertextTag,
    rsaEncryptedAesKey.byteLength + nonce.length,
  )

  const keyNonceCiphertextTagBase64 = arrayBufferToBase64(
    keyNonceCiphertextTag.buffer,
  )

  return keyNonceCiphertextTagBase64
}

async function decryptEnterpriseWithAes(base64nonceCiphertextTag, aesKey) {
  const nonceCiphertextTag = base64ToUint8Array(base64nonceCiphertextTag)

  const nonce = nonceCiphertextTag.slice(0, 12)
  const ciphertextTag = nonceCiphertextTag.slice(12)

  const aesCryptoKey = await crypto.subtle.importKey(
    'raw',
    aesKey,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt'],
  )

  const plainTextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    aesCryptoKey,
    ciphertextTag,
  )

  const plainText = new TextDecoder().decode(plainTextBuf)

  return plainText
}

// PGP Encryption functions for v7
async function encryptMessage(message, publicKeys) {
  try {
    const pgpPublicKeys = await Promise.all(
      publicKeys.map(keyArmored => openpgp.readKey({ armoredKey: keyArmored })),
    )

    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys: pgpPublicKeys,
    })

    return encrypted
  } catch (error) {
    console.error('PGP encryption error:', error)
    throw error
  }
}

async function getEnterprisePGPKeys(selectedNodes) {
  const fetchedKeys = []
  
  for (const node of selectedNodes) {
    try {
      // Check if the IP already includes a port
      let nodeUrl
      if (node.ip.includes(':')) {
        // IP already has port, use as is
        nodeUrl = `http://${node.ip}/flux/pgp`
      } else {
        // No port specified, use default 16127
        nodeUrl = `http://${node.ip}:16127/flux/pgp`
      }
      
      const keyResponse = await axios.get(nodeUrl)
      if (keyResponse.data.status === 'success') {
        fetchedKeys.push(keyResponse.data.data)
      } else {
        console.error(`Failed to fetch key for ${node.ip}:`, keyResponse.data.data)
      }
    } catch (error) {
      console.error(`Error fetching key for ${node.ip}:`, error)
    }
  }
  
  if (fetchedKeys.length === 0) {
    throw new Error('Failed to fetch any enterprise node PGP keys')
  }
  
  return fetchedKeys
}

export {
  importRsaPublicKey,
  base64ToUint8Array,
  arrayBufferToBase64,
  encryptAesKeyWithRsaKey,
  encryptEnterpriseWithAes,
  decryptEnterpriseWithAes,
  encryptMessage,
  getEnterprisePGPKeys,
}
