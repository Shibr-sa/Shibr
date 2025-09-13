/**
 * Saudi Arabia IBAN Validator
 * Saudi IBAN format: SA + 2 check digits + 2 bank code + 18 account number
 * Total length: 24 characters
 */

// List of valid Saudi bank codes
export const SAUDI_BANK_CODES: Record<string, string> = {
  "10": "National Commercial Bank (NCB/SNB)",
  "20": "Riyadh Bank",
  "30": "Arab National Bank (ANB)",
  "40": "Saudi British Bank (SABB)",
  "45": "Saudi Hollandi Bank (Alawwal Bank)",
  "50": "Banque Saudi Fransi",
  "55": "Bank Aljazira",
  "60": "Saudi Investment Bank (SAIB)",
  "65": "Bank Albilad",
  "80": "Al Rajhi Bank",
  "85": "Alinma Bank",
  "90": "Gulf International Bank (GIB)",
  "95": "Emirates NBD",
  "76": "Bank Muscat",
  "71": "National Bank of Kuwait (NBK)",
  "75": "National Bank of Bahrain (NBB)",
  "15": "Al Ahli Bank (merged with NCB)",
  "25": "JP Morgan Chase",
  "35": "BNP Paribas",
  "84": "Standard Chartered Bank"
}

// Complete list of Saudi banks for selection
export const SAUDI_BANKS = [
  { code: "80", name: "Al Rajhi Bank", nameAr: "مصرف الراجحي" },
  { code: "10", name: "Saudi National Bank (SNB)", nameAr: "البنك الأهلي السعودي" },
  { code: "85", name: "Alinma Bank", nameAr: "مصرف الإنماء" },
  { code: "20", name: "Riyadh Bank", nameAr: "بنك الرياض" },
  { code: "40", name: "Saudi British Bank (SABB)", nameAr: "البنك السعودي البريطاني (ساب)" },
  { code: "50", name: "Banque Saudi Fransi", nameAr: "البنك السعودي الفرنسي" },
  { code: "30", name: "Arab National Bank (ANB)", nameAr: "البنك العربي الوطني" },
  { code: "55", name: "Bank Aljazira", nameAr: "بنك الجزيرة" },
  { code: "60", name: "Saudi Investment Bank (SAIB)", nameAr: "البنك السعودي للاستثمار" },
  { code: "65", name: "Bank Albilad", nameAr: "بنك البلاد" },
  { code: "90", name: "Gulf International Bank (GIB)", nameAr: "بنك الخليج الدولي" },
  { code: "95", name: "Emirates NBD", nameAr: "بنك الإمارات دبي الوطني" },
  { code: "76", name: "Bank Muscat", nameAr: "بنك مسقط" },
  { code: "71", name: "National Bank of Kuwait (NBK)", nameAr: "بنك الكويت الوطني" },
  { code: "75", name: "National Bank of Bahrain (NBB)", nameAr: "بنك البحرين الوطني" },
  { code: "84", name: "Standard Chartered Bank", nameAr: "بنك ستاندرد تشارترد" },
  { code: "25", name: "JP Morgan Chase", nameAr: "جي بي مورغان تشيس" },
  { code: "35", name: "BNP Paribas", nameAr: "بي إن بي باريبا" }
]

/**
 * Validates a Saudi Arabian IBAN
 * @param iban The IBAN to validate
 * @returns Object with validation result and details
 */
export function validateSaudiIBAN(iban: string): {
  isValid: boolean
  error?: string
  bankName?: string
  bankCode?: string
  formattedIBAN?: string
} {
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()

  // Check if it starts with SA
  if (!cleanIBAN.startsWith('SA')) {
    return {
      isValid: false,
      error: 'IBAN must start with SA for Saudi Arabia'
    }
  }

  // Check length (must be exactly 24 characters)
  if (cleanIBAN.length !== 24) {
    return {
      isValid: false,
      error: 'Saudi IBAN must be exactly 24 characters'
    }
  }

  // Check if all characters after SA are digits
  const ibanDigits = cleanIBAN.substring(2)
  if (!/^\d+$/.test(ibanDigits)) {
    return {
      isValid: false,
      error: 'IBAN must contain only digits after SA'
    }
  }

  // Extract bank code (characters 5-6)
  const bankCode = cleanIBAN.substring(4, 6)
  const bankName = SAUDI_BANK_CODES[bankCode]

  if (!bankName) {
    return {
      isValid: false,
      error: 'Invalid bank code in IBAN'
    }
  }

  // Validate IBAN check digits using mod-97 algorithm
  const isValidChecksum = validateIBANChecksum(cleanIBAN)

  if (!isValidChecksum) {
    return {
      isValid: false,
      error: 'Invalid IBAN checksum'
    }
  }

  // Format IBAN for display (SA## #### #### #### #### ####)
  const formattedIBAN = cleanIBAN.replace(/(.{4})/g, '$1 ').trim()

  return {
    isValid: true,
    bankName,
    bankCode,
    formattedIBAN
  }
}

/**
 * Validates IBAN checksum using mod-97 algorithm
 * @param iban The IBAN to validate
 * @returns true if checksum is valid
 */
function validateIBANChecksum(iban: string): boolean {
  // Move first 4 characters to the end
  const rearranged = iban.substring(4) + iban.substring(0, 4)

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  let numericString = ''
  for (const char of rearranged) {
    if (/[A-Z]/.test(char)) {
      numericString += (char.charCodeAt(0) - 55).toString()
    } else {
      numericString += char
    }
  }

  // Calculate mod 97 using string arithmetic to handle large numbers
  let remainder = ''
  for (const digit of numericString) {
    remainder = (parseInt(remainder + digit) % 97).toString()
  }

  return parseInt(remainder) === 1
}

/**
 * Formats an IBAN for display
 * @param iban The IBAN to format
 * @returns Formatted IBAN with spaces
 */
export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase()
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * Gets bank name from IBAN
 * @param iban The IBAN to extract bank from
 * @returns Bank name or null
 */
export function getBankFromIBAN(iban: string): string | null {
  const validation = validateSaudiIBAN(iban)
  return validation.bankName || null
}