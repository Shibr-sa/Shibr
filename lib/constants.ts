/**
 * Application-wide constants for consistent limits and patterns.
 * All numeric values use English/Western numerals (0-9).
 */

// ============================================
// String Length Limits
// ============================================

export const STRING_LIMITS = {
  // User & Authentication
  NAME_MIN: 2,
  NAME_MAX: 50,
  EMAIL_MIN: 5,
  EMAIL_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,

  // Store & Business
  STORE_NAME_MIN: 2,
  STORE_NAME_MAX: 100,
  COMMERCIAL_RECORD_LENGTH: 10,
  VAT_NUMBER_LENGTH: 15,
  ADDRESS_MIN: 5,
  ADDRESS_MAX: 200,

  // Shelf & Product
  SHELF_NAME_MIN: 2,
  SHELF_NAME_MAX: 100,
  BRANCH_NAME_MIN: 2,
  BRANCH_NAME_MAX: 100,
  PRODUCT_TYPE_MAX: 100,
  DESCRIPTION_MAX: 500,

  // Messages & Content
  MESSAGE_MAX: 1000,
  SEARCH_QUERY_MAX: 100,
  FILE_NAME_MAX: 255,

  // URLs & Technical
  URL_MAX: 2000,
  SLUG_MAX: 100,
} as const

// ============================================
// Numeric Limits
// ============================================

export const NUMERIC_LIMITS = {
  // Prices (in SAR)
  PRICE_MIN: 0,
  PRICE_MAX: 1000000,

  // Percentages
  PERCENTAGE_MIN: 0,
  PERCENTAGE_MAX: 100,
  DEFAULT_BRAND_SALES_COMMISSION: 8,
  DEFAULT_STORE_RENT_COMMISSION: 10,
  DEFAULT_MAX_DISCOUNT: 22,

  // Dimensions (in cm)
  DIMENSION_MIN: 1,
  DIMENSION_MAX: 1000,

  // Duration (in days)
  RENTAL_DURATION_MIN: 30,
  RENTAL_DURATION_MAX: 365,

  // Pagination
  PAGE_SIZE_DEFAULT: 10,
  PAGE_SIZE_MIN: 1,
  PAGE_SIZE_MAX: 100,

  // File Sizes (in bytes)
  FILE_SIZE_MAX: 10 * 1024 * 1024, // 10MB
  IMAGE_SIZE_MAX: 5 * 1024 * 1024, // 5MB
  DOCUMENT_SIZE_MAX: 10 * 1024 * 1024, // 10MB
} as const

// ============================================
// Regular Expression Patterns
// ============================================

export const PATTERNS = {
  // Names & Text
  NAME: /^[a-zA-Z\s\u0600-\u06FF]+$/, // English & Arabic letters only
  STORE_NAME: /^[a-zA-Z0-9\s\u0600-\u06FF\-\.]+$/, // Alphanumeric + Arabic + dash/dot
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_WITH_SPACES: /^[a-zA-Z0-9\s]+$/,

  // Numbers (English numerals only)
  DIGITS_ONLY: /^\d+$/,
  DECIMAL_NUMBER: /^\d+(\.\d{1,2})?$/, // Up to 2 decimal places
  PRICE: /^\d+(\.\d{1,2})?$/, // Price format
  PERCENTAGE: /^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/, // 0-100 with decimals

  // Phone Numbers
  SAUDI_PHONE: /^(05\d{8}|5\d{8}|\+9665\d{8}|9665\d{8})$/,
  INTERNATIONAL_PHONE: /^\+?[\d\s\-\(\)]{10,20}$/,

  // Business Identifiers
  COMMERCIAL_RECORD: /^\d{10}$/,
  VAT_NUMBER: /^\d{15}$/,

  // Dates (Gregorian only, YYYY-MM-DD format)
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  DATE_TIME_ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,

  // Web & Technical
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  // Security
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  NO_SPECIAL_CHARS: /^[a-zA-Z0-9\s\u0600-\u06FF]*$/,
  NO_HTML_TAGS: /^[^<>]*$/,
} as const

// ============================================
// Date & Time Constants
// ============================================

export const DATE_FORMATS = {
  // Display formats (using English numerals)
  DISPLAY_SHORT: 'dd/MM/yyyy', // 15/01/2024
  DISPLAY_LONG: 'd MMM yyyy', // 15 Jan 2024
  DISPLAY_FULL: 'd MMMM yyyy', // 15 January 2024

  // Time formats
  TIME_12H: 'h:mm a', // 3:30 PM
  TIME_24H: 'HH:mm', // 15:30

  // Combined formats
  DATETIME_SHORT: 'dd/MM/yyyy HH:mm',
  DATETIME_LONG: 'd MMM yyyy, h:mm a',

  // ISO format for storage
  ISO: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
} as const

// ============================================
// Saudi Cities
// ============================================

export const SAUDI_CITIES = [
  { value: 'riyadh', nameEn: 'Riyadh', nameAr: 'الرياض', lat: 24.7136, lng: 46.6753 },
  { value: 'jeddah', nameEn: 'Jeddah', nameAr: 'جدة', lat: 21.5433, lng: 39.1728 },
  { value: 'mecca', nameEn: 'Mecca', nameAr: 'مكة المكرمة', lat: 21.4225, lng: 39.8262 },
  { value: 'medina', nameEn: 'Medina', nameAr: 'المدينة المنورة', lat: 24.5247, lng: 39.5692 },
  { value: 'dammam', nameEn: 'Dammam', nameAr: 'الدمام', lat: 26.3927, lng: 49.9777 },
  { value: 'khobar', nameEn: 'Khobar', nameAr: 'الخبر', lat: 26.2172, lng: 50.1971 },
  { value: 'dhahran', nameEn: 'Dhahran', nameAr: 'الظهران', lat: 26.2361, lng: 50.0393 },
  { value: 'taif', nameEn: 'Taif', nameAr: 'الطائف', lat: 21.4373, lng: 40.5128 },
  { value: 'buraidah', nameEn: 'Buraidah', nameAr: 'بريدة', lat: 26.3266, lng: 43.9750 },
  { value: 'tabuk', nameEn: 'Tabuk', nameAr: 'تبوك', lat: 28.3835, lng: 36.5662 },
  { value: 'hail', nameEn: 'Hail', nameAr: 'حائل', lat: 27.5219, lng: 41.6907 },
  { value: 'hafar-al-batin', nameEn: 'Hafar Al-Batin', nameAr: 'حفر الباطن', lat: 28.4337, lng: 45.9601 },
  { value: 'jubail', nameEn: 'Jubail', nameAr: 'الجبيل', lat: 27.0046, lng: 49.6460 },
  { value: 'najran', nameEn: 'Najran', nameAr: 'نجران', lat: 17.5656, lng: 44.2289 },
  { value: 'abha', nameEn: 'Abha', nameAr: 'أبها', lat: 18.2164, lng: 42.5053 },
  { value: 'khamis-mushait', nameEn: 'Khamis Mushait', nameAr: 'خميس مشيط', lat: 18.3060, lng: 42.7297 },
  { value: 'jazan', nameEn: 'Jazan', nameAr: 'جازان', lat: 16.8892, lng: 42.5511 },
  { value: 'yanbu', nameEn: 'Yanbu', nameAr: 'ينبع', lat: 24.0893, lng: 38.0618 },
  { value: 'al-qatif', nameEn: 'Al-Qatif', nameAr: 'القطيف', lat: 26.5195, lng: 50.0240 },
  { value: 'unaizah', nameEn: 'Unaizah', nameAr: 'عنيزة', lat: 26.0844, lng: 43.9935 },
  { value: 'arar', nameEn: 'Arar', nameAr: 'عرعر', lat: 30.9753, lng: 41.0381 },
  { value: 'sakaka', nameEn: 'Sakaka', nameAr: 'سكاكا', lat: 29.9697, lng: 40.2064 },
  { value: 'al-kharj', nameEn: 'Al-Kharj', nameAr: 'الخرج', lat: 24.1556, lng: 47.3120 },
  { value: 'al-ahsa', nameEn: 'Al-Ahsa', nameAr: 'الأحساء', lat: 25.3487, lng: 49.5856 },
] as const

// ============================================
// Store Types
// ============================================

export const STORE_TYPES = [
  { value: 'supermarket', nameEn: 'Supermarket', nameAr: 'سوبر ماركت' },
  { value: 'hypermarket', nameEn: 'Hypermarket', nameAr: 'هايبر ماركت' },
  { value: 'convenience', nameEn: 'Convenience Store', nameAr: 'بقالة' },
  { value: 'pharmacy', nameEn: 'Pharmacy', nameAr: 'صيدلية' },
  { value: 'electronics', nameEn: 'Electronics Store', nameAr: 'متجر إلكترونيات' },
  { value: 'clothing', nameEn: 'Clothing Store', nameAr: 'متجر ملابس' },
  { value: 'sports', nameEn: 'Sports Store', nameAr: 'متجر رياضي' },
  { value: 'bookstore', nameEn: 'Bookstore', nameAr: 'مكتبة' },
  { value: 'hardware', nameEn: 'Hardware Store', nameAr: 'متجر أدوات' },
  { value: 'beauty', nameEn: 'Beauty Store', nameAr: 'متجر تجميل' },
  { value: 'toys', nameEn: 'Toy Store', nameAr: 'متجر ألعاب' },
  { value: 'other', nameEn: 'Other', nameAr: 'أخرى' },
] as const

// ============================================
// Product Categories
// ============================================

export const PRODUCT_CATEGORIES = [
  { value: 'food_beverages', nameEn: 'Food & Beverages', nameAr: 'أطعمة ومشروبات' },
  { value: 'health_beauty', nameEn: 'Health & Beauty', nameAr: 'صحة وجمال' },
  { value: 'fashion', nameEn: 'Fashion', nameAr: 'أزياء' },
  { value: 'electronics', nameEn: 'Electronics', nameAr: 'إلكترونيات' },
  { value: 'home_living', nameEn: 'Home & Living', nameAr: 'منزل ومعيشة' },
  { value: 'kids_baby', nameEn: 'Kids & Baby', nameAr: 'أطفال ورضع' },
  { value: 'sports_fitness', nameEn: 'Sports & Fitness', nameAr: 'رياضة ولياقة' },
  { value: 'books_stationery', nameEn: 'Books & Stationery', nameAr: 'كتب وقرطاسية' },
  { value: 'other', nameEn: 'Other', nameAr: 'أخرى' },
] as const

// ============================================
// Store Business Categories - Arabic
// ============================================

export const STORE_BUSINESS_CATEGORIES_AR = [
  // Retail & Trade
  'البقالات والسوبر ماركت', // Grocery stores and supermarkets
  'المتاجر الإلكترونية', // Electronics stores
  'متاجر الملابس والأزياء', // Clothing and fashion stores
  'متاجر الأحذية', // Shoe stores
  'متاجر الأدوات المنزلية', // Home appliances stores
  'متاجر الأثاث', // Furniture stores
  'متاجر الأدوات والمعدات', // Tools and equipment stores
  'مكتبات وقرطاسية', // Bookstores and stationery

  // Food & Beverages
  'مطاعم ومقاهي', // Restaurants and cafes
  'متاجر المواد الغذائية', // Food stores
  'مخابز ومعجنات', // Bakeries and pastries
  'جزارات ولحوم', // Butcher shops
  'متاجر الخضار والفواكه', // Fruits and vegetables stores

  // Health & Beauty
  'صيدليات', // Pharmacies
  'مراكز التجميل', // Beauty centers
  'متاجر مستحضرات التجميل', // Cosmetics stores
  'عيادات طبية', // Medical clinics
  'مختبرات طبية', // Medical laboratories

  // Services
  'خدمات الصيانة والإصلاح', // Maintenance and repair services
  'خدمات النظافة', // Cleaning services
  'خدمات النقل والتوصيل', // Transportation and delivery services
  'خدمات التعليم', // Education services
  'مكاتب محاسبة', // Accounting offices

  // Technology & Communication
  'متاجر الهواتف والإكسسوارات', // Mobile phones and accessories stores
  'مراكز صيانة الهواتف', // Mobile phone repair centers
  'متاجر الحواسيب والأجهزة', // Computer and device stores
  'شركات الاتصالات', // Telecommunications companies

  // Automotive
  'معارض السيارات', // Car showrooms
  'ورش صيانة السيارات', // Car repair shops
  'متاجر قطع غيار السيارات', // Auto parts stores
  'محطات الوقود', // Gas stations

  // Entertainment & Sports
  'متاجر الألعاب والترفيه', // Toys and entertainment stores
  'متاجر المعدات الرياضية', // Sports equipment stores
  'صالات الألعاب الرياضية', // Sports halls
  'مراكز الترفيه', // Entertainment centers

  // Real Estate & Construction
  'مكاتب عقارية', // Real estate offices
  'متاجر مواد البناء', // Construction materials stores
  'ورش البناء والمقاولات', // Construction and contracting workshops

  // Other Services
  'مكاتب استشارات', // Consulting offices
  'مكاتب محاماة', // Law offices
  'مكاتب تأمين', // Insurance offices
  'متاجر الهدايا والهدايا التذكارية', // Gift and souvenir stores
  'خدمات أخرى', // Other services
] as const

// ============================================
// Store Business Categories - English
// ============================================

export const STORE_BUSINESS_CATEGORIES_EN = [
  'Supermarket',
  'Electronics Store',
  'Clothing Store',
  'Shoe Store',
  'Home Appliances Store',
  'Furniture Store',
  'Hardware Store',
  'Bookstore & Stationery',
  'Restaurant & Cafe',
  'Food Store',
  'Bakery & Pastry',
  'Butcher Shop',
  'Fruits & Vegetables Store',
  'Pharmacy',
  'Beauty Center',
  'Cosmetics Store',
  'Medical Clinic',
  'Medical Laboratory',
  'Maintenance & Repair Services',
  'Cleaning Services',
  'Transportation & Delivery Services',
  'Education Services',
  'Accounting Office',
  'Mobile Phones & Accessories Store',
  'Mobile Phone Repair Center',
  'Computer & Device Store',
  'Telecommunications Company',
  'Car Showroom',
  'Car Repair Shop',
  'Auto Parts Store',
  'Gas Station',
  'Toys & Entertainment Store',
  'Sports Equipment Store',
  'Sports Hall',
  'Entertainment Center',
  'Real Estate Office',
  'Construction Materials Store',
  'Construction & Contracting Workshop',
  'Consulting Office',
  'Law Office',
  'Insurance Office',
  'Gift & Souvenir Store',
  'Other Services'
] as const

// ============================================
// Brand Business Categories - Arabic
// ============================================

export const BRAND_BUSINESS_CATEGORIES_AR = [
  // Consumer Products
  'منتجات إلكترونية وتقنية', // Electronics and technology products
  'ملابس وأزياء', // Clothing and fashion
  'أحذية وإكسسوارات', // Shoes and accessories
  'منتجات تجميل وصحة', // Beauty and health products
  'منتجات منزلية وأدوات', // Home and tools products
  'أثاث وديكور', // Furniture and decor
  'ألعاب وترفيه', // Toys and entertainment
  'منتجات رياضية', // Sports products

  // Food & Beverages
  'منتجات غذائية ومشروبات', // Food and beverages
  'منتجات عضوية وبيئية', // Organic and eco-friendly products
  'مكملات غذائية', // Dietary supplements
  'منتجات أطفال', // Baby products

  // Health & Wellness
  'منتجات العناية الشخصية', // Personal care products
  'مستحضرات تجميل', // Cosmetics
  'منتجات العناية بالبشرة', // Skincare products
  'منتجات العناية بالشعر', // Hair care products

  // Technology & Gadgets
  'هواتف وإكسسوارات', // Phones and accessories
  'حواسيب وأجهزة', // Computers and devices
  'أجهزة منزلية ذكية', // Smart home devices
  'إكسسوارات تقنية', // Tech accessories

  // Fashion & Lifestyle
  'ملابس رياضية', // Sportswear
  'إكسسوارات الموضة', // Fashion accessories
  'منتجات العناية بالملابس', // Clothing care products
  'منتجات الحرف اليدوية', // Handmade products

  // Other Categories
  'منتجات موسمية', // Seasonal products
  'منتجات خاصة', // Niche products
  'منتجات مستدامة', // Sustainable products
  'منتجات أخرى' // Other products
] as const

// ============================================
// Brand Business Categories - English
// ============================================

export const BRAND_BUSINESS_CATEGORIES_EN = [
  'Electronics & Technology',
  'Clothing & Fashion',
  'Shoes & Accessories',
  'Beauty & Health Products',
  'Home & Tools',
  'Furniture & Decor',
  'Toys & Entertainment',
  'Sports Products',
  'Food & Beverages',
  'Organic & Eco-friendly Products',
  'Dietary Supplements',
  'Baby Products',
  'Personal Care Products',
  'Cosmetics',
  'Skincare Products',
  'Hair Care Products',
  'Phones & Accessories',
  'Computers & Devices',
  'Smart Home Devices',
  'Tech Accessories',
  'Sportswear',
  'Fashion Accessories',
  'Clothing Care Products',
  'Handmade Products',
  'Seasonal Products',
  'Niche Products',
  'Sustainable Products',
  'Other Products'
] as const

// ============================================
// Combined Business Categories (for backward compatibility)
// ============================================

export const SAUDI_BUSINESS_CATEGORIES = [
  ...STORE_BUSINESS_CATEGORIES_AR,
  ...STORE_BUSINESS_CATEGORIES_EN,
  ...BRAND_BUSINESS_CATEGORIES_AR,
  ...BRAND_BUSINESS_CATEGORIES_EN
] as const

// ============================================
// Status Types
// ============================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const SHELF_STATUS = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
  UNAVAILABLE: 'unavailable',
} as const

// ============================================
// File Types & Extensions
// ============================================

export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
} as const

export const ALLOWED_FILE_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  DOCUMENTS: ['.pdf', '.doc', '.docx'],
  SPREADSHEETS: ['.xls', '.xlsx'],
} as const

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  // Generic
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  TOO_SHORT: 'Too short',
  TOO_LONG: 'Too long',

  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  PASSWORD_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password must contain uppercase, lowercase, number, and special character',

  // Files
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',

  // Network
  NETWORK_ERROR: 'Network error. Please try again',
  SERVER_ERROR: 'Server error. Please try again later',

  // Validation
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_DATE: 'Invalid date',
  DATE_IN_PAST: 'Date cannot be in the past',
  END_BEFORE_START: 'End date must be after start date',
} as const

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
  SAVED: 'Saved successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SENT: 'Sent successfully',
  UPLOADED: 'Uploaded successfully',
  REGISTERED: 'Registration successful',
  LOGGED_IN: 'Login successful',
  LOGGED_OUT: 'Logout successful',
} as const

// ============================================
// Currency & Locale
// ============================================

export const CURRENCY = {
  CODE: 'SAR',
  SYMBOL_EN: 'SAR',
  SYMBOL_AR: 'ر.س',
  DECIMAL_PLACES: 2,
} as const

export const LOCALE = {
  // Always use en-US for number formatting to ensure English numerals
  NUMBERS: 'en-US',
  // Always use Gregorian calendar with English numerals for dates
  DATE: 'en-US',
} as const