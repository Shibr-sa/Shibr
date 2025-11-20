# Environment Variables Guide - Shibr Platform

Complete reference for all environment variables required for the Shibr B2B marketplace platform.

## Quick Setup

### Development (Minimal Setup)
```bash
# 1. Generate JWT keys (see instructions below)
node scripts/generate-jwt-keys.mjs > jwt-keys.txt

# 2. Set required Convex variables
bunx convex env set JWT_PRIVATE_KEY "<value-from-jwt-keys.txt>"
bunx convex env set JWKS <value-from-jwt-keys.txt>
bunx convex env set SITE_URL "http://localhost:3000"

# 3. Copy .env.example to .env.local and fill in Convex URL
cp .env.example .env.local
# Edit .env.local with your NEXT_PUBLIC_CONVEX_URL
```

**Note:** In development mode, OTPs are logged to console - no email/SMS APIs needed!

### Production Setup
See `convex-env-template.sh` - fill in all values and run the script.

---

## Environment Variables by Category

### 🔐 Authentication & JWT (REQUIRED)

#### `JWT_PRIVATE_KEY`
- **Where:** Convex Environment (set via CLI)
- **Purpose:** Private key for signing JWT authentication tokens
- **Required:** ✅ Yes (blocks login without it)
- **Format:** RS256 private key (PEM format, newlines replaced with spaces)
- **Generate:** Run `node scripts/generate-jwt-keys.mjs`
- **Set Command:**
  ```bash
  bunx convex env set JWT_PRIVATE_KEY "-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----"
  ```

#### `JWKS`
- **Where:** Convex Environment
- **Purpose:** JSON Web Key Set containing public key for JWT verification
- **Required:** ✅ Yes (blocks login without it)
- **Format:** JSON string `{"keys":[{"use":"sig",...}]}`
- **Generate:** Run `node scripts/generate-jwt-keys.mjs`
- **Set Command:**
  ```bash
  bunx convex env set JWKS '{"keys":[{...}]}'
  ```

---

### 🌐 Application URLs

#### `SITE_URL`
- **Where:** Convex Environment
- **Purpose:** Base URL for generating links in emails and WhatsApp messages
- **Required:** ✅ Yes
- **Development:** `http://localhost:3000`
- **Production:** `https://shibr.io` or your domain
- **Set Command:**
  ```bash
  bunx convex env set SITE_URL "http://localhost:3000"
  ```

#### `CONVEX_SITE_URL`
- **Where:** Convex Environment
- **Purpose:** Domain for Convex Auth cookie configuration
- **Required:** ✅ Yes (auto-set from SITE_URL in most cases)
- **Same value as:** `SITE_URL`

#### `NEXT_PUBLIC_CONVEX_URL`
- **Where:** `.env.local` (Next.js)
- **Purpose:** Convex deployment URL for frontend API calls
- **Required:** ✅ Yes
- **Development:** `https://warmhearted-capybara-335.convex.cloud` (or your dev deployment)
- **Production:** `https://enchanted-clam-269.convex.cloud` (or your prod deployment)
- **Example:**
  ```env
  NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
  ```

#### `CONVEX_DEPLOYMENT`
- **Where:** `.env.local` (for Convex CLI)
- **Purpose:** Specifies which Convex deployment to target
- **Required:** For CLI commands
- **Development:** `dev:warmhearted-capybara-335`
- **Production:** `prod:enchanted-clam-269`
- **Example:**
  ```env
  CONVEX_DEPLOYMENT=dev:warmhearted-capybara-335
  ```

---

### 📧 Email Service (Resend)

#### `RESEND_API_KEY`
- **Where:** Convex Environment
- **Purpose:** API key for sending emails via Resend
- **Required:** ⚠️ Optional in development, ✅ Required in production
- **Used For:**
  - Signup email verification OTPs
  - Password reset OTPs
  - Contact form submissions
- **Development Behavior:** If not set, OTPs are logged to console instead
- **Get Key:** https://resend.com/api-keys
- **Set Command:**
  ```bash
  bunx convex env set RESEND_API_KEY "re_xxxxxxxxxxxx"
  ```

---

### 📱 Mobile Messaging (Karzoun WhatsApp/SMS)

#### `KARZOUN_API_TOKEN`
- **Where:** Convex Environment
- **Purpose:** Authentication token for Karzoun API
- **Required:** ⚠️ Optional in development, ✅ Required in production (if using phone verification)
- **Used For:**
  - Phone number OTP verification
  - WhatsApp notifications for rental requests
  - WhatsApp invoice delivery
- **Development Behavior:** If not set, OTPs are logged to console
- **Get Token:** Contact Karzoun support
- **Set Command:**
  ```bash
  bunx convex env set KARZOUN_API_TOKEN "your-karzoun-token"
  ```

#### `KARZOUN_SENDER_ID`
- **Where:** Convex Environment
- **Purpose:** Sender ID for WhatsApp account
- **Required:** ⚠️ Required if using Karzoun
- **Format:** Your registered WhatsApp Business number or sender ID
- **Set Command:**
  ```bash
  bunx convex env set KARZOUN_SENDER_ID "966XXXXXXXXX"
  ```

#### `KARZOUN_OTP_TEMPLATE_NAME`
- **Where:** Convex Environment
- **Purpose:** Template name for OTP messages
- **Required:** ⚠️ Required if using Karzoun
- **Format:** Template name registered in Karzoun dashboard
- **Set Command:**
  ```bash
  bunx convex env set KARZOUN_OTP_TEMPLATE_NAME "otp_verification"
  ```

#### `KARZOUN_NEW_REQUEST_TEMPLATE`
- **Where:** Convex Environment
- **Purpose:** Template for rental request notifications
- **Required:** ❌ Optional
- **Default:** `"new_request_notif"`
- **Set Command:**
  ```bash
  bunx convex env set KARZOUN_NEW_REQUEST_TEMPLATE "new_request_notif"
  ```

#### `KARZOUN_INVOICE_TEMPLATE_NAME`
- **Where:** Convex Environment
- **Purpose:** Template for invoice delivery
- **Required:** ❌ Optional
- **Default:** `"invoice"`
- **Set Command:**
  ```bash
  bunx convex env set KARZOUN_INVOICE_TEMPLATE_NAME "invoice"
  ```

---

### 💳 Payment Gateway (Tap Payments)

#### `TAP_SECRET_KEY`
- **Where:** Convex Environment
- **Purpose:** Secret key for server-side payment processing
- **Required:** ✅ Yes (production)
- **Used For:**
  - Creating payment sessions
  - Webhook signature validation
  - Refund processing
- **Get Key:** https://dashboard.tap.company
- **Set Command:**
  ```bash
  bunx convex env set TAP_SECRET_KEY "sk_test_xxxxxxxxxxxx"
  ```

#### `NEXT_PUBLIC_TAP_PUBLISHABLE_KEY`
- **Where:** `.env.local` (Next.js)
- **Purpose:** Public key for client-side payment initialization
- **Required:** ✅ Yes (production)
- **Get Key:** https://dashboard.tap.company
- **Example:**
  ```env
  NEXT_PUBLIC_TAP_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
  ```

---

### 🗺️ Google Maps

#### `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Where:** `.env.local` (Next.js)
- **Purpose:** Google Maps API for location selection in shelf/branch creation
- **Required:** ✅ Yes (for map features)
- **Get Key:** https://console.cloud.google.com/google/maps-apis
- **Example:**
  ```env
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
  ```

---

### 🧾 Accounting Integration (Wafeq) - Optional

#### `WAFEQ_API_KEY`
- **Where:** Convex Environment
- **Purpose:** Wafeq accounting system API key
- **Required:** ❌ Optional (for accounting integration)
- **Set Command:**
  ```bash
  bunx convex env set WAFEQ_API_KEY "your-wafeq-api-key"
  ```

#### `WAFEQ_ACCOUNT_ID`
- **Where:** Convex Environment
- **Purpose:** Wafeq account identifier
- **Required:** ❌ Optional
- **Set Command:**
  ```bash
  bunx convex env set WAFEQ_ACCOUNT_ID "your-account-id"
  ```

#### `WAFEQ_TAX_RATE_ID`
- **Where:** Convex Environment
- **Purpose:** Tax rate configuration for invoices
- **Required:** ❌ Optional
- **Set Command:**
  ```bash
  bunx convex env set WAFEQ_TAX_RATE_ID "your-tax-rate-id"
  ```

---

### ⚙️ System Variables

#### `NODE_ENV`
- **Where:** Automatically set by Node.js/Bun
- **Purpose:** Controls development vs production behavior
- **Values:** `"development"` or `"production"`
- **Behavior:**
  - **Development:** OTPs logged to console, detailed error messages, lenient CSP
  - **Production:** OTPs sent via APIs, generic errors, strict security headers
- **Note:** You don't set this manually - it's set by your runtime

---

## Setup Instructions

### 1. Generate JWT Keys

Create the key generation script (if not exists):

```javascript
// scripts/generate-jwt-keys.mjs
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

console.log(`JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, " ")}"`);
console.log(`JWKS=${jwks}`);
```

Run it:
```bash
node scripts/generate-jwt-keys.mjs
```

Copy the output values to set in Convex.

### 2. Set Convex Environment Variables

**Minimum for Development:**
```bash
bunx convex env set JWT_PRIVATE_KEY "<value-from-step-1>"
bunx convex env set JWKS <value-from-step-1>
bunx convex env set SITE_URL "http://localhost:3000"
```

**Full Production Setup:**
Use the `convex-env-template.sh` script with all production values filled in.

### 3. Configure Next.js (.env.local)

Copy the example file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```env
CONVEX_DEPLOYMENT=dev:warmhearted-capybara-335
NEXT_PUBLIC_CONVEX_URL=https://warmhearted-capybara-335.convex.cloud
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_key
NEXT_PUBLIC_TAP_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
```

### 4. Verify Setup

Check Convex variables:
```bash
bunx convex env list
```

Should show at minimum:
- JWT_PRIVATE_KEY
- JWKS
- SITE_URL

### 5. Test

Start the dev server:
```bash
bun dev
```

Try logging in as admin:
- Email: `it@shibr.io`
- Password: `wwadnj0aw2nc@!!`

---

## Troubleshooting

### "Missing environment variable JWT_PRIVATE_KEY"
- **Solution:** Run the JWT key generation script and set both JWT_PRIVATE_KEY and JWKS in Convex

### OTPs not being sent in development
- **This is normal!** Check your console logs - OTPs are printed there instead
- Look for output like: `[CONVEX] [LOG] OTP CODE: 123456`

### Payment webhooks failing
- **Development:** Use webhook testing tools like ngrok or Convex webhook testing
- **Production:** Ensure TAP_SECRET_KEY is set and webhook URL is configured in Tap dashboard

### WhatsApp messages not sending
- **Development:** Messages are logged to console (unless you set KARZOUN variables)
- **Production:** Verify KARZOUN_API_TOKEN, KARZOUN_SENDER_ID, and templates are correct

---

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Never commit actual API keys** - Only templates
3. **Rotate keys regularly** - Especially JWT keys and API tokens
4. **Use different keys** - Development and production should have separate keys
5. **Restrict API key permissions** - Give minimum required access
6. **Monitor usage** - Watch for unexpected API calls

---

## Environment Variables Checklist

### Minimum for Development
- [ ] JWT_PRIVATE_KEY (Convex)
- [ ] JWKS (Convex)
- [ ] SITE_URL (Convex)
- [ ] NEXT_PUBLIC_CONVEX_URL (.env.local)

### Full Production Setup
- [ ] All development variables above
- [ ] RESEND_API_KEY (Convex)
- [ ] TAP_SECRET_KEY (Convex)
- [ ] NEXT_PUBLIC_TAP_PUBLISHABLE_KEY (.env.local)
- [ ] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (.env.local)
- [ ] KARZOUN variables (if using WhatsApp/SMS)
- [ ] WAFEQ variables (if using accounting integration)

---

## Quick Reference Table

| Variable | Location | Required | Has Default |
|----------|----------|----------|-------------|
| JWT_PRIVATE_KEY | Convex | ✅ | ❌ |
| JWKS | Convex | ✅ | ❌ |
| SITE_URL | Convex | ✅ | ❌ |
| RESEND_API_KEY | Convex | ⚠️ Prod | ❌ |
| KARZOUN_API_TOKEN | Convex | ⚠️ Prod | ❌ |
| KARZOUN_SENDER_ID | Convex | ⚠️ Prod | ❌ |
| KARZOUN_OTP_TEMPLATE_NAME | Convex | ⚠️ Prod | ❌ |
| TAP_SECRET_KEY | Convex | ⚠️ Prod | ❌ |
| NEXT_PUBLIC_CONVEX_URL | .env.local | ✅ | ❌ |
| NEXT_PUBLIC_TAP_PUBLISHABLE_KEY | .env.local | ⚠️ Prod | ❌ |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | .env.local | ✅ | ❌ |
| NODE_ENV | Auto | ✅ | ✅ |

---

For more information, see:
- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [Convex Environment Variables](https://docs.convex.dev/production/hosting/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
