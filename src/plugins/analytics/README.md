# Google Analytics Integration

Comprehensive Google Analytics 4 tracking system with GDPR compliance and automatic device detection.

## Table of Contents

- [Setup](#setup)
- [Features](#features)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Privacy & Compliance](#privacy--compliance)
- [Development vs Production](#development-vs-production)

## Setup

### 1. Configuration

Add these environment variables to your `.env` file:

```env
# Get your Measurement ID from: https://analytics.google.com/
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Enable Google Analytics (set to 'true' only in production)
# This provides an extra safety layer - analytics only runs if BOTH conditions are met:
# 1. Production build (npm run build)
# 2. VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ANALYTICS=false
```

### 2. User Consent

The system includes a GDPR-compliant cookie consent banner that automatically appears on first visit. Users must explicitly consent to analytics tracking before any data is collected.

## Features

- **GDPR-Compliant**: Default deny consent mode, user must opt-in
- **Automatic Page View Tracking**: Tracks every route change
- **Device Detection**: Automatic categorization (mobile, tablet, desktop)
- **Browser Fingerprinting**: Detects browser name and version
- **Screen Resolution Tracking**: Categorizes by resolution
- **Development Mode**: Logs events to console without sending data
- **IP Anonymization**: Enabled by default
- **Cookie Management**: Users can manage preferences anytime
- **Auto-imported Composable**: Available everywhere without imports

## Usage

The `useAnalytics()` composable is auto-imported throughout your application. Simply use it in any component:

```vue
<script setup>
const analytics = useAnalytics()

const handleDeploy = () => {
  analytics.trackAppAction('my-app', 'deploy', { tier: 'basic' })
  // Your logic here
}
</script>
```

### Basic Example

```javascript
const analytics = useAnalytics()

// Track a custom event
analytics.trackEvent('custom_event', {
  category: 'engagement',
  value: 100
})
```

## API Reference

All tracking methods automatically check for user consent before sending data. In development mode, events are logged to console only.

### Core Methods

#### `trackEvent(eventName, params)`

Track a custom event with optional parameters.

**Parameters:**
- `eventName` (string) - Name of the event (e.g., 'button_click', 'feature_used')
- `params` (object) - Additional event parameters

**Example:**
```javascript
analytics.trackEvent('video_watched', {
  video_id: 'abc123',
  duration: 120,
  completed: true
})
```

---

### Authentication

#### `trackAuth(method, success)`

Track user authentication events.

**Parameters:**
- `method` (string) - Auth method: 'zelid', 'firebase', 'metamask', 'walletconnect'
- `success` (boolean) - Whether authentication succeeded (default: true)

**Example:**
```javascript
// Successful login
analytics.trackAuth('zelid', true)

// Failed login
analytics.trackAuth('metamask', false)
```

---

### Application Management

#### `trackAppAction(appName, action, metadata)`

Track application deployment and management actions.

**Parameters:**
- `appName` (string) - Application name
- `action` (string) - Action: 'deploy', 'update', 'remove', 'start', 'stop'
- `metadata` (object) - Additional context (tier, resources, etc.)

**Example:**
```javascript
analytics.trackAppAction('wordpress', 'deploy', {
  tier: 'basic',
  cpu: 2,
  ram: 4096
})
```

---

### Marketplace

#### `trackMarketplace(action, metadata)`

Track marketplace interactions.

**Parameters:**
- `action` (string) - Action: 'view', 'search', 'filter', 'install'
- `metadata` (object) - Additional context

**Example:**
```javascript
// Track search
analytics.trackMarketplace('search', {
  search_term: 'minecraft',
  results_count: 5
})

// Track app view
analytics.trackMarketplace('view', {
  app_name: 'wordpress',
  category: 'cms'
})
```

---

### FluxDrive

#### `trackFluxDrive(action, metadata)`

Track FluxDrive file operations.

**Parameters:**
- `action` (string) - Action: 'upload', 'download', 'delete', 'share'
- `metadata` (object) - File metadata

**Example:**
```javascript
analytics.trackFluxDrive('upload', {
  file_type: 'image/png',
  file_size: 2048576,
  folder: 'photos'
})
```

---

### xDAO Governance

#### `trackXDAO(action, metadata)`

Track xDAO governance interactions.

**Parameters:**
- `action` (string) - Action: 'view_proposal', 'vote', 'create_proposal'
- `metadata` (object) - Proposal metadata

**Example:**
```javascript
analytics.trackXDAO('vote', {
  proposal_id: '123',
  vote_choice: 'yes',
  voting_power: 1000
})
```

---

### Node Management

#### `trackNodeAction(action, metadata)`

Track Flux node management actions.

**Parameters:**
- `action` (string) - Action: 'update', 'restart', 'benchmark'
- `metadata` (object) - Node metadata

**Example:**
```javascript
analytics.trackNodeAction('update', {
  node_tier: 'cumulus',
  version: '5.10.0'
})
```

---

### Error Tracking

#### `trackError(errorType, errorMessage, context)`

Track errors and exceptions.

**Parameters:**
- `errorType` (string) - Error category/type
- `errorMessage` (string) - Error message
- `context` (string) - Where error occurred (default: 'unknown')

**Example:**
```javascript
try {
  // Your code
} catch (error) {
  analytics.trackError('deployment_error', error.message, 'app-register')
}
```

---

### E-Commerce

#### `trackCheckout(action, metadata)`

Track checkout and payment flow events.

**Parameters:**
- `action` (string) - Action: 'begin_checkout', 'add_payment_info', 'purchase'
- `metadata` (object) - Transaction metadata

**Example:**
```javascript
// Begin checkout
analytics.trackCheckout('begin_checkout', {
  currency: 'USD',
  value: 29.99,
  items: [{ item_name: 'Flux Subscription', quantity: 1 }]
})

// Complete purchase
analytics.trackCheckout('purchase', {
  transaction_id: 'T12345',
  value: 29.99,
  currency: 'USD'
})
```

---

#### `trackPaymentSystemSelected(paymentSystem, metadata)`

Track payment method selection.

**Parameters:**
- `paymentSystem` (string) - Payment system: 'fluxpay', 'cryptocom', 'zelcore', 'ssp'
- `metadata` (object) - Additional context (plan, price, etc.)

**Example:**
```javascript
analytics.trackPaymentSystemSelected('cryptocom', {
  plan: 'pro',
  price: 49.99,
  currency: 'USD'
})
```

---

## Privacy & Compliance

### GDPR Compliance

The analytics system is GDPR-compliant by default:

- **Consent Mode**: Google Analytics Consent Mode v2 enabled
- **Default Deny**: Analytics blocked until user explicitly consents
- **IP Anonymization**: Enabled by default
- **Cookie Management**: Users can revoke consent anytime
- **Data Minimization**: Only essential tracking data collected
- **Secure Cookies**: SameSite=None;Secure flags set

### What We Track

**Automatically tracked:**
- Page views
- Navigation flows
- Device category (mobile/desktop)
- Device type (mobile/tablet/desktop)
- Browser name and version
- Screen resolution category
- App version

**User-triggered events:**
- Authentication events
- Application management
- Marketplace interactions
- File operations
- Governance voting
- Form submissions
- Errors and exceptions

**NOT tracked:**
- Personal identifiable information (PII)
- Email addresses
- IP addresses (anonymized by GA4)
- Passwords or credentials
- Private file contents
- Wallet private keys

### Managing Consent

Users can manage cookie preferences through:
1. **Initial banner**: Shows on first visit
2. **Footer link**: "Manage Cookies" link in footer
3. **Manual revocation**: Via browser settings

### Cookie Consent Composable

```javascript
import { useCookieConsent } from '@/composables/useCookieConsent'

const {
  getConsent,          // Get current consent state
  saveConsent,         // Save consent preferences
  hasConsent,          // Check if user has made a choice
  hasAnalyticsConsent, // Check if analytics is allowed
  clearConsent,        // Clear all consent data
  enableAnalytics,     // Enable tracking
  disableAnalytics     // Disable tracking
} = useCookieConsent()
```

---

## Development vs Production

### Development Mode

When running `npm run dev`:
- ✅ Analytics events logged to console
- ✅ Full debugging output
- ❌ No data sent to Google Analytics
- ❌ No cookies created
- ⚡ Instant feedback for testing

**Console output:**
```
📊 Google Analytics: Development mode - tracking disabled
📊 [DEV] Analytics Event: page_view { page_path: '/marketplace', ... }
```

### Production Mode

When running `npm run build`:
- ✅ Real data sent to Google Analytics
- ✅ Consent required before tracking
- ✅ Cookies created after consent
- ✅ IP anonymization active
- ⚡ Optimized performance

**Requirements:**
1. `VITE_GA_MEASUREMENT_ID` must be set in `.env`
2. `VITE_ENABLE_ANALYTICS=true` must be set in `.env` for production
3. User must consent via cookie banner
4. Production build deployed

---

## Automatic Features

### Device Detection

Automatically categorizes users:
- **Mobile**: Phones (≤768px width)
- **Tablet**: iPads, Android tablets (768-1024px)
- **Desktop**: Laptops, desktops (>1024px)

### Browser Detection

Automatically detects:
- Chrome (+ version)
- Firefox (+ version)
- Safari (+ version)
- Edge (+ version)
- Opera (+ version)

### Screen Resolution Categories

- **Small**: ≤768px (mobile)
- **Medium**: 769-1024px (tablet)
- **Large**: 1025-1920px (desktop HD)
- **XLarge**: >1920px (2K/4K displays)

### Custom Dimensions

All events include:
- `device_category`: mobile or desktop
- `device_type`: mobile, tablet, or desktop
- `timestamp`: ISO 8601 timestamp
- `app_version`: Current app version

User properties (set once):
- `browser_name`: Browser name
- `browser_version`: Browser version
- `resolution_category`: Screen resolution

---

## Best Practices

### 1. Track User Actions, Not Page Loads

```javascript
// ❌ Don't track on component mount
onMounted(() => {
  analytics.trackEvent('page_loaded') // Redundant
})

// ✅ Track meaningful user actions
const handleDeploy = () => {
  analytics.trackAppAction('wordpress', 'deploy')
  // Deploy logic...
}
```

### 2. Provide Context

```javascript
// ❌ Vague tracking
analytics.trackEvent('action', { name: 'button1' })

// ✅ Descriptive tracking
analytics.trackAppAction('wordpress', 'deploy', { context: 'marketplace-detail' })
```

### 3. Track Errors for Debugging

```javascript
try {
  await deployApp(spec)
} catch (error) {
  analytics.trackError('deployment_failed', error.message, 'app-register')
  showErrorToast(error.message)
}
```

### 4. Track Conversion Funnels

```javascript
// Step 1: User views plan
analytics.trackMarketplace('view', { app_name: 'wordpress' })

// Step 2: User selects payment
analytics.trackPaymentSystemSelected('cryptocom', { plan: 'basic' })

// Step 3: Purchase complete
analytics.trackCheckout('purchase', { transaction_id: 'T123' })
```

### 5. Respect User Privacy

```javascript
// ❌ Don't track PII
analytics.trackEvent('user_registered', {
  email: user.email,  // Never track emails!
  name: user.name     // Never track names!
})

// ✅ Track anonymous actions
analytics.trackAuth('zelid', true)
```

---

## Troubleshooting

### Events Not Showing in GA4

1. **Check consent**: User must accept analytics cookies
2. **Check dev mode**: Run production build for real tracking
3. **Check .env**: `VITE_ENABLE_ANALYTICS=true` in production
4. **Check GA4 dashboard**: Events appear in real-time view (30s-60s delay)

### Console Warnings

```
⚠️ Google Analytics not loaded
```
**Solution**: Check that `VITE_GA_MEASUREMENT_ID` is set correctly.

```
❌ Analytics: Router not found on app instance
```
**Solution**: Ensure analytics plugin loads after router (filename: `3.analytics.js`).

### No Consent Banner

**Solution**: Check that `<CookieConsent />` is added to `App.vue`.

---

## Testing Analytics

### Manual Testing

1. **Development mode:**
   ```bash
   npm run dev
   ```
   Open console and trigger events - should see `📊 [DEV] Analytics Event:` logs.

2. **Production mode:**
   ```bash
   npm run build
   npm run preview
   ```
   Accept cookies, trigger events, check GA4 real-time view.

### Test Checklist

- [ ] Cookie banner appears on first visit
- [ ] "Accept All" enables tracking
- [ ] "Only Necessary" disables tracking
- [ ] Page views tracked on navigation
- [ ] Custom events fire correctly
- [ ] Consent persists across sessions
- [ ] Footer "Manage Cookies" opens settings
- [ ] Development mode logs to console only
- [ ] Production mode sends to GA4
- [ ] IP anonymization working (check GA4)

---

## Additional Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GDPR Compliance Guide](https://support.google.com/analytics/answer/9019185)
- [Consent Mode v2](https://support.google.com/analytics/answer/9976101)
- [Flux Network Documentation](https://docs.runonflux.com)

---

## Support

For issues or questions:
- GitHub Issues: [fluxos-frontend/issues](https://github.com/RunOnFlux/fluxos-frontend/issues)
- Documentation: [docs.runonflux.com](https://docs.runonflux.com)
- Community: [Flux Discord](https://discord.gg/runonflux)
