"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "ar" | "en"
type Direction = "rtl" | "ltr"

interface LanguageContextType {
  language: Language
  direction: Direction
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation objects
const translations = {
  ar: {
    // Common
    "common.shibr": "Shibr",
    "common.search": "بحث",
    "common.save": "حفظ",
    "common.language.arabic": "العربية",
    "common.language.english": "English",
    "common.loading": "جاري التحميل...",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.view": "عرض",
    "common.upload": "رفع",
    "common.loading": "جاري التحميل...",
    "common.submit": "إرسال",
    "common.back": "العودة",
    "common.next": "التالي",
    "common.previous": "السابق",

    // Navigation
    "nav.home": "الرئيسية",
    "nav.products": "منتجاتنا",
    "nav.about": "من نحن",
    "nav.services": "الخدمات",
    "nav.contact": "تواصل معنا",
    "nav.blog": "المدونة",
    "nav.signin": "تسجيل الدخول",
    "nav.marketplace": "السوق",
    "nav.dashboard": "لوحة التحكم",
    "nav.navigation": "التنقل",
    "nav.questions": "المسائل والأجوبة",
    "nav.why_us": "لماذا نحن",

    // Dashboard Navigation
    "dashboard.home": "الرئيسية",
    "dashboard.products": "المنتجات",
    "dashboard.shelves": "الرفوف",
    "dashboard.orders": "الطلبات",
    "dashboard.settings": "الإعدادات",
    "dashboard.profile": "الملف الشخصي",
    "dashboard.posts": "المنشورات",
    "dashboard.stores": "المتاجر",
    "dashboard.payments": "المدفوعات",
    "dashboard.logout": "تسجيل الخروج",
    "dashboard.brand": "لوحة العلامة التجارية",
    "dashboard.store": "لوحة المتجر",
    "dashboard.admin": "لوحة المدير",

    // Dashboard Home Page
    "dashboard.welcome": "مرحبا بك في لوحة التحكم الخاصة بك",
    "dashboard.complete_data": "استكمال البيانات",
    "dashboard.start_displaying_shelves": "ابدأ في عرض رفوفك",
    "dashboard.thanks_for_registering": "شكرا لتسجيلك معنا",
    "dashboard.complete_data_description": "يجب عليك ان تكمل ادخال بياناتك للتمكن من عرض رفوفك للإيجار.",
    "dashboard.incomplete_profile_warning": "تحذير: ملفك الشخصي غير مكتمل",
    "dashboard.complete_profile_now": "أكمل الملف الآن",
    "dashboard.manage_store_starts_here": "إدارة محلك تبدأ من هنا",
    "dashboard.display_shelf_now": "اعرض رف الآن",
    "dashboard.monitor_performance_description": "راقب أدائك، اعرض رفوفك للتأجير، وابدأ في زيادة دخلك مع Shelfy.",
    "dashboard.currently_rented_brands": "عدد العلامات المؤجرة حاليا",
    "dashboard.total_sales": "إجمالي المبيعات",
    "dashboard.incoming_orders": "الطلبات الواردة",
    "dashboard.increase_from_last_month": "+20.1% من الشهر الماضي",
    "dashboard.new_rental_requests": "طلبات الإيجار الجديدة",
    "dashboard.see_more": "رؤية المزيد",
    "dashboard.no_rental_requests": "لا يوجد لديك طلبات للإيجار",
    "dashboard.your_shelves": "رفوفك",
    "dashboard.no_shelves_displayed": "ليس لديك رفوف معروضه في الوقت الحالي",

    // Shelves Page
    "shelves.title": "إدارة الرفوف",
    "shelves.description": "تأكد للمساحات المعروضة في فروعك",
    "shelves.my_shelves": "رفوفك",
    "shelves.manage_description":
      "قم بإدارة رفوفك بسهولة عبر جميع الفروع تابع حالتها، المؤجرين، ومواعيد التحصيل في مكان واحد",
    "shelves.add_shelf": "اعرض رف الآن",
    "shelves.search_placeholder": "ابحث بإسم المؤجر أو مدينة الفرع ...",
    "shelves.all": "الكل",
    "shelves.available": "الرفوف المتاحة",
    "shelves.rented": "الرفوف المؤجرة",
    "shelves.maintenance": "صيانة",
    "shelves.available_shelves": "الرفوف المتاحة",
    "shelves.total_sales": "إجمالي المبيعات",
    "shelves.total_rented_shelves": "إجمالي الرفوف المؤجرة",

    // Landing Page
    "hero.title": "منصة ذكية تربط بين المتاجر",
    "hero.highlight": "الواقعية والإلكترونية",
    "hero.description":
      "نتطلع إلى مساعدة التجار الراغبين في المتاجر الإلكترونية والمتاجر التجارية الموجودة من خلال نظام واحد وتوفير خدمات وحلول متكاملة لإدارة المخزون وتحديد تحويل المبيعات عبر منصات إلكترونية متعددة",
    "hero.start_now": "ابدأ الآن",
    "hero.learn_more": "تعلم المزيد",
    
    // Features
    "features.title": "ميزاتنا",
    "features.subtitle": "اكتشف كيف تساعدك Shibr في تحقيق أهدافك التجارية",
    "features.clear_rights.title": "حقوق واضحة لكل الأطراف",
    "features.clear_rights.description": "كل منتج مربوط بكود QR خاص، يضمن تتبع كل عملية شراء بدقة، ويعطي كل طرف حقه من العمولة أو الإيراد.",
    "features.empty_spaces.title": "تحويل المساحات الفارغة إلى دخل",
    "features.empty_spaces.description": "لو عندك رف، جدار أو زاوية غير مستخدمة.. Shelfy تساعدك تأجرها وتحقق منها دخل شهري أو نسبة من المبيعات بكل سهولة.",
    "features.real_reach.title": "وصول حقيقي بدون فتح فرع",
    "features.real_reach.description": "لأصحاب المتاجر الإلكترونية، تقدر تحط منتجاتك في أحياء ومدن مختلفة بدون ما تفتح فرع أو توظف أحد.",
    "features.flexible_rental.title": "نظام تأجير مرن",
    "features.flexible_rental.description": "اختر طريقة الدفع المناسبة لك: مبلغ شهري، نسبة من المبيعات، أو مزيج بينهم.. وأنت المتحكم في الشروط.",
    
    // FAQ
    "faq.title": "الأسئلة الشائعة",
    "faq.subtitle": "إجابات على أكثر الأسئلة شيوعاً حول منصة Shibr",
    "faq.q1": "هل Shelfy تأخذ عمولة على كل عملية؟",
    "faq.a1": "نعم ، Shelfy مجرد منصة وسيطة. الاتفاق المالي بالكامل بين صاحب المحل وصاحب المتجر، والمنصة تاخذ نسبة بسيطه.",
    "faq.q2": "هل فيه عقد بين الطرفين؟",
    "faq.a2": "لا يوجد",
    "faq.q3": "كيف يتم تتبع المبيعات؟",
    "faq.a3": "لا يوجد",
    "faq.q4": "هل أقدر أغيّر شروط الإيجار بعد إضافة الرف؟",
    "faq.a4": "لا يوجد",
    "faq.q5": "هل أقدر أستأجر أكثر من محل في نفس الوقت؟",
    "faq.a5": "لا يوجد",
    
    // Footer
    "footer.contact": "تواصل معنا",
    "footer.phone": "+966 50 123 4567",
    "footer.email": "info@shibr.com",
    "footer.address": "الرياض، المملكة العربية السعودية",
    "footer.rights": "جميع الحقوق محفوظة",

    // Shelfy Section
    "shelfy.title": "سواء عندك محل أو متجر إلكتروني...",
    "shelfy.highlight": "Shelfy",
    "shelfy.subtitle": "يربطكم",
    "shelfy.description": "ويفتح لك باب دخل واشتراك في نفس الوقت",
    "shelfy.service_stores": "متاجر الخدمات",
    "shelfy.commercial_centers": "مراكز الخدمة التجارية",
    "shelfy.smart_service": "الخدمة الذكية",
    "shelfy.smart_service_desc": "استقبال طلبات وبيع المنتج",
    "shelfy.fast_service": "الخدمة السريعة",
    "shelfy.fast_service_desc": "خدمة طلبية الأوردر بتحكم كامل - بضع دقائق أو ساعات أو أيام",
    "shelfy.integrated_service": "الخدمة المتكاملة",
    "shelfy.integrated_service_desc": "أنشئ حسابك واشترك وقدم أو اطلب الخدمة المناسبة",
    
    // Commercial Centers
    "shelfy.centers.premium_locations": "مواقع مميزة",
    "shelfy.centers.premium_locations_desc": "أرفف في أفضل المراكز التجارية والمولات الرائدة في المملكة",
    "shelfy.centers.high_traffic": "حركة عالية",
    "shelfy.centers.high_traffic_desc": "معدل زيارات يومي يتجاوز 10,000 زائر في المراكز المختارة",
    "shelfy.centers.targeted_audience": "جمهور مستهدف",
    "shelfy.centers.targeted_audience_desc": "وصول مباشر لشرائح العملاء المناسبة لمنتجاتك",

    // Video Section
    "video.title": "استعرض الحلول المتاحة...",
    "video.highlight": "واختر موقعك القادم",
    "video.description":
      "تطبيق الخدمات المتكاملة في منصة Shelfy يساعد على تحسين الأعمال والتجارة وتوفير الحلول المتكاملة في مكان واحد. يوفر التطبيق التحكم في جميع الأعمال والمبيعات الخدمية المقدمة من خلال منصة واحدة يمكن من خلالها إدارة الأعمال بطريقة احترافية.",
    "video.start_journey": "ابدأ رحلتك الآن",
    "video.jeddah_stores": "جدة - مواقع المتاجر المتاحة",
    "video.riyadh_stores": "الرياض - مواقع المتاجر المتاحة",
    
    // Why Choose Section
    "why_choose.title": "ليش تختار شبر؟ المنصة اللي تجمع بين التجارة الواقعية والرقمية في مكان واحد",
    "why_choose.description": "سواء كنت صاحب محل، تبغى تزيد دخلك، أو متجر إلكتروني تبغى توصل لعملائك في الواقع، Shelfy مصممة تقدم لك تجربة سلسة، مرنة، وتحفظ حقوقك من أول رف إلى آخر بيع.",

    // Statistics
    "stats.why_choose": "ليش تختار",
    "stats.platform": "للمنصة الرقمية",
    "stats.description":
      "الواقعية والرقمية في مكان واحد، منصة Shibr تضم أكثر من 1000 تاجر وأكثر من 10000 منتج وخدمة متنوعة في المملكة العربية السعودية، وتوفر خدمة التوصيل السريع لجميع المناطق في المملكة العربية السعودية.",
    "stats.active_stores": "متجر نشط",
    "stats.happy_customers": "عميل سعيد",
    "stats.sales": "المبيعات",
    "stats.completed_orders": "طلب مكتمل",

    // FAQ
    "faq.title": "أسئلتك المهمة...",
    "faq.highlight": "وحاجاتنا عليها",
    "faq.description": "هنا تجد إجابات على الأسئلة الأكثر شيوعاً حول خدماتنا ومنتجاتنا الإلكترونية",

    // Footer
    "footer.company": "الشركة",
    "footer.about_us": "من نحن",
    "footer.team": "فريق العمل",
    "footer.jobs": "الوظائف",
    "footer.customer_service": "خدمة العملاء",
    "footer.help_center": "مركز المساعدة",
    "footer.privacy_policy": "سياسة الخصوصية",
    "footer.terms": "شروط الاستخدام",
    "footer.contact_us": "تواصل معنا",
    "footer.rights": "جميع الحقوق محفوظة",
    "footer.description":
      "منصة Shibr الرائدة في ربط المتاجر الواقعية والإلكترونية، نوفر حلول متكاملة لإدارة الأعمال التجارية بطريقة احترافية.",
    "footer.social.twitter": "تويتر",
    "footer.social.linkedin": "لينكد إن",

    // Marketplace
    "marketplace.title": "البحث في المحلات والمتاجر",
    "marketplace.search_placeholder": "اكتب اسم المتجر",
    "marketplace.all_cities": "كل المدن",
    "marketplace.all_areas": "كل المناطق",
    "marketplace.riyadh": "الرياض",
    "marketplace.jeddah": "جدة",
    "marketplace.dammam": "الدمام",
    "marketplace.north": "الشمال",
    "marketplace.south": "الجنوب",
    "marketplace.footer.available_stations": "المحطات المتاحة",
    
    // Marketplace Mock Data
    "marketplace.mock.store_name_1": "كوفي سيوت",
    "marketplace.mock.monthly": "شهري",
    "marketplace.mock.location_riyadh": "المملكة العربية السعودية، الرياض 13512، حطين",
    "marketplace.mock.service_type": "نوع الخدمة",
    "marketplace.mock.through_april": "من خلال 1 أبريل",
    "marketplace.east": "الشرق",
    "marketplace.west": "الغرب",
    "marketplace.price_range": "نطاق السعر",
    "marketplace.store_type": "نوع المحل",
    "marketplace.all_types": "جميع الأنواع",
    "marketplace.coffee": "مقاهي",
    "marketplace.restaurant": "مطاعم",
    "marketplace.retail": "متاجر",
    "marketplace.search_stores": "ابحث لمتاجر",
    "marketplace.stores_map": "خريطة المتاجر",
    "marketplace.monthly": "شهري",

    // Auth
    "auth.signin": "تسجيل الدخول",
    "auth.signup": "تسجيل حساب جديد",
    "auth.welcome":
      "مرحبًا بك! سجل دخولك للوصول إلى لوحة التحكم وإدارة نشاطك بكل سهولة، سواء كنت صاحب محل أو متجر إلكتروني.",
    "auth.welcome_back": "مرحباً بعودتك",
    "auth.signin_description": "سجل دخولك للوصول إلى لوحة التحكم وإدارة نشاطك بكل سهولة",
    "auth.dont_have_account": "لا تملك حساباً؟",
    "auth.mobile": "رقم الجوال",
    "auth.password": "كلمة المرور",
    "auth.password_placeholder": "من فضلك أدخل كلمة المرور",
    "auth.remember_me": "تذكرني",
    "auth.forgot_password": "نسيت كلمة المرور؟ استعادة هنا",
    "auth.ready_to_join": "على استعداد للانضمام إلينا؟",
    "auth.already_have_account": "أنت لديك حساب؟",
    "auth.back_to_home": "العودة للرئيسية",
    "auth.create_account": "أنشئ حسابك وابدأ رحلتك مع Shelfy",
    "auth.signup_description":
      "اختر نوع حسابك، وسجّل بياناتك الأساسية، وابدأ في استكشاف فرص الربح أو التوسّع من خلال منصة تربط الواقع بالتجارة الإلكترونية.",
    "auth.account_type": "اختيار نوع الحساب",
    "auth.brand_owner": "صاحب متجر إلكتروني",
    "auth.store_owner": "صاحب محل",
    "auth.name": "الاسم",
    "auth.name_placeholder": "أدخل اسمك بالكامل",
    "auth.email": "البريد الإلكتروني",
    "auth.email_placeholder": "أدخل بريدك الإلكتروني",
    "auth.store_name": "اسم المتجر",
    "auth.brand_name": "اسم العلامة التجارية",
    "auth.store_name_placeholder": "أدخل اسم المتجر",
    "auth.brand_name_placeholder": "أدخل اسم العلامة التجارية",
    "auth.terms_agreement": "بإنشائك حسابك، فإنك توافق على",
    "auth.terms": "الشروط والأحكام",
    "auth.privacy": "سياسة الخصوصية",
    "auth.platform_terms": "الخاصة بمنصة Shelfy",
    "auth.error": "خطأ",
    "auth.success": "نجاح",
    "auth.must_agree_terms": "يجب الموافقة على الشروط والأحكام",
    "auth.account_created_successfully": "تم إنشاء الحساب بنجاح",
    "auth.signup_failed": "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى",
    "auth.signin_success": "تم تسجيل الدخول بنجاح",
    "auth.invalid_credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",

    // Settings
    "settings.title": "الإعدادات",
    "settings.general": "إعدادات عامة",
    "settings.brand": "بيانات العلامة التجارية",
    "settings.payment": "إعدادات الدفع",
    "settings.name": "الاسم",
    "settings.email": "البريد الإلكتروني",
    "settings.mobile": "رقم الجوال",
    "settings.name_placeholder": "أدخل اسمك بالكامل",
    "settings.email_placeholder": "أدخل بريدك الإلكتروني",
    "settings.mobile_placeholder": "رقم الجوال",
    "settings.save_changes": "حفظ التغيير",
    "settings.change_password": "تغيير كلمة المرور",
    "settings.password_description":
      "إذا تسببت كلمة المرور الخاصة بك أو حسابات مقصور باستخدام شبكة اجتماعية ، فيمكنك تعيين كلمة مرور باستخدام الزر أدناه",

    // Orders
    "orders.title": "الطلبات",
    "orders.incoming_title": "طلبات الواردة من المتاجر الإلكترونية",
    "orders.incoming_description":
      "تابع طلبات استئجار الرفوف من المتاجر الإلكترونية، وتابع تفاصيل كل طلب، واتخذ الموافقة أو الرفض بناءً على المعلومات المعروضة.",
    "orders.shipping_title": "طلبات الشحن",
    "orders.shipping_description": "تابع طلبات الشحن من المتاجر الإلكترونية، وتابع تفاصيل كل طلب.",
    "orders.search_placeholder": "ابحث باسم المتجر أو مدينة الفرع",
    "orders.cancel_warning": "سوف يتم إلغاء الطلبات بعد 48 ساعة في حالة عدم الموافقة عليها",
    "orders.all": "الكل",
    "orders.new": "جديد",
    "orders.under_review": "قيد المراجعة",
    "orders.rejected": "مرفوض",
    "orders.accepted": "مقبول",
    "orders.in_transit": "في الطريق",
    "orders.received": "تم الاستلام",

    // Table Headers
    "table.store": "المتجر",
    "table.branch": "الفرع",
    "table.rental_duration": "مدة الإيجار",
    "table.status": "الحالة",
    "table.order_date": "تاريخ الطلب",
    "table.value": "القيمة",
    "table.options": "خيارات",
    "table.shipping_method": "طريقة الشحن",
    "table.incoming_quantity": "الكمية القادمة",
    "table.shelf_name": "اسم الرف",
    "table.location": "الموقع",
    "table.size": "الحجم",
    "table.price": "السعر",
    "table.date_added": "تاريخ الإضافة",

    // Dashboard Stats
    "dashboard.stats.total_shelves": "إجمالي الرفوف",
    "dashboard.stats.active_rentals": "الإيجارات النشطة",
    "dashboard.stats.monthly_revenue": "الإيرادات الشهرية",
    "dashboard.stats.pending_requests": "الطلبات المعلقة",

    // Brand Dashboard
    "brand.dashboard.home": "الرئيسية",
    "brand.dashboard.shelves": "الرفوف",
    "brand.dashboard.products": "المنتجات",
    "brand.dashboard.settings": "الإعدادات",
    "brand.dashboard.welcome": "مرحبا بك في لوحة التحكم الخاصة بك",
    "brand.dashboard.signin": "تسجيل الدخول",
    "brand.dashboard.complete_data": "استكمال البيانات",
    "brand.dashboard.start_renting": "بدأ في الإيجار",
    "brand.dashboard.thanks_for_registering": "شكرا لتسجيلك معنا",
    "brand.dashboard.complete_data_description": "يجب عليك أن تكمل إدخال بياناتك للتمكن من تأجير الرفوف من تاجر الرفوف",
    "brand.dashboard.welcome_to_shelfy": "مرحبا بك في شيلفي",
    "brand.dashboard.monitor_description": "راقب مبيعاتك، الرفوف المؤجرة، المنتجات، وأداء المنتجات بسهولة من مكان واحد",
    "brand.dashboard.rent_new_shelf": "تأجير رف جديد",
    "brand.dashboard.displayed_products_count": "عدد المنتجات المعروضة",
    "brand.dashboard.total_sales": "إجمالي المبيعات",
    "brand.dashboard.rented_shelves_count": "عدد الرفوف المؤجرة حاليا",
    "brand.dashboard.increase_from_last_month": "+20.1% من الشهر الماضي",
    "brand.dashboard.sales": "المبيعات",
    "brand.dashboard.see_more": "رؤية المزيد",
    "brand.dashboard.no_sales_yet": "لا يوجد لديك مبيعات بعد",
    "brand.dashboard.your_rented_shelves": "رفوفك المؤجرة",
    "brand.dashboard.no_shelves_currently": "ليس لديك رفوف في الوقت الحالي",
    "brand.dashboard.add_new_shelf": "إضافة رف جديد",
    "brand.dashboard.latest_sales_operations": "آخر عملياتك البيع",
    "brand.dashboard.no_sales_operations": "لا يوجد لديك عمليات بيع",
  },
  en: {
    // Common
    "common.shibr": "Shibr",
    "common.search": "Search",
    "common.save": "Save",
    "common.language.arabic": "العربية",
    "common.language.english": "English",
    "common.loading": "Loading...",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.upload": "Upload",
    "common.loading": "Loading...",
    "common.submit": "Submit",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",

    // Navigation
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.about": "About Us",
    "nav.services": "Services",
    "nav.contact": "Contact Us",
    "nav.blog": "Blog",
    "nav.signin": "Sign In",
    "nav.marketplace": "Marketplace",
    "nav.dashboard": "Dashboard",
    "nav.navigation": "Navigation",
    "nav.questions": "Questions & Answers",
    "nav.why_us": "Why Us",

    // Dashboard Navigation
    "dashboard.home": "Home",
    "dashboard.products": "Products",
    "dashboard.shelves": "Shelves",
    "dashboard.orders": "Orders",
    "dashboard.settings": "Settings",
    "dashboard.profile": "Profile",
    "dashboard.posts": "Posts",
    "dashboard.stores": "Stores",
    "dashboard.payments": "Payments",
    "dashboard.logout": "Logout",
    "dashboard.brand": "Brand Dashboard",
    "dashboard.store": "Store Dashboard",
    "dashboard.admin": "Admin Dashboard",

    // Dashboard Home Page
    "dashboard.welcome": "Welcome to your dashboard",
    "dashboard.complete_data": "Complete Data",
    "dashboard.start_displaying_shelves": "Start displaying your shelves",
    "dashboard.thanks_for_registering": "Thank you for registering with us",
    "dashboard.complete_data_description":
      "You must complete entering your data to be able to display your shelves for rent.",
    "dashboard.incomplete_profile_warning": "Warning: Your profile is incomplete",
    "dashboard.complete_profile_now": "Complete Profile Now",
    "dashboard.manage_store_starts_here": "Managing your store starts here",
    "dashboard.display_shelf_now": "Display shelf now",
    "dashboard.monitor_performance_description":
      "Monitor your performance, display your shelves for rent, and start increasing your income with Shelfy.",
    "dashboard.currently_rented_brands": "Currently rented brands count",
    "dashboard.total_sales": "Total Sales",
    "dashboard.incoming_orders": "Incoming Orders",
    "dashboard.increase_from_last_month": "+20.1% from last month",
    "dashboard.new_rental_requests": "New rental requests",
    "dashboard.see_more": "See more",
    "dashboard.no_rental_requests": "You have no rental requests",
    "dashboard.your_shelves": "Your shelves",
    "dashboard.no_shelves_displayed": "You have no shelves displayed at the moment",

    // Shelves Page
    "shelves.title": "Shelf Management",
    "shelves.description": "Confirm spaces displayed in your branches",
    "shelves.my_shelves": "Your Shelves",
    "shelves.manage_description":
      "Easily manage your shelves across all branches, track their status, tenants, and collection dates in one place",
    "shelves.add_shelf": "Display Shelf Now",
    "shelves.search_placeholder": "Search by tenant name or branch city...",
    "shelves.all": "All",
    "shelves.available": "Available Shelves",
    "shelves.rented": "Rented Shelves",
    "shelves.maintenance": "Maintenance",
    "shelves.available_shelves": "Available Shelves",
    "shelves.total_sales": "Total Sales",
    "shelves.total_rented_shelves": "Total Rented Shelves",

    // Landing Page
    "hero.title": "Smart platform connecting",
    "hero.highlight": "physical and online stores",
    "hero.description":
      "We aim to help merchants interested in e-commerce and existing commercial stores through a unified system and provide integrated services and solutions for inventory management and determining sales conversion across multiple electronic platforms",
    "hero.start_now": "Start Now",
    "hero.learn_more": "Learn More",
    
    // Features
    "features.title": "Our Features",
    "features.subtitle": "Discover how Shibr helps you achieve your business goals",
    "features.clear_rights.title": "Clear Rights for All Parties",
    "features.clear_rights.description": "Each product is linked to a unique QR code, ensuring accurate tracking of every purchase and giving each party their rightful commission or revenue.",
    "features.empty_spaces.title": "Turn Empty Spaces into Income",
    "features.empty_spaces.description": "If you have an unused shelf, wall, or corner, Shelfy helps you rent it out and generate monthly income or a percentage of sales easily.",
    "features.real_reach.title": "Real Reach Without Opening a Branch",
    "features.real_reach.description": "For online store owners, you can place your products in different neighborhoods and cities without opening a branch or hiring anyone.",
    "features.flexible_rental.title": "Flexible Rental System",
    "features.flexible_rental.description": "Choose the payment method that suits you: monthly amount, percentage of sales, or a mix of both. You're in control of the terms.",
    
    // FAQ
    "faq.title": "Frequently Asked Questions",
    "faq.subtitle": "Answers to the most common questions about Shibr platform",
    "faq.q1": "Does Shelfy take a commission on every transaction?",
    "faq.a1": "Yes, Shelfy is just an intermediary platform. The financial agreement is entirely between the store owner and the merchant, and the platform takes a small percentage.",
    "faq.q2": "Is there a contract between the parties?",
    "faq.a2": "Not available",
    "faq.q3": "How are sales tracked?",
    "faq.a3": "Not available",
    "faq.q4": "Can I change the rental terms after adding the shelf?",
    "faq.a4": "Not available",
    "faq.q5": "Can I rent more than one store at the same time?",
    "faq.a5": "Not available",
    
    // Footer
    "footer.contact": "Contact Us",
    "footer.phone": "+966 50 123 4567",
    "footer.email": "info@shibr.com",
    "footer.address": "Riyadh, Saudi Arabia",
    "footer.rights": "All rights reserved",

    // Shelfy Section
    "shelfy.title": "Whether you have a store or an online shop...",
    "shelfy.highlight": "Shelfy",
    "shelfy.subtitle": "connects you",
    "shelfy.description": "and opens the door to income and participation at the same time",
    "shelfy.service_stores": "Service Stores",
    "shelfy.commercial_centers": "Commercial Service Centers",
    "shelfy.smart_service": "Smart Service",
    "shelfy.smart_service_desc": "Receive orders and sell products",
    "shelfy.fast_service": "Fast Service",
    "shelfy.fast_service_desc": "Order service with full control - minutes, hours or days",
    "shelfy.integrated_service": "Integrated Service",
    "shelfy.integrated_service_desc": "Create your account, subscribe and provide or request the appropriate service",
    
    // Commercial Centers
    "shelfy.centers.premium_locations": "Premium Locations",
    "shelfy.centers.premium_locations_desc": "Shelves in the best commercial centers and leading malls in the Kingdom",
    "shelfy.centers.high_traffic": "High Traffic",
    "shelfy.centers.high_traffic_desc": "Daily visitor rate exceeding 10,000 visitors in selected centers",
    "shelfy.centers.targeted_audience": "Targeted Audience",
    "shelfy.centers.targeted_audience_desc": "Direct access to customer segments suitable for your products",

    // Video Section
    "video.title": "Explore available solutions...",
    "video.highlight": "and choose your next location",
    "video.description":
      "The integrated services application on the Shelfy platform helps improve business and commerce and provide integrated solutions in one place. The application provides control over all business and service sales provided through one platform through which business can be managed professionally.",
    "video.start_journey": "Start Your Journey Now",
    "video.jeddah_stores": "Jeddah - Available store locations",
    "video.riyadh_stores": "Riyadh - Available store locations",
    
    // Why Choose Section
    "why_choose.title": "Why choose Shibr? The platform that brings together physical and digital commerce in one place",
    "why_choose.description": "Whether you're a store owner looking to increase your income, or an online store wanting to reach customers in reality, Shelfy is designed to provide you with a smooth, flexible experience that preserves your rights from the first shelf to the last sale.",

    // Statistics
    "stats.why_choose": "Why choose",
    "stats.platform": "for the digital platform",
    "stats.description":
      "Physical and digital in one place, Shibr platform includes more than 1000 merchants and more than 10000 diverse products and services in Saudi Arabia, and provides fast delivery service to all regions in Saudi Arabia.",
    "stats.active_stores": "Active Stores",
    "stats.happy_customers": "Happy Customers",
    "stats.sales": "Sales",
    "stats.completed_orders": "Completed Orders",

    // FAQ
    "faq.title": "Your important questions...",
    "faq.highlight": "and our answers to them",
    "faq.description":
      "Here you will find answers to the most frequently asked questions about our services and electronic products",

    // Footer
    "footer.company": "Company",
    "footer.about_us": "About Us",
    "footer.team": "Team",
    "footer.jobs": "Jobs",
    "footer.customer_service": "Customer Service",
    "footer.help_center": "Help Center",
    "footer.privacy_policy": "Privacy Policy",
    "footer.terms": "Terms of Use",
    "footer.contact_us": "Contact Us",
    "footer.rights": "All rights reserved",
    "footer.description":
      "Shibr platform is a leader in connecting physical and online stores, providing integrated solutions for managing commercial business professionally.",
    "footer.social.twitter": "Twitter",
    "footer.social.linkedin": "LinkedIn",

    // Marketplace
    "marketplace.title": "Search Stores and Markets",
    "marketplace.search_placeholder": "Type store name",
    "marketplace.all_cities": "All Cities",
    "marketplace.all_areas": "All Areas",
    "marketplace.riyadh": "Riyadh",
    "marketplace.jeddah": "Jeddah",
    "marketplace.dammam": "Dammam",
    "marketplace.north": "North",
    "marketplace.south": "South",
    "marketplace.footer.available_stations": "Available Stations",
    
    // Marketplace Mock Data
    "marketplace.mock.store_name_1": "Coffee Suit",
    "marketplace.mock.monthly": "Monthly",
    "marketplace.mock.location_riyadh": "Saudi Arabia, Riyadh 13512, Hittin",
    "marketplace.mock.service_type": "Service Type",
    "marketplace.mock.through_april": "Through April 1",
    "marketplace.east": "East",
    "marketplace.west": "West",
    "marketplace.price_range": "Price Range",
    "marketplace.store_type": "Store Type",
    "marketplace.all_types": "All Types",
    "marketplace.coffee": "Coffee Shops",
    "marketplace.restaurant": "Restaurants",
    "marketplace.retail": "Retail Stores",
    "marketplace.search_stores": "Search Stores",
    "marketplace.stores_map": "Stores Map",
    "marketplace.monthly": "Monthly",

    // Auth
    "auth.signin": "Sign In",
    "auth.signup": "Create New Account",
    "auth.welcome":
      "Welcome! Sign in to access your dashboard and manage your activity easily, whether you are a store owner or an online store.",
    "auth.welcome_back": "Welcome Back",
    "auth.signin_description": "Sign in to access your dashboard and manage your activity easily",
    "auth.dont_have_account": "Don't have an account?",
    "auth.mobile": "Mobile Number",
    "auth.password": "Password",
    "auth.password_placeholder": "Please enter your password",
    "auth.remember_me": "Remember me",
    "auth.forgot_password": "Forgot password? Recover here",
    "auth.ready_to_join": "Ready to join us?",
    "auth.already_have_account": "Already have an account?",
    "auth.back_to_home": "Back to Home",
    "auth.create_account": "Create your account and start your journey with Shelfy",
    "auth.signup_description":
      "Choose your account type, register your basic information, and start exploring profit or expansion opportunities through a platform that connects reality with e-commerce.",
    "auth.account_type": "Choose Account Type",
    "auth.brand_owner": "Online Store Owner",
    "auth.store_owner": "Store Owner",
    "auth.name": "Name",
    "auth.name_placeholder": "Enter your full name",
    "auth.email": "Email",
    "auth.email_placeholder": "Enter your email address",
    "auth.store_name": "Store Name",
    "auth.brand_name": "Brand Name",
    "auth.store_name_placeholder": "Enter store name",
    "auth.brand_name_placeholder": "Enter brand name",
    "auth.terms_agreement": "By creating your account, you agree to the",
    "auth.terms": "Terms and Conditions",
    "auth.privacy": "Privacy Policy",
    "auth.platform_terms": "of Shelfy platform",
    "auth.error": "Error",
    "auth.success": "Success",
    "auth.must_agree_terms": "You must agree to the terms and conditions",
    "auth.account_created_successfully": "Account created successfully",
    "auth.signup_failed": "Failed to create account. Please try again",
    "auth.signin_success": "Signed in successfully",
    "auth.invalid_credentials": "Invalid email or password",

    // Settings
    "settings.title": "Settings",
    "settings.general": "General Settings",
    "settings.brand": "Brand Information",
    "settings.payment": "Payment Settings",
    "settings.name": "Name",
    "settings.email": "Email",
    "settings.mobile": "Mobile Number",
    "settings.name_placeholder": "Enter your full name",
    "settings.email_placeholder": "Enter your email address",
    "settings.mobile_placeholder": "Mobile number",
    "settings.save_changes": "Save Changes",
    "settings.change_password": "Change Password",
    "settings.password_description":
      "If your password is compromised or you have accounts limited to using a social network, you can set a password using the button below",

    // Orders
    "orders.title": "Orders",
    "orders.incoming_title": "Incoming Orders from Online Stores",
    "orders.incoming_description":
      "Track shelf rental orders from online stores, follow up on each order details, and make approval or rejection decisions based on the displayed information.",
    "orders.shipping_title": "Shipping Orders",
    "orders.shipping_description": "Track shipping orders from online stores and follow up on each order details.",
    "orders.search_placeholder": "Search by store name or branch city",
    "orders.cancel_warning": "Orders will be cancelled after 48 hours if not approved",
    "orders.all": "All",
    "orders.new": "New",
    "orders.under_review": "Under Review",
    "orders.rejected": "Rejected",
    "orders.accepted": "Accepted",
    "orders.in_transit": "In Transit",
    "orders.received": "Received",

    // Table Headers
    "table.store": "Store",
    "table.branch": "Branch",
    "table.rental_duration": "Rental Duration",
    "table.status": "Status",
    "table.order_date": "Order Date",
    "table.value": "Value",
    "table.options": "Options",
    "table.shipping_method": "Shipping Method",
    "table.incoming_quantity": "Incoming Quantity",
    "table.shelf_name": "Shelf Name",
    "table.location": "Location",
    "table.size": "Size",
    "table.price": "Price",
    "table.date_added": "Date Added",

    // Dashboard Stats
    "dashboard.stats.total_shelves": "Total Shelves",
    "dashboard.stats.active_rentals": "Active Rentals",
    "dashboard.stats.monthly_revenue": "Monthly Revenue",
    "dashboard.stats.pending_requests": "Pending Requests",

    // Brand Dashboard
    "brand.dashboard.home": "Home",
    "brand.dashboard.shelves": "Shelves",
    "brand.dashboard.products": "Products",
    "brand.dashboard.settings": "Settings",
    "brand.dashboard.welcome": "Welcome to your dashboard",
    "brand.dashboard.signin": "Sign In",
    "brand.dashboard.complete_data": "Complete Data",
    "brand.dashboard.start_renting": "Start Renting",
    "brand.dashboard.thanks_for_registering": "Thank you for registering with us",
    "brand.dashboard.complete_data_description": "You must complete entering your data to be able to rent shelves from shelf merchants",
    "brand.dashboard.welcome_to_shelfy": "Welcome to Shelfy",
    "brand.dashboard.monitor_description": "Monitor your sales, rented shelves, products, and product performance easily from one place",
    "brand.dashboard.rent_new_shelf": "Rent New Shelf",
    "brand.dashboard.displayed_products_count": "Displayed Products Count",
    "brand.dashboard.total_sales": "Total Sales",
    "brand.dashboard.rented_shelves_count": "Currently Rented Shelves Count",
    "brand.dashboard.increase_from_last_month": "+20.1% from last month",
    "brand.dashboard.sales": "Sales",
    "brand.dashboard.see_more": "See More",
    "brand.dashboard.no_sales_yet": "You have no sales yet",
    "brand.dashboard.your_rented_shelves": "Your Rented Shelves",
    "brand.dashboard.no_shelves_currently": "You have no shelves at the moment",
    "brand.dashboard.add_new_shelf": "Add New Shelf",
    "brand.dashboard.latest_sales_operations": "Your Latest Sales Operations",
    "brand.dashboard.no_sales_operations": "You have no sales operations",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar")
  const direction: Direction = language === "ar" ? "rtl" : "ltr"

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
    // Update document direction
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "ar" || savedLanguage === "en")) {
      setLanguageState(savedLanguage)
      document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr"
      document.documentElement.lang = savedLanguage
    }
  }, [])

  return <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
