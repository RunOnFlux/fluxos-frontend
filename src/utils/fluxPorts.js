// Flux port helpers shared across the registration flows (Simple, Advanced,
// Orbit). The banned list mirrors FluxOS's config (ZelBack/config/default.js):
// these ports may not be used as *exposed* (public) ports on a node.

export const BANNED_PORTS = [
  // Port ranges reserved by FluxOS
  { min: 16100, max: 16299 },
  { min: 26100, max: 26299 },
  { min: 30000, max: 30099 },

  // Privileged ports (0-1023) require special permissions
  { min: 0, max: 1023 },

  // Individual banned ports
  8384, // Syncthing
  27017, // MongoDB
  22, // SSH
  23, // Telnet
  25, // SMTP
  3389, // RDP
  5900, // VNC
  5800, // VNC HTTP
  5901, // VNC
  161, // SNMP
  512, // rexec
  513, // rlogin
  3388, // RDP variant
  4444, // Common backdoor port
  123, // NTP
  53, // DNS
  8080, // HTTP alternate
  8081, // HTTP alternate
  8443, // HTTPS alternate
  6667, // IRC
]

// True if `port` may not be used as an exposed (public) port.
export function isPortBanned(port) {
  const p = Number(port)
  if (!Number.isInteger(p)) return true

  for (const banned of BANNED_PORTS) {
    if (typeof banned === 'number') {
      if (p === banned) return true
    } else if (p >= banned.min && p <= banned.max) {
      return true
    }
  }

  return false
}

// True if `port` is a syntactically valid port number (1-65535).
export function isValidPort(value) {
  const p = Number(value)

  return Number.isInteger(p) && p > 0 && p <= 65535
}

// Pick a random exposed port that is neither banned nor in `used`. Defaults to
// the 30000-39999 range used by the Advanced form's auto-assignment; the
// 30000-30099 slice is banned, so we always route through isPortBanned.
export function generateRandomPort(min = 30000, max = 39999, used = new Set()) {
  let port
  let attempts = 0
  const maxAttempts = 200

  do {
    port = Math.floor(Math.random() * (max - min + 1)) + min
    attempts++
  } while ((isPortBanned(port) || used.has(port)) && attempts < maxAttempts)

  return port
}
