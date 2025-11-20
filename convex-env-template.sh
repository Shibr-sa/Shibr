#!/bin/bash

###############################################################################
# Convex Environment Variables Setup Script
#
# This script sets all required environment variables for the Shibr platform
# in your Convex deployment.
#
# INSTRUCTIONS:
# 1. Copy this file: cp convex-env-template.sh convex-env-setup.sh
# 2. Edit convex-env-setup.sh and replace all <PLACEHOLDER> values
# 3. Make executable: chmod +x convex-env-setup.sh
# 4. Run: ./convex-env-setup.sh
#
# IMPORTANT: Never commit the edited file with real values!
# Add to .gitignore: convex-env-setup.sh
###############################################################################

set -e  # Exit on error

echo "=========================================="
echo "Shibr - Convex Environment Setup"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if bunx is available
if ! command -v bunx &> /dev/null; then
    echo -e "${RED}Error: bunx is not installed${NC}"
    echo "Install Bun from https://bun.sh"
    exit 1
fi

echo -e "${YELLOW}Important: Make sure you've generated JWT keys first!${NC}"
echo "Run: node scripts/generate-jwt-keys.mjs"
echo ""
read -p "Have you generated JWT keys? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please generate JWT keys first and then run this script again."
    exit 1
fi

###############################################################################
# CRITICAL VARIABLES - REQUIRED FOR AUTHENTICATION
###############################################################################

echo ""
echo -e "${GREEN}Setting critical authentication variables...${NC}"

# JWT Private Key (from scripts/generate-jwt-keys.mjs output)
JWT_PRIVATE_KEY="<PASTE_ENTIRE_JWT_PRIVATE_KEY_HERE>"

# JWKS (from scripts/generate-jwt-keys.mjs output)
JWKS='<PASTE_ENTIRE_JWKS_JSON_HERE>'

# Site URL
SITE_URL="<http://localhost:3000 OR https://yourdomain.com>"

if [[ "$JWT_PRIVATE_KEY" == *"<PASTE"* ]]; then
    echo -e "${RED}Error: JWT_PRIVATE_KEY not configured${NC}"
    echo "Please edit this script and paste the JWT_PRIVATE_KEY value"
    exit 1
fi

bunx convex env set JWT_PRIVATE_KEY "$JWT_PRIVATE_KEY"
echo "✓ JWT_PRIVATE_KEY set"

bunx convex env set JWKS "$JWKS"
echo "✓ JWKS set"

bunx convex env set SITE_URL "$SITE_URL"
echo "✓ SITE_URL set"

###############################################################################
# EMAIL SERVICE - Required for production, optional for development
###############################################################################

echo ""
echo -e "${GREEN}Setting email service variables...${NC}"

# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY="<YOUR_RESEND_API_KEY>"

if [[ "$RESEND_API_KEY" != *"<YOUR"* ]]; then
    bunx convex env set RESEND_API_KEY "$RESEND_API_KEY"
    echo "✓ RESEND_API_KEY set"
else
    echo -e "${YELLOW}⚠ RESEND_API_KEY not set (OTPs will be logged to console in development)${NC}"
fi

###############################################################################
# MOBILE MESSAGING - Karzoun WhatsApp/SMS
# Required for production phone verification, optional for development
###############################################################################

echo ""
echo -e "${GREEN}Setting mobile messaging variables...${NC}"

# Karzoun API credentials
KARZOUN_API_TOKEN="<YOUR_KARZOUN_API_TOKEN>"
KARZOUN_SENDER_ID="<YOUR_KARZOUN_SENDER_ID>"
KARZOUN_OTP_TEMPLATE_NAME="<YOUR_OTP_TEMPLATE_NAME>"

# Optional templates (have defaults)
KARZOUN_NEW_REQUEST_TEMPLATE="new_request_notif"
KARZOUN_INVOICE_TEMPLATE_NAME="invoice"

if [[ "$KARZOUN_API_TOKEN" != *"<YOUR"* ]]; then
    bunx convex env set KARZOUN_API_TOKEN "$KARZOUN_API_TOKEN"
    echo "✓ KARZOUN_API_TOKEN set"

    bunx convex env set KARZOUN_SENDER_ID "$KARZOUN_SENDER_ID"
    echo "✓ KARZOUN_SENDER_ID set"

    bunx convex env set KARZOUN_OTP_TEMPLATE_NAME "$KARZOUN_OTP_TEMPLATE_NAME"
    echo "✓ KARZOUN_OTP_TEMPLATE_NAME set"

    bunx convex env set KARZOUN_NEW_REQUEST_TEMPLATE "$KARZOUN_NEW_REQUEST_TEMPLATE"
    echo "✓ KARZOUN_NEW_REQUEST_TEMPLATE set"

    bunx convex env set KARZOUN_INVOICE_TEMPLATE_NAME "$KARZOUN_INVOICE_TEMPLATE_NAME"
    echo "✓ KARZOUN_INVOICE_TEMPLATE_NAME set"
else
    echo -e "${YELLOW}⚠ KARZOUN variables not set (phone OTPs will be logged to console in development)${NC}"
fi

###############################################################################
# PAYMENT GATEWAY - Tap Payments
# Required for production
###############################################################################

echo ""
echo -e "${GREEN}Setting payment gateway variables...${NC}"

# Tap Payments Secret Key (from https://dashboard.tap.company)
TAP_SECRET_KEY="<YOUR_TAP_SECRET_KEY>"

if [[ "$TAP_SECRET_KEY" != *"<YOUR"* ]]; then
    bunx convex env set TAP_SECRET_KEY "$TAP_SECRET_KEY"
    echo "✓ TAP_SECRET_KEY set"
else
    echo -e "${YELLOW}⚠ TAP_SECRET_KEY not set (required for payments in production)${NC}"
fi

###############################################################################
# ACCOUNTING INTEGRATION - Wafeq (Optional)
###############################################################################

echo ""
echo -e "${GREEN}Setting accounting integration variables (optional)...${NC}"

# Wafeq API credentials (optional)
WAFEQ_API_KEY="<YOUR_WAFEQ_API_KEY>"
WAFEQ_ACCOUNT_ID="<YOUR_WAFEQ_ACCOUNT_ID>"
WAFEQ_TAX_RATE_ID="<YOUR_WAFEQ_TAX_RATE_ID>"

if [[ "$WAFEQ_API_KEY" != *"<YOUR"* ]]; then
    bunx convex env set WAFEQ_API_KEY "$WAFEQ_API_KEY"
    echo "✓ WAFEQ_API_KEY set"

    bunx convex env set WAFEQ_ACCOUNT_ID "$WAFEQ_ACCOUNT_ID"
    echo "✓ WAFEQ_ACCOUNT_ID set"

    bunx convex env set WAFEQ_TAX_RATE_ID "$WAFEQ_TAX_RATE_ID"
    echo "✓ WAFEQ_TAX_RATE_ID set"
else
    echo -e "${YELLOW}⚠ WAFEQ variables not set (optional - only if using accounting integration)${NC}"
fi

###############################################################################
# VERIFICATION
###############################################################################

echo ""
echo "=========================================="
echo -e "${GREEN}Environment variables set successfully!${NC}"
echo "=========================================="
echo ""
echo "Verifying setup..."
echo ""

bunx convex env list

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify the environment variables above are correct"
echo "2. Make sure your .env.local file is configured (see .env.example)"
echo "3. Start your development server: bun dev"
echo "4. Test admin login at /admin-dashboard"
echo "   - Email: it@shibr.io"
echo "   - Password: wwadnj0aw2nc@!!"
echo ""
echo "For more information, see ENVIRONMENT_VARIABLES.md"
echo ""
