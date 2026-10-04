/**
 * Client-Side Cryptography Module for MatchaNotes Vault
 * Utilizes native Web Crypto API (window.crypto.subtle)
 * Zero external cryptographic dependencies
 */

/**
 * Encodes Uint8Array into a Base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * Decodes a Base64 string into a Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Generates 16 cryptographically secure random bytes encoded to base64
 */
export function generateSalt(): string {
  const saltBytes = new Uint8Array(16)
  window.crypto.getRandomValues(saltBytes)
  return uint8ArrayToBase64(saltBytes)
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a 6-digit PIN and salt using PBKDF2
 * with 100,000 iterations of SHA-256. Non-extractable for memory safety.
 */
export async function deriveMasterKey(pin: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const pinKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  const saltBytes = base64ToUint8Array(saltBase64)

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    pinKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable from memory
    ['encrypt', 'decrypt']
  )
}

/**
 * Generates a SHA-256 verifier hash to validate PIN without ever exposing plaintext PIN.
 */
export async function generateVerifierHash(pin: string, saltBase64: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(`${saltBase64}:${pin}`)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  return uint8ArrayToBase64(new Uint8Array(hashBuffer))
}

/**
 * Encrypts arbitrary serializable payload using AES-GCM 256-bit with a freshly generated 12-byte IV.
 * Returns base64 ciphertext and base64 IV.
 */
export async function encryptVaultPayload(
  data: unknown,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = new Uint8Array(12)
  window.crypto.getRandomValues(iv)
  const enc = new TextEncoder()
  const plaintext = enc.encode(JSON.stringify(data))

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    plaintext
  )

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    iv: uint8ArrayToBase64(iv),
  }
}

/**
 * Decrypts AES-GCM ciphertext using base64 IV and CryptoKey, parsing back to typed payload.
 */
export async function decryptVaultPayload<T>(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<T> {
  const ciphertextBytes = base64ToUint8Array(ciphertextBase64)
  const ivBytes = base64ToUint8Array(ivBase64)

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource },
    key,
    ciphertextBytes as unknown as BufferSource
  )

  const dec = new TextDecoder()
  const jsonStr = dec.decode(decryptedBuffer)
  return JSON.parse(jsonStr) as T
}

/**
 * Configuration options for secure random password generator
 */
export interface PasswordGeneratorOptions {
  length?: number
  uppercase?: boolean
  lowercase?: boolean
  numbers?: boolean
  symbols?: boolean
}

/**
 * Generates a cryptographically secure random password
 */
export function generateSecurePassword(options: PasswordGeneratorOptions = {}): string {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options

  const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowerChars = 'abcdefghijkmnopqrstuvwxyz'
  const numberChars = '23456789'
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let charPool = ''
  const requiredChars: string[] = []

  const getCryptoRandomIndex = (max: number): number => {
    const arr = new Uint32Array(1)
    window.crypto.getRandomValues(arr)
    return arr[0] % max
  }

  if (lowercase) {
    charPool += lowerChars
    requiredChars.push(lowerChars[getCryptoRandomIndex(lowerChars.length)])
  }
  if (uppercase) {
    charPool += upperChars
    requiredChars.push(upperChars[getCryptoRandomIndex(upperChars.length)])
  }
  if (numbers) {
    charPool += numberChars
    requiredChars.push(numberChars[getCryptoRandomIndex(numberChars.length)])
  }
  if (symbols) {
    charPool += symbolChars
    requiredChars.push(symbolChars[getCryptoRandomIndex(symbolChars.length)])
  }

  if (charPool.length === 0) {
    charPool = lowerChars + numberChars
  }

  const remaining = Math.max(0, length - requiredChars.length)
  const resultChars = [...requiredChars]

  const randomValues = new Uint32Array(remaining)
  window.crypto.getRandomValues(randomValues)
  for (let i = 0; i < remaining; i++) {
    resultChars.push(charPool[randomValues[i] % charPool.length])
  }

  // Fisher-Yates shuffle
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = getCryptoRandomIndex(i + 1)
    const temp = resultChars[i]
    resultChars[i] = resultChars[j]
    resultChars[j] = temp
  }

  return resultChars.join('')
}
