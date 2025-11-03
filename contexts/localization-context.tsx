"use client"

import type { ReactNode } from "react"
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
    "common.shibr": "شبر",
    "common.coming_soon": "قريباً",
    "common.error": "خطأ",
    "common.success": "نجاح",

    // Error pages
    "error.title": "حدث خطأ",
    "error.description": "نعتذر، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    "error.try_again": "حاول مرة أخرى",
    "error.go_home": "العودة للرئيسية",
    "error.go_dashboard": "العودة للوحة التحكم",
    "error.details": "تفاصيل الخطأ",
    "error.code": "رمز الخطأ",
    "error.admin_dashboard_title": "خطأ في لوحة تحكم المسؤول",
    "error.admin_dashboard_description": "حدث خطأ أثناء تحميل لوحة تحكم المسؤول",
    "error.brand_dashboard_title": "خطأ في لوحة تحكم العلامة التجارية",
    "error.brand_dashboard_description": "حدث خطأ أثناء تحميل لوحة تحكم العلامة التجارية",
    "error.store_dashboard_title": "خطأ في لوحة تحكم المتجر",
    "error.store_dashboard_description": "حدث خطأ أثناء تحميل لوحة تحكم المتجر",

    // 404 Page
    "404.title": "404",
    "404.subtitle": "الصفحة غير موجودة",
    "404.description": "عذراً، لا يمكننا العثور على الصفحة التي تبحث عنها.",
    "404.go_home": "العودة للرئيسية",
    "404.browse_marketplace": "تصفح السوق",
    "404.search_suggestion": "جرب البحث عما تريد أو العودة للصفحة الرئيسية",
    "common.submitting": "جاري الإرسال...",
    "common.uploading_images": "جاري رفع الصور...",
    "common.remove": "إزالة",
    "common.fill_required_fields": "يرجى ملء جميع الحقول المطلوبة",
    "common.user_not_found": "لم يتم العثور على المستخدم",
    "common.search": "بحث",
    "common.loading": "جاري التحميل...",
    "common.not_specified": "غير محدد",
    "common.none": "لا يوجد",
    "common.all": "الكل",
    "common.new": "جديد",
    "common.currency_symbol": "ر.س",
    "common.save": "حفظ",
    "common.save_changes": "حفظ التغييرات",
    "common.saving": "جاري الحفظ...",
    "common.optional": "اختياري",
    "common.address": "العنوان",
    "common.description": "الوصف",
    "common.download": "تحميل",
    "common.no_description": "لا يوجد وصف",
    "common.visit": "زيارة",
    "common.language.arabic": "العربية",
    "common.language.english": "English",
    "common.theme.light": "فاتح",
    "common.theme.dark": "داكن",
    "common.theme.system": "النظام",
    "common.theme.toggle": "تبديل السمة",
    "common.cancel": "إلغاء",
    "common.close": "إغلاق",
    "common.clear_filters": "مسح التصفية",
    "common.sar": "ر.س",
    "common.selected": "محدد",
    "common.delete": "حذف",
    "common.deleting": "جاري الحذف...",
    "common.no_results": "لا توجد نتائج",
    "common.try_different_search": "حاول البحث بكلمات مختلفة",
    "common.no_notes": "لا توجد ملاحظات",
    "common.edit": "تعديل",
    "common.details": "التفاصيل",
    "common.view": "عرض",
    "common.upload": "رفع",
    "common.submit": "إرسال",
    "common.create": "إنشاء",
    "common.please_fix_errors": "يرجى إصلاح الأخطاء قبل المتابعة",
    "common.something_went_wrong": "حدث خطأ ما",
    "common.back": "العودة",
    "common.next": "التالي",
    "common.previous": "السابق",
    "common.clear_search": "مسح البحث",
    "common.view_all": "عرض الكل",
    "common.unknown": "غير معروف",
    "common.logo_alt": "شعار شبر",
    "common.currency": "ريال",
    "common.completed": "مكتمل",
    "common.pending": "معلق",
    "common.active": "نشط",
    "common.expired": "منتهي",
    "common.progress": "التقدم",
    "common.start_date": "تاريخ البداية",
    "common.end_date": "تاريخ الانتهاء",
    "common.day": "يوم",
    "common.days": "أيام",
    "common.remaining": "متبقي",
    "common.small": "صغير",
    "common.medium": "متوسط",
    "common.large": "كبير",
    "common.monthly": "شهرياً",
    "common.month": "شهر",
    "common.months": "شهور",
    "common.july": "يوليو",
    "common.june": "يونيو",
    "common.riyadh": "الرياض",
    "common.jeddah": "جدة",
    "common.dammam": "الدمام",
    "common.brand_name": "اسم العلامة التجارية",
    "common.join_date": "تاريخ الانضمام",
    "common.registration_number": "رقم السجل التجاري",
    "common.registration_document": "وثيقة السجل التجاري",
    "common.business_type": "نوع العمل",
    "common.registered_company": "شركة مسجلة",
    "common.freelancer": "فريلانسر",
    "common.date": "التاريخ",
    "common.inactive": "غير نشط",
    "common.status": "الحالة",
    "common.actions": "الإجراءات",
    "common.subtotal": "المجموع الفرعي",
    "common.unit_price": "سعر الوحدة",
    "common.quantity": "الكمية",
    "common.order_summary": "ملخص الطلب",
    "common.total_amount": "المبلغ الإجمالي",
    "common.total_items": "إجمالي القطع",
    "common.total": "المجموع",
    "common.products": "المنتجات",
    "common.items": "القطع",
    "orders.mock.step_store": "خطوة ستور",

    // Navigation
    "nav.home": "الرئيسية",
    "nav.renter_store": "انضم لمجتمع شبر",
    "nav.stores": "المحلات",
    "nav.why_us_nav": "لماذا نحن",
    "nav.contact": "تواصل معنا",
    "nav.blog": "المدونة",
    "nav.signin": "تسجيل الدخول",
    "nav.marketplace": "السوق",
    "nav.dashboard": "لوحة التحكم",
    "nav.settings": "الإعدادات",
    "nav.signout": "تسجيل الخروج",
    "nav.verify_email": "تحقق من البريد الإلكتروني",
    "nav.email_not_verified": "البريد الإلكتروني غير محقق",
    "nav.navigation": "التنقل",
    "nav.open_menu": "فتح القائمة",
    "nav.close_menu": "إغلاق القائمة",
    "nav.questions": "انضم لمجتمع شبر",
    "nav.services": "المحلات",
    "nav.why_us": "لماذا نحن",

    // Dashboard Navigation
    "dashboard.home": "الرئيسية",
    "dashboard.products": "المنتجات",
    "dashboard.shelves": "الرفوف",
    "dashboard.shelves_description": "إدارة الرفوف المتاحة في متجرك",

    // Public Store Page
    "store.cart": "السلة",
    "store.welcome_message": "مرحباً بك في متجرنا",
    "store.available_products": "المنتجات المتاحة",
    "store.available": "متاح",
    "store.in_stock": "متوفر",
    "store.out_of_stock": "نفذ المخزون",
    "store.add_to_cart": "أضف للسلة",
    "store.added_to_cart": "تمت الإضافة للسلة",
    "store.no_products": "لا توجد منتجات متاحة حالياً",
    "store.view_cart": "عرض السلة",
    "store.checkout": "إتمام الشراء",
    "store.empty_cart": "السلة فارغة",
    "store.cart_items": "عناصر السلة",
    "store.quantity": "الكمية",
    "store.price": "السعر",
    "store.products": "المنتجات",
    "store.tax": "الضريبة",
    "store.subtotal": "المجموع الفرعي",
    "store.total": "المجموع",
    "store.continue_shopping": "متابعة التسوق",
    "store.cart_limit_reached": "تم الوصول للحد الأقصى",
    "store.already_in_cart": "موجود في السلة",
    "store.max": "الحد الأقصى",
    "store.max_quantity_in_cart": "تم الوصول للحد الأقصى لهذا المنتج في السلة",
    "store.stock_limit": "تجاوز حد المخزون",
    "store.only": "متوفر فقط",
    "store.each": "للقطعة",
    "store.fill_required": "الرجاء تعبئة المعلومات المطلوبة",
    "store.fill_all_fields": "الرجاء تعبئة جميع الحقول",
    "store.invalid_email": "البريد الإلكتروني غير صالح",
    "store.invalid_phone": "رقم الهاتف غير صالح",
    "store.saudi_phone_format": "الرجاء إدخال رقم جوال سعودي صحيح",
    "store.order_failed": "فشل الطلب",
    "store.enter_name": "أدخل الاسم الكامل",
    "store.enter_email": "أدخل البريد الإلكتروني",
    "store.payment_on_delivery": "الدفع عند الاستلام",
    "store.enter_phone_title": "أدخل رقم الهاتف",
    "store.enter_phone_description": "سنرسل إيصال الطلب إلى رقم هاتفك",
    "store.name_label": "الاسم الكامل",
    "store.name_placeholder": "أدخل اسمك الكامل",
    "store.name_required": "الاسم مطلوب",
    "store.phone_label": "رقم الهاتف",
    "store.phone_required": "رقم الهاتف مطلوب",
    "store.invalid_phone_format": "رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام",
    "store.proceed_checkout": "متابعة الطلب",
    "store.customer_info": "معلومات العميل",
    "store.customer_name": "الاسم الكامل",
    "store.customer_email": "البريد الإلكتروني",
    "store.customer_phone": "رقم الهاتف",
    "store.payment_method": "طريقة الدفع",
    "store.cash": "نقداً",
    "store.bank_transfer": "تحويل بنكي",
    "store.card": "بطاقة ائتمان",
    "store.order_notes": "ملاحظات الطلب",
    "store.place_order": "تأكيد الطلب",
    "store.order_summary": "ملخص الطلب",
    "store.order_success": "تم استلام طلبك",
    "store.order_success_description": "شكراً لك! سنتواصل معك قريباً",
    "store.order_number": "رقم الطلب",
    "store.track_order": "تتبع الطلب",
    "store.send_otp": "إرسال رمز التحقق",
    "store.verify_otp": "تحقق",
    "store.otp_label": "رمز التحقق",
    "store.otp_placeholder": "أدخل رمز التحقق المكون من 6 أرقام",
    "store.otp_sent": "تم إرسال رمز التحقق إلى رقم الواتساب الخاص بك",
    "store.otp_verified": "تم التحقق من رقم الهاتف بنجاح",
    "store.otp_sending": "جاري الإرسال...",
    "store.otp_verifying": "جاري التحقق...",
    "store.otp_required": "الرجاء التحقق من رقم هاتفك أولاً",
    "store.resend_otp": "إعادة إرسال الرمز",
    "store.invalid_otp": "رمز التحقق غير صحيح",
    "store.otp_expired": "انتهت صلاحية رمز التحقق",
    "store.otp_too_many_attempts": "عدد كبير جداً من المحاولات الفاشلة. الرجاء طلب رمز جديد",
    "store.otp_rate_limit": "عدد كبير جداً من طلبات الإرسال. الرجاء المحاولة لاحقاً",
    "store.phone_verified": "تم التحقق من الرقم",

    // Payment Page
    "payment.title": "الدفع",
    "payment.secure_checkout": "الدفع الآمن",
    "payment.ordering_from": "الطلب من",
    "payment.receipt_phone": "رقم هاتف الإيصال",
    "payment.payment_method": "طريقة الدفع",
    "payment.pay_with_card": "الدفع بالبطاقة",
    "payment.pay_with_apple": "Apple Pay",
    "payment.apple_pay": "Apple Pay",
    "payment.pay_with_apple_pay": "الدفع بـ Apple Pay",
    "payment.apple_pay_notice": "استخدم Apple Pay للدفع السريع والآمن",
    "payment.apple_pay_ready": "Apple Pay جاهز",
    "payment.click_pay_to_continue": "انقر على الدفع للمتابعة",
    "payment.setup_apple_pay": "إعداد Apple Pay",
    "payment.apple_pay_test_mode": "هذا وضع تجريبي. سيتم محاكاة دفعة Apple Pay.",
    "payment.verifying_apple_pay": "التحقق من Apple Pay...",
    "payment.card_number": "رقم البطاقة",
    "payment.cardholder_name": "اسم حامل البطاقة",
    "payment.expiry_date": "تاريخ الانتهاء",
    "payment.cvv": "CVV",
    "payment.test_mode_notice": "هذا وضع تجريبي. لن يتم خصم أي مبالغ من البطاقة.",
    "payment.order_summary": "ملخص الطلب",
    "payment.pay_now": "ادفع الآن",
    "payment.confirm_order": "تأكيد الطلب",
    "payment.no_order_data": "لا توجد بيانات طلب",
    "payment.redirecting_cart": "إعادة التوجيه إلى السلة...",
    "payment.invalid_card_number": "رقم البطاقة غير صالح",
    "payment.invalid_card_name": "اسم حامل البطاقة مطلوب",
    "payment.invalid_expiry": "تاريخ انتهاء غير صالح",
    "payment.invalid_cvv": "CVV غير صالح",
    "payment.processing_payment": "معالجة الدفع",
    "payment.verifying_card": "التحقق من بيانات البطاقة...",
    "payment.confirming_order": "تأكيد الطلب...",
    "payment.payment_successful": "تم الدفع بنجاح",
    "payment.order_confirmed": "تم تأكيد طلبك",
    "payment.payment_failed": "فشل الدفع",
    "payment.payment_declined": "تم رفض البطاقة. يرجى المحاولة مرة أخرى.",
    "payment.order_failed": "فشل إنشاء الطلب",
    "payment.redirecting_back": "إعادة التوجيه...",
    "payment.secure_payment": "معالجة دفع آمنة",
    "payment.card": "بطاقة",
    "payment.redirecting": "إعادة التوجيه...",
    "payment.checkout_creation_failed": "فشل إنشاء جلسة الدفع",
    "payment.user_not_found": "لم يتم العثور على بيانات المستخدم",
    "payment.amount_not_found": "لم يتم العثور على مبلغ الدفع",
    "payment.secure_checkout_description": "سيتم إعادة توجيهك إلى صفحة دفع آمنة",
    "payment.accepted_methods": "طرق الدفع المقبولة:",
    "payment.transaction_declined": "تم رفض العملية",
    "payment.payment_not_processed": "لم تتم معالجة الدفعة. يرجى المحاولة مرة أخرى.",
    "payment.status": "الحالة",
    "payment.common_reasons": "الأسباب الشائعة:",
    "payment.insufficient_funds": "رصيد غير كافي",
    "payment.incorrect_card_details": "تفاصيل بطاقة غير صحيحة",
    "payment.card_expired": "البطاقة منتهية الصلاحية",
    "payment.transaction_limit_exceeded": "تجاوز حد المعاملة",
    "payment.try_again": "المحاولة مرة أخرى",
    "payment.back_to_dashboard": "العودة للوحة التحكم",
    "payment.need_help": "هل تحتاج للمساعدة؟",
    "payment.contact_support": "تواصل مع الدعم الفني",
    "payment.invoice_details": "تفاصيل الفاتورة",
    "payment.invoice_number": "رقم الفاتورة",
    "payment.subtotal": "المجموع الفرعي",
    "payment.tax": "الضريبة",
    "payment.total_amount": "المبلغ الإجمالي",
    "payment.platform_fee": "رسوم المنصة",
    "payment.complete_payment": "إكمال الدفع",
    "payment.by_proceeding_agreement": "بالمتابعة، فإنك توافق على شروط الخدمة",
    "payment.terms_and_conditions": "والأحكام والشروط الخاصة بنا",
    "payment.success_title": "تمت العملية بنجاح",
    "payment.payment_confirmed": "تم تأكيد الدفع بنجاح",
    "payment.rental_activated": "تم تفعيل طلب الإيجار",
    "payment.error_title": "خطأ في الدفع",
    "payment.error_message": "حدث خطأ أثناء معالجة الدفعة",
    "payment.already_completed": "تم الدفع مسبقاً",
    "payment.rental_active_message": "طلب الإيجار الخاص بك مفعل بالفعل",
    "payment.view_rental_details": "عرض تفاصيل الإيجار",
    "payment.missing_payment_info": "معلومات الدفع مفقودة",
    "payment.card_payment": "الدفع بالبطاقة",
    "payment.loading_card_form": "تحميل نموذج البطاقة...",
    "payment.card_error": "خطأ في البطاقة",
    "payment.initialization_error": "فشل تهيئة نظام الدفع",
    "payment.card_not_ready": "نموذج البطاقة غير جاهز",
    "payment.tokenization_failed": "فشل معالجة بيانات البطاقة",
    "payment.processing": "جاري المعالجة...",
    "payment.verifying_payment": "جاري التحقق من الدفع...",
    "payment.please_wait_verification": "يرجى الانتظار بينما نتحقق من دفعتك",
    "payment.failed_title": "فشل الدفع",
    "payment.failed_message": "لم تتم معالجة دفعتك. يرجى المحاولة مرة أخرى.",
    "payment.payment_not_completed": "لم يتم إكمال الدفع",
    "payment.verification_failed": "فشل التحقق من الدفع",
    "store.back_to_cart": "العودة إلى السلة",

    // Order Confirmation Page
    "order.thank_you": "شكراً لك!",
    "order.confirmation_message": "تم استلام طلبك وهو قيد المعالجة.",
    "order.order_details": "تفاصيل الطلب",
    "order.order_number": "رقم الطلب",
    "order.order_date": "تاريخ الطلب",
    "order.contact_phone": "رقم التواصل",
    "order.payment_method": "طريقة الدفع",
    "order.store": "المحل",
    "order.brand": "العلامة التجارية",
    "order.items": "المنتجات",
    "order.subtotal": "المجموع الفرعي",
    "order.tax": "الضريبة",
    "order.total": "الإجمالي",
    "order.whats_next": "ماذا بعد؟",
    "order.step1_title": "تأكيد الطلب",
    "order.step1_description": "سيقوم المحل بمراجعة طلبك وتأكيده.",
    "order.step2_title": "تحضير الطلب",
    "order.step2_description": "سيتم تحضير طلبك بعناية.",
    "order.step3_title": "استلام الطلب",
    "order.step3_description": "قم بزيارة المحل لاستلام طلبك.",
    "order.estimated_time": "الوقت المتوقع",
    "order.minutes": "دقيقة",
    "order.continue_shopping": "متابعة التسوق",
    "order.back_to_home": "العودة للرئيسية",
    "order.status.pending": "قيد الانتظار",
    "order.status.confirmed": "مؤكد",
    "order.status.processing": "قيد المعالجة",
    "order.status.ready": "جاهز",
    "order.status.delivered": "تم التسليم",
    "order.status.cancelled": "ملغي",
    "order.status.refunded": "مسترد",

    // QR Stores Page
    "qr_stores.title": "متاجر QR للرفوف",
    "qr_stores.description": "قم بإنشاء وإدارة رموز QR لمتاجر الرفوف المؤجرة",
    "qr_stores.generate_qr": "إنشاء رمز QR",
    "qr_stores.regenerate_qr": "إعادة إنشاء رمز QR",
    "qr_stores.view_qr": "عرض رمز QR",
    "qr_stores.generating": "جاري الإنشاء...",
    "qr_stores.qr_generated": "تم إنشاء رمز QR",
    "qr_stores.qr_generated_description": "تم إنشاء رمز QR بنجاح",
    "qr_stores.qr_generation_failed": "فشل إنشاء رمز QR",
    "qr_stores.no_qr_generated": "لم يتم إنشاء رمز QR بعد",
    "qr_stores.download_qr": "تحميل رمز QR",
    "qr_stores.copy_link": "نسخ الرابط",
    "qr_stores.view_store": "عرض المتجر",
    "qr_stores.link_copied": "تم نسخ الرابط",
    "qr_stores.copy_failed": "فشل نسخ الرابط",
    "qr_stores.scans": "المسحات",
    "qr_stores.orders": "الطلبات",
    "qr_stores.revenue": "الإيرادات",
    "qr_stores.qr_code_ready": "رمز QR جاهز",
    "qr_stores.qr_code_ready_description": "يمكنك الآن تحميل رمز QR أو طباعته",
    "qr_stores.store_url": "رابط المتجر",
    "qr_stores.qr_store": "متجر QR",
    "qr_stores.qr_store_description": "رمز QR للعملاء لمسح وشراء المنتجات",
    "qr_stores.analytics": "الإحصائيات",
    "qr_stores.views": "المشاهدات",
    "qr_stores.conversion_rate": "معدل التحويل",

    // Shelves Page
    "shelves.header_description": "تابع حالة كل رف في فروعك، واعرف ما يتأجر المساحات المتاحة لزيادة دخلك بسهولة.",
    "shelves.total_rented_shelves": "إجمالي الرفوف المؤجرة",
    "shelves.total_sales": "إجمالي المبيعات",
    "shelves.available_shelves": "الرفوف المتاحة",
    "shelves.increase_from_last_month": "+20.1% من الشهر الماضي",
    "shelves.your_shelves": "رفوفك",
    "shelves.manage_description": "قم بإدارة رفوفك بسهولة عبر جميع الفروع، تابع حالتها، المؤجرين، ومواعيد التحصيل في مكان واحد.",
    "shelves.display_shelf_now": "اعرض رفك الآن",
    "shelves.search_placeholder": "ابحث باسم المؤجر او مدينة الـ...",
    "shelves.all_filter": "الكل",
    "shelves.rented_shelves_filter": "الرفوف المؤجرة",
    "shelves.available_shelves_filter": "الرفوف المتاحة",
    "shelves.table.shelf_name": "اسم الرف",
    "shelves.table.branch_name": "اسم الفرع",
    "shelves.table.renter": "المؤجر",
    "shelves.table.price": "السعر",
    "shelves.table.net_revenue": "الإيراد الصافي",
    "shelves.table.status": "الحالة",
    "shelves.table.next_collection": "التحصيل القادم",
    "shelves.table.available_from": "متاح من",
    "shelves.table.rental_date": "تاريخ الإيجار",
    "shelves.table.action": "إجراء",
    "shelves.status.rented": "مؤجر",
    "shelves.status.available": "متاح",
    "shelves.status.pending": "قيد المراجعة",
    "shelves.status.unavailable": "غير متاح",
    "shelves.view_details": "عرض التفاصيل",
    "shelves.total_shelves": "إجمالي الرفوف",
    "shelves.from_rented_shelves": "من الرفوف المؤجرة",
    "shelves.pending_approval": "قيد الموافقة",
    "shelves.no_shelves_found": "لا توجد رفوف",
    "shelves.shelves_will_appear_here": "ستظهر الرفوف هنا عند إضافتها",
    "shelves.showing": "عرض",
    "shelves.of": "من",
    "shelves.shelves": "رفوف",

    // Add Shelf
    "add_shelf.title": "أضف رفًا جديدًا لفرع من فروع محلك",
    "add_shelf.description": "🍊 قم بتسجيل مساحة عرض جديدة لتكون متاحة للعلامات التجارية على شبر، وحدد موقعها، وسعرها، وطريقة تأجيرها",
    "add_shelf.shelf_name": "اسم الرف",
    "add_shelf.shelf_name_placeholder": "رف واجهة",
    "add_shelf.city": "المدينة",
    "add_shelf.city_placeholder": "مثال: جدة، الرياض، الدمام",
    "add_shelf.branch": "الفرع",
    "add_shelf.branch_placeholder": "مثال: حي الروضة، شارع الملك فهد",
    "add_shelf.discount_percentage": "نسبة المحل من المبيعات",
    "add_shelf.discount_percentage_tooltip": "السعر سوف يضاف عليه نسبة شبر هي {fee}%",
    "add_shelf.discount_placeholder": "مثال 5 %",
    "add_shelf.monthly_price": "سعر الاشتراك الشهري",
    "add_shelf.monthly_price_tooltip": "شبر تأخذ عمولة {fee}% من سعر الاشتراك",
    "add_shelf.price_placeholder_min": "مثال 500 ريال",
    "add_shelf.price_placeholder_max": "580 ريال",
    "add_shelf.available_from": "متاح من",
    "add_shelf.available_date": "أبريل",
    "add_shelf.rental_duration": "أبعاد الرف",
    "add_shelf.length": "الطول",
    "add_shelf.width": "العرض",
    "add_shelf.depth": "العمق",
    "add_shelf.product_type": "نوع المنتجات المناسبة ( اختياري )",
    "add_shelf.suitable_product_types": "فئات المنتجات المناسبة (اختياري)",
    "add_shelf.select_all_categories": "اختر جميع الفئات التي يمكن عرضها على هذا الرف",

    // Product Categories - Simplified
    "product_categories.food_beverages": "أطعمة ومشروبات",
    "product_categories.health_beauty": "صحة وجمال",
    "product_categories.fashion": "أزياء وإكسسوارات",
    "product_categories.electronics": "إلكترونيات",
    "product_categories.home_living": "منزل ومعيشة",
    "product_categories.kids_baby": "أطفال ورضع",
    "product_categories.sports_fitness": "رياضة ولياقة",
    "product_categories.books_stationery": "كتب وقرطاسية",
    "product_categories.other": "أخرى",

    // Business Categories - Stores
    "business_categories.البقالات والسوبر ماركت": "البقالات والسوبر ماركت",
    "business_categories.المتاجر الإلكترونية": "المتاجر الإلكترونية",
    "business_categories.متاجر الملابس والأزياء": "متاجر الملابس والأزياء",
    "business_categories.متاجر الأحذية": "متاجر الأحذية",
    "business_categories.متاجر الأدوات المنزلية": "متاجر الأدوات المنزلية",
    "business_categories.متاجر الأثاث": "متاجر الأثاث",
    "business_categories.متاجر الأدوات والمعدات": "متاجر الأدوات والمعدات",
    "business_categories.مكتبات وقرطاسية": "مكتبات وقرطاسية",
    "business_categories.مطاعم ومقاهي": "مطاعم ومقاهي",
    "business_categories.متاجر المواد الغذائية": "متاجر المواد الغذائية",
    "business_categories.مخابز ومعجنات": "مخابز ومعجنات",
    "business_categories.جزارات ولحوم": "جزارات ولحوم",
    "business_categories.متاجر الخضار والفواكه": "متاجر الخضار والفواكه",
    "business_categories.صيدليات": "صيدليات",
    "business_categories.مراكز التجميل": "مراكز التجميل",
    "business_categories.متاجر مستحضرات التجميل": "متاجر مستحضرات التجميل",
    "business_categories.عيادات طبية": "عيادات طبية",
    "business_categories.مختبرات طبية": "مختبرات طبية",
    "business_categories.خدمات الصيانة والإصلاح": "خدمات الصيانة والإصلاح",
    "business_categories.خدمات النظافة": "خدمات النظافة",
    "business_categories.خدمات النقل والتوصيل": "خدمات النقل والتوصيل",
    "business_categories.خدمات التعليم": "خدمات التعليم",
    "business_categories.مكاتب محاسبة": "مكاتب محاسبة",
    "business_categories.متاجر الهواتف والإكسسوارات": "متاجر الهواتف والإكسسوارات",
    "business_categories.مراكز صيانة الهواتف": "مراكز صيانة الهواتف",
    "business_categories.متاجر الحواسيب والأجهزة": "متاجر الحواسيب والأجهزة",
    "business_categories.شركات الاتصالات": "شركات الاتصالات",
    "business_categories.معارض السيارات": "معارض السيارات",
    "business_categories.ورش صيانة السيارات": "ورش صيانة السيارات",
    "business_categories.متاجر قطع غيار السيارات": "متاجر قطع غيار السيارات",
    "business_categories.محطات الوقود": "محطات الوقود",
    "business_categories.متاجر الألعاب والترفيه": "متاجر الألعاب والترفيه",
    "business_categories.متاجر المعدات الرياضية": "متاجر المعدات الرياضية",
    "business_categories.صالات الألعاب الرياضية": "صالات الألعاب الرياضية",
    "business_categories.مراكز الترفيه": "مراكز الترفيه",
    "business_categories.مكاتب عقارية": "مكاتب عقارية",
    "business_categories.متاجر مواد البناء": "متاجر مواد البناء",
    "business_categories.ورش البناء والمقاولات": "ورش البناء والمقاولات",
    "business_categories.مكاتب استشارات": "مكاتب استشارات",
    "business_categories.مكاتب محاماة": "مكاتب محاماة",
    "business_categories.مكاتب تأمين": "مكاتب تأمين",
    "business_categories.متاجر الهدايا والهدايا التذكارية": "متاجر الهدايا والهدايا التذكارية",
    "business_categories.خدمات أخرى": "خدمات أخرى",
    "business_categories.مركز تسوق": "مركز تسوق",
    "business_categories.مركز تجاري": "مركز تجاري",
    "business_categories.سوق شعبي": "سوق شعبي",
    "business_categories.معرض فني": "معرض فني",
    "business_categories.متجر كبير": "متجر كبير",
    "add_shelf.product_type_placeholder": "مثال : كماليس / كوبيات / اجهزة",
    "add_shelf.description_label": "الوصف ( اختياري )",
    "add_shelf.description_placeholder": "مثال : 'كتاب الباب - يمين الداخل'",
    "add_shelf.title_label": "العنوان",
    "add_shelf.address_label": "العنوان",
    "add_shelf.location_on_map": "اختر على الخريطة",
    "add_shelf.address": "حطين، الرياض 13512، المملكة العربية السعودية",
    "add_shelf.no_location_selected": "لم يتم تحديد موقع",
    "add_shelf.location_selected": "تم تحديد الموقع على الخريطة",
    "add_shelf.click_to_select_location": "انقر لتحديد الموقع على الخريطة",
    "add_shelf.map_instructions": "استخدم الأزرار لتحديد المدينة أو أدخل الإحداثيات يدوياً",
    "add_shelf.center_riyadh": "الرياض",
    "add_shelf.center_jeddah": "جدة",
    "add_shelf.center_dammam": "الدمام",
    "add_shelf.latitude": "خط العرض",
    "add_shelf.longitude": "خط الطول",
    "add_shelf.shelf_image": "صورة الرف",
    "add_shelf.shelf_images": "صور الرف",
    "add_shelf.upload_shelf_image": "صورة الرف",
    "add_shelf.upload_shelf_image_desc": "حجم الملف لا يزيد عن 10 ميجابايت - JPG, PNG, GIF, WebP",
    "add_shelf.upload_interior_image": "صورة المحل من الداخل",
    "add_shelf.upload_interior_image_desc": "حجم الملف لا يزيد عن 10 ميجابايت - JPG, PNG, GIF, WebP",
    "add_shelf.upload_exterior_image": "صورة المحل من الخارج",
    "add_shelf.upload_exterior_image_desc": "حجم الملف لا يزيد عن 10 ميجابايت - JPG, PNG, GIF, WebP",
    "add_shelf.submit_button": "نشر الرف الآن",
    "add_shelf.update_button": "تحديث الرف",
    "add_shelf.price_increase_notice": "السعر سوف يضاف عليه نسبة تتراوح {fee}%",
    "add_shelf.price_fee_notice": "السعر سوف يضاف عليه نسبة شبر هي",
    "add_shelf.shibr_percentage": "نسبة شبر",
    "add_shelf.shelf_dimensions": "أبعاد الرف",
    "add_shelf.success_message": "تم إضافة الرف بنجاح وهو متاح الآن للتأجير",
    "add_shelf.update_success_message": "تم تحديث الرف بنجاح",
    "add_shelf.max_discount_error": "الحد الأقصى للخصم هو {max}%",
    "add_shelf.platform_fee_notice": "السعر سوف يضاف عليه نسبة شبر هي {fee}%",
    "add_shelf.error_message": "حدث خطأ أثناء إضافة الرف. يرجى المحاولة مرة أخرى",
    "add_shelf.file_size_error": "حجم الملف يجب ألا يتجاوز 10 ميجابايت",
    "add_shelf.discount_max_error": "النسبة يجب ألا تتجاوز 22%",
    "add_shelf.discount_max_error_dynamic": "الحد الأقصى للخصم هو",
    "add_shelf.description_optional": "الوصف (اختياري)",
    "add_shelf.description_example": "مثال: يجانب الباب - يمين الداخل",
    "add_shelf.loading_map": "جاري تحميل الخريطة...",
    "add_shelf.click_map_to_select": "انقر على الخريطة لتحديد الموقع",
    "add_shelf.location": "الموقع",
    "add_shelf.location_permission_denied": "استخدام الموقع الافتراضي - يمكنك تحديد الموقع يدوياً على الخريطة",
    "add_shelf.required_fields_error": "يرجى ملء جميع الحقول المطلوبة",
    "add_shelf.submit_error": "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى",
    "add_shelf.price_must_be_positive": "السعر الشهري يجب أن يكون أكبر من صفر",
    "add_shelf.commission_must_be_positive": "نسبة العمولة يجب أن تكون أكبر من صفر",
    "add_shelf.dimensions_must_be_positive": "أبعاد الرف (الطول والعرض والعمق) يجب أن تكون أكبر من صفر",
    "add_shelf.cm": "سم",
    "add_shelf.dimension_placeholder": "0",
    "add_shelf.enter_dimensions": "أدخل الأبعاد",
    "add_shelf.total_size": "الحجم الكلي",
    "add_shelf.pick_date": "اختر التاريخ",
    "add_shelf.discount_percentage_placeholder": "0",
    "add_shelf.monthly_price_placeholder": "0",
    "add_shelf.uploading_images": "جاري رفع الصور...",
    "shelves.new_shelf": "رف جديد",
    "shelves.riyadh_shelf": "رف الرياض",
    "shelves.dammam_shelf": "رف الدمام",
    "shelves.select_branch": "اختر الفرع",
    "shelves.select_branch_placeholder": "اختر فرع المتجر",
    "shelves.no_branches_available": "لا توجد فروع متاحة. يرجى إنشاء فرع أولاً.",
    "shelves.store_images_from_branch": "صور المتجر (من الفرع)",
    "shelves.select_city": "اختر المدينة",
    "shelves.address": "العنوان",
    "shelves.enter_address": "أدخل العنوان",
    "shelves.coordinates": "الإحداثيات",
    "shelves.city": "المدينة",
    "dashboard.orders": "الطلبات",
    "dashboard.settings": "الإعدادات",
    "dashboard.branches": "الفروع",
    "dashboard.marketplace": "السوق",
    "dashboard.profile": "الملف الشخصي",
    "dashboard.posts": "المنشورات",
    "dashboard.stores": "المتاجر",
    "dashboard.brands": "العلامات التجارية",
    "dashboard.payments": "المدفوعات",
    "dashboard.logout": "تسجيل الخروج",
    "dashboard.view_landing_page": "عرض الصفحة الرئيسية",
    "dashboard.user.profile": "الملف الشخصي",
    "dashboard.user.settings": "الإعدادات",
    "dashboard.user.name": "اسم المستخدم",
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
    "dashboard.complete_profile_first": "يرجى استكمال بيانات متجرك أولاً",
    "dashboard.profile_complete": "ملفك الشخصي مكتمل",
    "dashboard.complete_your_profile": "أكمل ملفك الشخصي",
    "dashboard.missing_fields": "حقول مفقودة: {count}",
    "dashboard.complete_now": "أكمل الآن",
    "dashboard.manage_store_starts_here": "إدارة محلك تبدأ من هنا",
    "dashboard.display_shelf_now": "اعرض رف الآن",
    "dashboard.monitor_performance_description": "راقب أدائك، اعرض رفوفك للتأجير، وابدأ في زيادة دخلك مع شبر.",
    "dashboard.currently_rented_brands": "عدد العلامات المؤجرة حاليًا",
    "dashboard.total_sales": "إجمالي المبيعات",
    "dashboard.incoming_orders": "الطلبات الواردة",
    "dashboard.increase_from_last_month": "+20.1% من الشهر الماضي",
    "dashboard.new_rental_requests": "طلبات الإيجار الجديدة",
    "dashboard.see_more": "رؤية المزيد",
    "dashboard.no_rental_requests": "لا يوجد لديك طلبات للإيجار",
    "dashboard.rental_requests_will_appear_here": "ستظهر طلبات الإيجار هنا عند وصولها",
    "dashboard.your_shelves": "رفوفك",
    "dashboard.no_shelves_displayed": "ليس لديك رفوف معروضه في الوقت الحالي",
    "dashboard.shelves_will_appear_here": "ستظهر الرفوف هنا عند إضافتها",

    // Admin Dashboard
    "dashboard.control_panel": "لوحة التحكم",
    "dashboard.platform_overview": "نظرة شاملة على أداء شبر وإحصائياتها",
    "dashboard.total_users": "عدد المستخدمين الكلي",
    "dashboard.from_last_month": "من الشهر الماضي",
    "dashboard.from_yesterday": "من الأمس",
    "dashboard.from_last_week": "من الأسبوع الماضي",
    "dashboard.from_last_year": "من السنة الماضية",
    "dashboard.shelves_count": "عدد الرفوف",
    "dashboard.rented": "مؤجر",
    "dashboard.available": "متاح",
    "dashboard.total_revenue": "إجمالي الإيرادات",
    "dashboard.from_rentals": "من عمليات التأجير",
    "dashboard.rental_requests": "طلبات الإيجار",
    "dashboard.revenue_rate": "معدل الإيرادات",
    "dashboard.revenue_overview": "معدل الإيرادات",
    "dashboard.total_revenue_from_platform": "إجمالي الإيرادات من شبر",
    "dashboard.live": "مباشر",
    "dashboard.top_performing_stores": "أكثر البرندات مبيعاً",
    "dashboard.based_on_monthly_revenue": "بناءً على الإيرادات الشهرية",
    "dashboard.store_name": "اسم المتجر",
    "dashboard.brand_name": "اسم البرند",
    "dashboard.revenue": "الإيرادات",
    "dashboard.growth": "النمو",
    "dashboard.no_stores_data": "لا توجد بيانات برندات متاحة",
    "dashboard.yearly": "سنوي",
    "dashboard.monthly": "شهري",
    "dashboard.weekly": "أسبوعي",
    "dashboard.daily": "يومي",
    "dashboard.top_selling_products": "أكثر المنتجات مبيعاً",
    "dashboard.increase_by": "ارتفاع بنسبة",
    "dashboard.this_month": "هذا الشهر",
    "dashboard.show_total_turnover": "عرض إجمالي الدوران لفترة الشهر",
    "dashboard.stores_management": "إدارة المحلات",
    "dashboard.branch": "الفرع",
    "dashboard.shelf_name": "اسم الرف",
    "dashboard.date_added": "تاريخ الإضافة",
    "dashboard.status": "الحالة",
    "dashboard.options": "خيارات",
    "dashboard.view": "عرض",
    "dashboard.edit": "تعديل",
    "dashboard.reject": "رفض",
    "dashboard.status_under_review": "قيد المراجعة",
    "dashboard.status_accepted": "مقبول",

    // Branches Page
    "branches.page_title": "إدارة الفروع",
    "branches.add_branch": "إضافة فرع",
    "branches.branch_name": "اسم الفرع",
    "branches.all_filter": "الكل",
    "branches.active_filter": "نشط",
    "branches.inactive_filter": "غير نشط",
    "branches.search_placeholder": "ابحث باسم الفرع أو المدينة...",
    "branches.stats.total": "إجمالي الفروع",
    "branches.stats.active": "فروع نشطة",
    "branches.stats.total_shelves": "إجمالي الرفوف",
    "branches.create_title": "إضافة فرع جديد",
    "branches.create_description": "أضف فرع جديد لمتجرك مع الموقع والصور",
    "branches.edit_title": "تعديل الفرع",
    "branches.edit_description": "قم بتحديث تفاصيل الفرع",
    "branches.branch_name_label": "اسم الفرع",
    "branches.branch_name_placeholder": "مثال: فرع الرياض الرئيسي",
    "branches.city_label": "المدينة",
    "branches.location_label": "الموقع",
    "branches.exterior_image_label": "صورة المتجر الخارجية",
    "branches.interior_image_label": "صورة المتجر الداخلية",
    "branches.created_success": "تم إنشاء الفرع بنجاح",
    "branches.updated_success": "تم تحديث الفرع بنجاح",
    "branches.deleted_success": "تم حذف الفرع بنجاح",
    "branches.branch_name_required": "اسم الفرع مطلوب",
    "branches.city_required": "المدينة مطلوبة",
    "branches.address_required": "العنوان مطلوب",
    "branches.delete_error_has_shelves": "لا يمكن حذف الفرع لأنه يحتوي على رفوف. يرجى حذف الرفوف أولاً.",
    "branches.no_branches": "لا توجد فروع",
    "branches.no_branches_description": "ابدأ بإضافة فرع لمتجرك",
    "branches.shelves_count": "عدد الرفوف",
    "branches.delete_confirm_title": "هل أنت متأكد من حذف هذا الفرع؟",
    "branches.delete_confirm_description": "سيتم حذف فرع {name}. هذا الإجراء لا يمكن التراجع عنه.",
    "branches.details": "تفاصيل الفرع",
    "branches.branch_details": "تفاصيل الفرع",
    "branches.images": "الصور",
    "branches.no_images": "لا توجد صور",
    "branches.shelves_in_branch": "الرفوف في هذا الفرع",
    "branches.upload_exterior_image": "صورة المحل من الخارج",
    "branches.upload_interior_image": "صورة المحل من الداخل",

    // Posts Page
    "posts.title": "طلبات النشر للرفوف",
    "posts.description": "راجع بيانات الرفوف التي أضافها أصحاب المحلات، وتحقق من تفاصيلها قبل الموافقة على النشر داخل شبر.",
    "posts.all_shelves": "جميع الرفوف",
    "posts.shelves_tab": "الرفوف",
    "posts.new_post": "منشور جديد",
    "posts.total_posts": "إجمالي المنشورات",
    "posts.active_posts": "منشورات نشطة",
    "posts.under_review": "قيد المراجعة",
    "posts.drafts": "مسودات",
    "posts.search_placeholder": "البحث في المنشورات...",
    "posts.filter": "تصفية",
    "posts.filter_all": "الكل",
    "posts.all_posts": "جميع المنشورات",
    "posts.table.title": "العنوان",
    "posts.table.author": "الكاتب",
    "posts.table.category": "الفئة",
    "posts.table.status": "الحالة",
    "posts.table.date": "التاريخ",
    "posts.table.views": "المشاهدات",
    "posts.table.actions": "الإجراءات",
    "posts.table.percentage": "النسبة المئوية",
    "posts.status.published": "منشور",
    "posts.status.under_review": "قيد المراجعة",
    "posts.status.draft": "مسودة",
    "posts.status.rented": "مؤجر",
    "posts.status.rejected": "مرفوض",
    "posts.no_results": "لم يتم العثور على نتائج",
    "posts.no_posts": "لا توجد منشورات حتى الآن",
    "posts.try_different_filter": "جرب استخدام فلاتر مختلفة أو مصطلحات بحث أخرى",
    "posts.posts_will_appear_here": "ستظهر منشورات الرفوف هنا بمجرد إضافتها من قبل أصحاب المحلات",
    "posts.clear_filters": "مسح الفلاتر",
    "posts.category.announcements": "إعلانات",
    "posts.category.offers": "عروض",
    "posts.category.products": "منتجات",
    "posts.category.tips": "نصائح",
    "posts.actions.view": "عرض",
    "posts.actions.edit": "تعديل",
    "posts.actions.delete": "حذف",

    // Stores Page
    "stores.title": "المحلات التجارية المسجّلة على شبر",
    "stores.description": "نظرة شاملة على أداء المحلات لدي شبر",
    "stores.add_store": "إضافة محل",
    "stores.total_stores": "إجمالي المحلات",
    "stores.active_stores": "محلات نشطة",
    "stores.total_shelves": "إجمالي الرفوف",
    "stores.rented_shelves": "الرفوف المؤجرة",
    "stores.under_review": "قيد المراجعة",
    "stores.suspended": "معلقة",
    "stores.search_placeholder": "البحث في المحلات...",
    "stores.filter": "تصفية",
    "stores.all_stores": "جميع المحلات",
    "stores.stores_tab": "المحلات",
    "stores.table.store": "المحل",
    "stores.table.owner": "المالك",
    "stores.table.location": "الموقع",
    "stores.table.category": "الفئة",
    "stores.table.rating": "التقييم",
    "stores.table.shelves": "عدد الرفوف",
    "stores.table.rentals": "عدد الإيجارات",
    "stores.table.status": "الحالة",
    "stores.table.revenue": "الإيرادات",
    "stores.table.actions": "الإجراءات",
    "stores.status.active": "نشط",
    "stores.status.under_review": "قيد المراجعة",
    "stores.status.suspended": "معلق",
    "stores.actions.view_details": "عرض التفاصيل",
    "stores.actions.edit": "تعديل",
    "stores.actions.suspend": "تعليق",
    "stores.category.electronics": "إلكترونيات",
    "stores.category.beauty": "تجميل",
    "stores.category.perfumes": "عطور",
    "stores.category.sports": "رياضة",
    "stores.category.cafes": "مقاهي",
    "stores.no_results": "لا توجد نتائج",
    "stores.no_stores": "لا توجد محلات بعد",
    "stores.try_different_search": "جرب البحث بكلمة مختلفة",
    "stores.stores_will_appear_here": "ستظهر المحلات هنا عند إضافتها",
    "stores.overview": "نظرة عامة",
    "stores.rentals": "الإيجارات",
    "stores.performance": "الأداء",
    "stores.payment_summary": "ملخص المدفوعات",
    "stores.payments": "المدفوعات",
    "stores.month_column": "الشهر",
    "stores.rented_shelves_count": "عدد الرفوف المؤجرة",
    "stores.total_income": "الدخل الإجمالي",
    "stores.payment_method": "وسيلة الدفع",
    "stores.owner": "المالك",
    "stores.location": "الموقع",
    "stores.join_date": "تاريخ الانضمام",
    "stores.utilization": "معدل الاستخدام",
    "stores.shelves_count": "عدد الرفوف",
    "stores.renters_count": "عدد المؤجرين",
    "stores.total_revenue": "إجمالي الإيرادات",
    "stores.active_rentals": "الإيجارات النشطة",
    "stores.monthly_revenue": "الإيرادات الشهرية",
    "stores.branches": "الفروع",
    "stores.branch_name": "اسم الفرع",
    "stores.city": "المدينة",
    "stores.rented": "مؤجر",
    "stores.available": "متاح",
    "stores.brand": "العلامة التجارية",
    "stores.product": "المنتج",
    "stores.shelf": "الرف",
    "stores.period": "الفترة",
    "stores.price": "السعر",
    "stores.store_name_rental": "اسم المتجر",
    "stores.rented_shelf": "الرف المؤجر",
    "stores.duration": "المدة",
    "stores.payment": "الدفع",
    "stores.status": "الحالة",
    "stores.rental_status.active": "نشط",
    "stores.rental_status.pending": "قيد الانتظار",
    "stores.rental_status.payment_pending": "بانتظار الدفع",
    "stores.rental_status.completed": "مكتمل",
    "stores.rental_status.cancelled": "ملغي",
    "stores.rental_status.rejected": "مرفوض",
    "stores.rental_status.expired": "منتهي",
    "stores.revenue_trend": "اتجاه الإيرادات",
    "stores.last_3_months": "آخر 3 أشهر",
    "stores.month": "الشهر",
    "stores.revenue": "الإيرادات",
    "stores.rentals_count": "عدد الإيجارات",
    "stores.avg_rental_value": "متوسط قيمة الإيجار",
    "stores.activate": "تفعيل",
    "stores.suspend": "تعليق",
    "stores.view_profile": "عرض الملف",
    "stores.suspend_account": "تعليق الحساب",
    "stores.delete_store": "حذف المحل",
    "stores.store_name": "اسم المحل",
    "stores.store_owner": "صاحب المحل",
    "stores.store_information": "معلومات المحل",
    "stores.branches_count": "عدد الفروع",
    "stores.registration_date": "تاريخ التسجيل",
    "stores.commercial_registry_number": "رقم السجل التجاري",
    "stores.commercial_registry": "السجل التجاري",
    "stores.shelves": "الرفوف",
    "stores.shelf_name": "اسم الرف",
    "stores.branch": "الفرع",
    "stores.monthly_price": "السعر الشهري",
    "stores.rented_to": "مؤجر إلى",
    "stores.options": "خيارات",
    "stores.shelf_status.active": "نشط",
    "stores.shelf_status.rented": "مؤجر",
    "stores.shelf_status.available": "متاح",
    "stores.shelf_status.suspended": "معلق",
    "stores.shelf_status.under_review": "قيد المراجعة",
    "stores.shelf_status.rejected": "مرفوض",
    "stores.filter.all": "الكل",
    "stores.search_shelves_placeholder": "ابحث بالاسم أو الفرع",
    "stores.no_shelves": "لا توجد رفوف",
    "stores.no_shelves_found": "لا توجد رفوف مطابقة",
    "stores.shelves_will_appear_here": "ستظهر الرفوف هنا عند إضافتها",
    "stores.try_different_filter": "جرب تصفية مختلفة",
    "stores.store_details": "تفاصيل المتجر",
    "stores.shelf_details": "تفاصيل الرف",
    "stores.no_rentals": "لا توجد إيجارات",
    "stores.rentals_will_appear_here": "ستظهر الإيجارات هنا عند إضافتها",
    "stores.no_payments": "لا توجد مدفوعات",
    "stores.payments_will_appear_here": "ستظهر المدفوعات هنا عند إضافتها",

    // Brands page
    "brands.title": "العلامات التجارية",
    "brands.description": "نظرة شاملة على أداء العلامات التجارية في شبر",
    "brands.total_brands": "إجمالي العلامات التجارية",
    "brands.total_products": "إجمالي المنتجات",
    "brands.total_revenue": "إجمالي الإيرادات",
    "brands.all_brands": "جميع العلامات التجارية",
    "brands.search_placeholder": "البحث عن العلامات التجارية...",
    "brands.table.brand": "العلامة التجارية",
    "brands.table.category": "الفئة",
    "brands.table.products": "المنتجات",
    "brands.table.stores": "المحلات",
    "brands.table.revenue": "الإيرادات",
    "brands.table.status": "الحالة",
    "brands.status.active": "نشط",
    "brands.status.suspended": "معلق",
    "brands.category.general": "عام",
    "brands.category.registered_company": "شركة مسجلة",
    "brands.category.freelancer": "عمل حر",
    "brands.category.sports": "رياضة",
    "brands.category.electronics": "إلكترونيات",
    "brands.category.Electronics": "إلكترونيات",
    "brands.category.fashion": "أزياء",
    "brands.category.Fashion": "أزياء",
    "brands.category.food": "أغذية",
    "brands.category.Food": "أغذية",
    "brands.category.beverages": "مشروبات",
    "brands.category.Beverages": "مشروبات",
    "brands.category.home": "منزلية",
    "brands.category.Home": "منزلية",
    "brands.category.health": "صحة",
    "brands.category.Health": "صحة",
    "brands.category.toys": "ألعاب",
    "brands.category.Toys": "ألعاب",
    "brands.category.books": "كتب",
    "brands.category.Books": "كتب",
    "brands.category.clothing": "ملابس",
    "brands.category.Clothing": "ملابس",
    "brands.category.T Shirts": "تي شيرت",
    "brands.category.T-Shirts": "تي شيرت",
    "brands.category.t-shirts": "تي شيرت",
    "brands.overview": "نظرة عامة",
    "brands.stores": "المحلات",
    "brands.payment_summary": "ملخص المدفوعات",
    "brands.suspend_account": "تعليق الحساب",
    "brands.delete_brand": "حذف العلامة التجارية",
    "brands.brand_name": "اسم العلامة التجارية",
    "brands.brand_owner": "صاحب العلامة التجارية",
    "brands.owner_name": "اسم المالك",
    "brands.brand_details": "تفاصيل العلامة التجارية",
    "brands.brand_information": "معلومات العلامة التجارية",
    "brands.join_date": "تاريخ الانضمام",
    "brands.registration_number": "رقم السجل التجاري",
    "brands.registration_document": "وثيقة السجل التجاري",
    "brands.registration_date": "تاريخ التسجيل",
    "brands.commercial_registry_number": "رقم السجل التجاري",
    "brands.commercial_registry": "السجل التجاري",
    "brands.download": "تحميل",
    "brands.products": "المنتجات",
    "brands.products_displayed": "المنتجات المعروضة",
    "brands.search_products_placeholder": "ابحث في المنتجات",
    "brands.product_name": "اسم المنتج",
    "brands.product_code": "كود المنتج",
    "brands.price": "السعر",
    "brands.quantity": "الكمية",
    "brands.sales": "المبيعات",
    "brands.stores_count": "عدد المحلات",
    "brands.stores_list": "قائمة المحلات",
    "brands.search_stores_placeholder": "ابحث في المحلات",
    "brands.store_name": "اسم المحل",
    "brands.city": "المدينة",
    "brands.shelves_count": "عدد الرفوف",
    "brands.products_count": "عدد المنتجات",
    "brands.revenue": "الإيرادات",
    "brands.status": "الحالة",
    "brands.month_column": "الشهر",
    "brands.products_sold": "المنتجات المباعة",
    "brands.total_income": "الدخل الإجمالي",
    "brands.payment_method": "وسيلة الدفع",
    "brands.total_stores": "إجمالي المحلات",
    "brands.status.inactive": "غير نشط",
    "brands.total_payments_due": "إجمالي المدفوعات المستحقة",
    "brands.rented_shelves_count": "عدد الرفوف المؤجرة",
    "brands.payment_collection_log": "سجل عمليات الدفع والتحصيل",
    "brands.displayed_products": "المنتجات المعروضة",
    "brands.invoice_number": "رقم الفاتورة",
    "brands.payment_date": "تاريخ الدفع",
    "brands.payment_status": "حالة الدفع",
    "brands.collection_date": "تاريخ التحصيل",
    "brands.paid": "مدفوع",
    "brands.pending": "معلق",
    "brands.no_payments": "لا توجد مدفوعات",
    "brands.payments_will_appear_here": "ستظهر المدفوعات هنا عند توفرها",
    "brands.no_products": "لا توجد منتجات",
    "brands.display_date": "تاريخ العرض",
    "brands.product_image": "الصورة",
    "brands.sales_count": "عدد المبيعات",
    "brands.search_payments_placeholder": "ابحث في المدفوعات...",
    "brands.select_month": "اختر الشهر",
    "brands.filter_all": "الكل",
    "brands.filter_completed": "مكتملة",
    "brands.filter_needs_collection": "يحتاج تحصيل",
    "brands.filter_upcoming": "القادمة",
    "brands.store_owner": "صاحب المحل",
    "brands.website": "الموقع الإلكتروني",
    "brands.contact_method": "وسيلة التواصل",
    "brands.payment_operations_log": "سجل عمليات الدفع والتحصيل",
    "brands.history": "التاريخ",
    "brands.store": "المحل",
    "brands.operation_type": "طريقة الدفع",
    "brands.amount": "السعر",
    "brands.status_column": "الحالة",
    "brands.options": "خيارات",
    "brands.download_invoice": "تحميل الفاتورة",
    "brands.payment_completed": "مكتملة",
    "brands.payment_pending": "بانتظار التأكيد",
    "brands.payment_transfer": "تحويل بنكي",
    "brands.category.beauty": "تجميل",
    "brands.category.health_beauty": "صحة وجمال",
    "brands.no_results": "لا توجد نتائج",
    "brands.no_brands": "لا توجد علامات تجارية",
    "brands.try_different_search": "حاول البحث بكلمات مختلفة",
    "brands.brands_will_appear_here": "ستظهر العلامات التجارية هنا عند إضافتها",
    "brands.products_will_appear_here": "ستظهر المنتجات هنا عند إضافتها",
    "brands.clear_search": "مسح البحث",

    // Posts page
    "posts.post_details": "تفاصيل المنشور",
    "posts.shelf_details": "تفاصيل الرف",
    "posts.store_name": "اسم المحل",
    "posts.branch": "الفرع",
    "posts.shelf_name": "اسم الرف",
    "posts.shelf_size": "حجم الرف",
    "posts.rental_price": "سعر الإيجار",
    "posts.price_with_percentage": "السعر مع النسبة",
    "posts.address": "العنوان",
    "posts.added_date": "تاريخ الإضافة",
    "posts.shelf_dimensions": "أبعاد الرف",
    "posts.suitable_products": "أنواع المنتجات المناسبة",
    "posts.rental_period": "مدة الإيجار",
    "posts.store_info": "مراسلة للمحل",
    "posts.store_field": "المحل",
    "posts.store_branch": "الفرع",
    "posts.store_review_date": "تاريخ الانضمام",
    "posts.rental_method": "طريقة التأجير",
    "posts.contact_method": "وسيلة التواصل",
    "posts.commercial_registry": "السجل التجاري",
    "posts.download_registry": "تحميل السجل",
    "posts.shelf_description": "وصف الرف",
    "posts.shelf_images": "صور الرف",
    "posts.shelf_information": "معلومات الرف",
    "posts.monthly_price": "السعر الشهري",
    "posts.commission_percentage": "نسبة العمولة",
    "posts.date_added": "تاريخ الإضافة",
    "posts.location": "الموقع",
    "posts.dimensions": "الأبعاد",
    "posts.width": "العرض",
    "posts.height": "الارتفاع",
    "posts.depth": "العمق",
    "posts.no_images": "لا توجد صور",
    "posts.store_details": "تفاصيل المحل",
    "posts.store_type": "نوع المحل",
    "posts.retail_store": "محل تجزئة",
    "posts.store_owner": "صاحب المحل",
    "posts.member_since": "عضو منذ",
    "posts.rental_information": "معلومات الإيجار",
    "posts.renter_name": "اسم المستأجر",
    "posts.rental_start_date": "تاريخ بداية الإيجار",
    "posts.rental_end_date": "تاريخ نهاية الإيجار",
    "posts.rental_duration": "مدة الإيجار",
    "posts.view_store": "عرض المحل",
    "posts.back_to_store_details": "العودة لتفاصيل المحل",
    "posts.available": "متاح",
    "posts.rented": "مؤجر",
    "posts.shelf": "الرف",
    "posts.renter_details": "تفاصيل المؤجّر",
    "posts.merchant_name": "اسم التاجر",
    "posts.rental_amount": "مبلغ الإيجار",
    "posts.rental_date": "تاريخ الإيجار",
    "posts.end_date": "تاريخ الانتهاء",
    "posts.shelf_not_rented": "الرف غير مؤجر حالياً",
    "posts.no_renter_details": "لا توجد تفاصيل للمؤجر",
    "posts.approve_post": "الموافقة على المنشور",
    "posts.reject_post": "رفض المنشور",
    "posts.delete_post": "حذف المنشور",
    "posts.small": "صغير",
    "posts.large": "كبير",
    "posts.per_month": "شهرياً",

    // Payments page
    "payments.title": "المدفوعات",
    "payments.description": "إدارة وتتبع جميع المعاملات المالية والمدفوعات",
    "payments.export_report": "تصدير التقرير",
    "payments.total_received": "إجمالي المدفوعات المستلمة",
    "payments.current_month": "مدفوعات الشهر الحالي",
    "payments.pending_payments": "مدفوعات قيد الانتظار",
    "payments.invoices_issued": "عدد الفواتير الصادرة",
    "payments.search_placeholder": "البحث في المعاملات...",
    "payments.filter": "تصفية",
    "payments.filter_all": "الكل",
    "payments.filter_paid": "مدفوع",
    "payments.filter_unpaid": "غير مدفوع",
    "payments.no_results": "لا توجد نتائج",
    "payments.no_payments": "لا توجد مدفوعات",
    "payments.try_different_filter": "جرب تصفية مختلفة",
    "payments.payments_will_appear_here": "ستظهر المدفوعات هنا",
    "payments.all_transactions": "جميع المعاملات",
    "payments.table.invoice_number": "رقم الفاتورة",
    "payments.table.merchant": "التاجر",
    "payments.table.store": "المحل",
    "payments.table.date": "التاريخ",
    "payments.table.amount": "المبلغ",
    "payments.table.percentage": "النسبة",
    "payments.table.method": "الوسيلة",
    "payments.table.status": "الحالة",
    "payments.table.options": "خيارات",
    "payments.type.shelf_rental": "إيجار رف",
    "payments.type.brand_payment": "دفعة من العلامة التجارية",
    "payments.type.store_settlement": "تسوية مع المتجر",
    "payments.type.refund": "استرداد",
    "payments.method.card": "بطاقة",
    "payments.method.credit_card": "بطاقة ائتمان",
    "payments.method.bank_transfer": "تحويل بنكي",
    "payments.method.digital_wallet": "محفظة رقمية",
    "payments.status.paid": "مدفوع",
    "payments.status.unpaid": "غير مدفوع",
    "payments.actions.view_details": "عرض التفاصيل",
    "payments.actions.download_receipt": "تحميل الإيصال",

    // Admin Settings Page
    "admin.settings.title": "إعدادات النظام",
    "admin.settings.description": "إدارة إعدادات شبر والتحكم في الخصائص",
    "admin.settings.general": "إعدادات عامة",
    "admin.settings.users": "إدارة المسؤولين",
    "admin.settings.general_title": "الإعدادات العامة",
    "admin.settings.platform_name": "اسم شبر",
    "admin.settings.platform_url": "رابط شبر",
    "admin.settings.platform_description": "وصف شبر",
    "admin.settings.language_region": "إعدادات اللغة والمنطقة",
    "admin.settings.default_language": "اللغة الافتراضية",
    "admin.settings.timezone": "المنطقة الزمنية",
    "admin.settings.save_changes": "حفظ التغييرات",
    "admin.settings.users_title": "إدارة المسؤولين",
    "admin.settings.allow_registration": "السماح بالتسجيل الجديد",
    "admin.settings.allow_registration_desc": "السماح للمستخدمين الجدد بالتسجيل",
    "admin.settings.email_verification": "تفعيل البريد الإلكتروني مطلوب",
    "admin.settings.email_verification_desc": "يجب تفعيل البريد قبل استخدام الحساب",
    "admin.settings.review_stores": "مراجعة المحلات الجديدة",
    "admin.settings.review_stores_desc": "مراجعة المحلات قبل الموافقة عليها",
    "admin.settings.user_limits": "حدود المستخدمين",
    "admin.settings.max_stores_per_user": "الحد الأقصى للمحلات لكل مستخدم",
    "admin.settings.max_shelves_per_store": "الحد الأقصى للرفوف لكل محل",
    "admin.settings.save_user_settings": "حفظ إعدادات المستخدمين",

    // Admin Roles
    "admin.role.super_admin": "مدير عام",
    "admin.role.support": "دعم فني",
    "admin.role.finance": "مالية",
    "admin.role.operations": "عمليات",

    // Business Types
    "business_type.registered_company": "شركة مسجلة",
    "business_type.freelancer": "عمل حر",

    // Transfer Status
    "transfer_status.pending": "قيد الانتظار",
    "transfer_status.processing": "قيد المعالجة",
    "transfer_status.completed": "مكتمل",
    "transfer_status.failed": "فشل",

    // Support Ticket Status
    "support_ticket.status.new": "جديد",
    "support_ticket.status.in_progress": "قيد المعالجة",
    "support_ticket.status.resolved": "تم الحل",
    "support_ticket.status.closed": "مغلق",

    // Contact Form Subjects
    "contact.subject.general": "استفسار عام",
    "contact.subject.support": "دعم فني",
    "contact.subject.business": "شراكة أعمال",
    "contact.subject.complaint": "شكوى",

    // Contact Page
    "contact.page_title": "على مدار الساعة شبر متواجدين لدعمك",
    "contact.page_description": "حنّا هنا جاهزين لأي استفسارات أو حلول أو اقتراحات..",
    "contact.info_title": "معلومات التواصل",
    "contact.info_phone": "الهاتف",
    "contact.info_email": "البريد الإلكتروني",
    "contact.info_address": "العنوان",
    "contact.info_working_hours": "ساعات العمل",
    "contact.address_value": "الرياض، المملكة العربية السعودية",
    "contact.working_hours_value": "الأحد - الخميس: 9:00 ص - 6:00 م",
    "contact.follow_us": "تابعنا على",
    "contact.send_message_title": "أرسل لنا رسالة",
    "contact.full_name": "الاسم الكامل",
    "contact.full_name_placeholder": "أدخل اسمك الكامل",
    "contact.email": "البريد الإلكتروني",
    "contact.phone": "رقم الهاتف",
    "contact.message_type": "نوع الرسالة",
    "contact.message": "الرسالة",
    "contact.message_placeholder": "اكتب رسالتك هنا...",
    "contact.sending": "جاري الإرسال...",
    "contact.send_message": "إرسال الرسالة",
    "contact.name_required": "الاسم مطلوب",
    "contact.email_required": "البريد الإلكتروني مطلوب",
    "contact.email_invalid": "البريد الإلكتروني غير صالح",
    "contact.phone_required": "رقم الهاتف مطلوب",
    "contact.phone_invalid": "رقم الهاتف غير صالح",
    "contact.message_required": "الرسالة مطلوبة",
    "contact.message_too_short": "الرسالة يجب أن تكون 10 أحرف على الأقل",
    "contact.sent_successfully": "تم الإرسال بنجاح",
    "contact.sent_success_description": "سنتواصل معك في أقرب وقت ممكن",
    "contact.error": "خطأ",
    "contact.error_description": "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى",
    "contact.message_sent_title": "تم إرسال رسالتك بنجاح",
    "contact.message_sent_description": "شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.",
    "contact.back_to_home": "العودة إلى الصفحة الرئيسية",
    "contact.send_another": "إرسال رسالة أخرى",

    // Chat
    "chat.conversation_closed": "هذه المحادثة مغلقة ولا يمكن إرسال رسائل جديدة",
    "chat.start_conversation_about": "ابدأ محادثة حول",

    // Cities
    "city.riyadh": "الرياض",
    "city.jeddah": "جدة",
    "city.dammam": "الدمام",
    "city.mecca": "مكة",
    "city.medina": "المدينة المنورة",
    "city.khobar": "الخبر",
    "city.taif": "الطائف",
    "city.tabuk": "تبوك",
    "city.abha": "أبها",

    // Shelf Names
    "shelf_name.front_display": "العرض الأمامي",
    "shelf_name.premium_shelf": "الرف المميز",
    "shelf_name.corner_unit": "وحدة الزاوية",
    "shelf_name.main_aisle": "الممر الرئيسي",
    "shelf_name.sports_section": "قسم الرياضة",
    "shelf_name.electronics_corner": "ركن الإلكترونيات",
    "shelf_name.entrance_display": "عرض المدخل",
    "shelf_name.central_aisle": "الممر المركزي",

    // Platform Commission Settings
    "admin.settings.commission_settings": "إعدادات العمولة",
    "admin.brand_sales_commission": "عمولة مبيعات العلامة التجارية",
    "admin.store_rent_commission": "عمولة إيجار الرفوف",
    "admin.brand_commission_desc": "النسبة المحتسبة على مبيعات منتجات العلامة التجارية",
    "admin.store_commission_desc": "النسبة المحتسبة على رسوم إيجار الرفوف",
    "admin.commission_percentage_symbol": "%",

    // Settings Page
    "settings.title": "الإعدادات",
    "settings.description": "إدارة إعدادات متجرك وحسابك",
    "settings.brand_description": "إدارة إعدادات علامتك التجارية وحسابك",
    "settings.tabs.general": "عام",
    "settings.tabs.store_data": "بيانات المحل",
    "settings.tabs.brand_data": "بيانات العلامة التجارية",
    "settings.tabs.payment": "إعدادات الدفع",
    "settings.tabs.security": "الأمان",
    "settings.tabs.branches": "الفروع",
    "settings.tabs.financial": "المالية",
    "settings.tabs.notifications": "الإشعارات",

    // General Settings
    "settings.general.title": "الإعدادات العامة",
    "settings.general.description": "معلومات أساسية عن متجرك",
    "settings.general.logo_placeholder": "شعار",
    "settings.general.upload_logo": "رفع شعار المتجر",
    "settings.general.upload_brand_logo": "رفع شعار العلامة التجارية",
    "settings.general.logo_hint": "PNG, JPG حتى 2MB",
    "settings.general.change_photo": "تغيير الصورة",
    "settings.profile_completion_title": "إكمال الملف الشخصي",
    "settings.profile_complete_description": "ملفك الشخصي مكتمل ويمكنك الآن استخدام جميع الميزات",
    "settings.profile_incomplete_description": "أكمل ملفك الشخصي للاستفادة من جميع ميزات المنصة",
    "settings.fields_completed": "حقول مكتملة",
    "settings.missing_required_fields": "الحقول المطلوبة المفقودة",
    "settings.completed_fields": "الحقول المكتملة",
    "settings.add_now": "أضف الآن",
    "settings.security.title": "إعدادات الأمان",
    "settings.security.description": "قم بتحديث بريدك الإلكتروني ورقم هاتفك وكلمة المرور",
    "settings.security.current_email": "البريد الإلكتروني الحالي",
    "settings.security.new_email": "البريد الإلكتروني الجديد",
    "settings.security.new_email_placeholder": "أدخل البريد الإلكتروني الجديد",
    "settings.security.email_verification_required": "سيتم إرسال رابط التحقق إلى بريدك الإلكتروني الجديد",
    "settings.security.current_phone": "رقم الهاتف الحالي",
    "settings.security.new_phone": "رقم الهاتف الجديد",
    "settings.security.sms_verification_required": "سيتم إرسال رمز التحقق عبر رسالة نصية",
    "settings.security.change_password": "تغيير كلمة المرور",
    "settings.security.current_password": "كلمة المرور الحالية",
    "settings.security.new_password": "كلمة المرور الجديدة",
    "settings.security.confirm_password": "تأكيد كلمة المرور",
    "settings.security.password_requirements": "يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير واحد، رقم واحد، ورمز خاص",
    "settings.security.save_changes": "حفظ التغييرات",
    "settings.security.verification_required": "التحقق مطلوب",
    "settings.security.verification_required_desc": "سيتم إرسال رمز التحقق لتأكيد التغييرات",
    "settings.general.basic_info": "المعلومات الأساسية",
    "settings.general.store_name": "اسم المتجر",
    "settings.general.store_name_placeholder": "أدخل اسم متجرك",
    "settings.general.commercial_register": "السجل التجاري",
    "settings.general.commercial_register_placeholder": "رقم السجل التجاري",
    "settings.general.store_type": "نوع المتجر",
    "settings.general.select_store_type": "اختر نوع المتجر",
    "settings.general.types.supermarket": "سوبر ماركت",
    "settings.general.types.pharmacy": "صيدلية",
    "settings.general.types.restaurant": "مطعم",
    "settings.general.types.cafe": "مقهى",
    "settings.general.types.clothing": "ملابس",
    "settings.general.types.electronics": "إلكترونيات",
    "settings.general.types.other": "أخرى",
    "settings.general.establishment_date": "تاريخ التأسيس",
    "settings.general.contact_info": "معلومات الاتصال",
    "settings.general.owner_name": "اسم المالك",
    "settings.general.cannot_change": "لا يمكن تغييره",
    "settings.general.phone_number": "رقم الهاتف",
    "settings.general.email": "البريد الإلكتروني",
    "settings.general.password": "كلمة المرور",
    "settings.general.website": "الموقع الإلكتروني",
    "settings.general.location_info": "معلومات الموقع",
    "settings.general.country": "الدولة",
    "settings.general.select_country": "اختر الدولة",
    "settings.general.saudi_arabia": "المملكة العربية السعودية",
    "settings.general.city": "المدينة",
    "settings.general.select_city": "اختر المدينة",
    "settings.general.cities.riyadh": "الرياض",
    "settings.general.cities.jeddah": "جدة",
    "settings.general.cities.mecca": "مكة المكرمة",
    "settings.general.cities.medina": "المدينة المنورة",
    "settings.general.cities.dammam": "الدمام",
    "settings.general.cities.khobar": "الخبر",
    "cities.riyadh": "الرياض",
    "cities.jeddah": "جدة",
    "cities.dammam": "الدمام",
    "cities.medina": "المدينة المنورة",
    "cities.mecca": "مكة المكرمة",
    "cities.khobar": "الخبر",
    "cities.dhahran": "الظهران",
    "cities.taif": "الطائف",
    "cities.buraidah": "بريدة",
    "cities.tabuk": "تبوك",
    "cities.hail": "حائل",
    "cities.hafar_al_batin": "حفر الباطن",
    "cities.jubail": "الجبيل",
    "cities.najran": "نجران",
    "cities.abha": "أبها",
    "cities.khamis_mushait": "خميس مشيط",
    "cities.jazan": "جازان",
    "cities.yanbu": "ينبع",
    "cities.al_qatif": "القطيف",
    "cities.unaizah": "عنيزة",
    "cities.arar": "عرعر",
    "cities.sakaka": "سكاكا",
    "cities.al_kharj": "الخرج",
    "cities.al_ahsa": "الأحساء",
    "currency.sar": "ر.س",
    "months.may": "مايو",
    "months.june": "يونيو",
    "months.july": "يوليو",
    "status.active": "نشط",
    "status.pending_activation": "بانتظار تفعيل",
    "status.ended": "منتهي",
    "settings.general.full_address": "العنوان الكامل",
    "settings.general.address_placeholder": "الشارع، الحي، رقم المبنى",
    "settings.general.store_description": "وصف المتجر",
    "settings.general.store_description_label": "الوصف",
    "settings.general.description_placeholder": "اكتب وصفاً تفصيلياً عن متجرك والخدمات التي تقدمها",
    "settings.general.operating_hours": "ساعات العمل",
    "settings.general.opening_time": "وقت الفتح",
    "settings.general.closing_time": "وقت الإغلاق",
    "settings.general.open_24_hours": "مفتوح 24 ساعة",
    "settings.general.save_changes": "حفظ التغييرات",

    // Store Data Settings
    "settings.store_data.store_name": "اسم المتجر",
    "settings.store_data.store_name_placeholder": "أدخل اسم المتجر",
    "settings.store_data.store_type": "فئة الأعمال",
    "settings.store_data.store_type_placeholder": "اختر فئة الأعمال",
    "settings.store_data.website": "الموقع الإلكتروني",
    "settings.store_data.website_placeholder": "https://example.com",
    "settings.store_data.commercial_reg": "رقم السجل التجاري",
    "settings.store_data.commercial_reg_placeholder": "أدخل رقم السجل التجاري",
    "settings.store_data.no_commercial_reg": "لا يوجد سجل تجاري ( عمل حر )",
    "settings.store_data.upload_logo": "صورة من المستند",
    "settings.store_data.upload_hint": "حجم الملف لا يزيد عن 10 ميقابايت\nJPG, PNG or PDF",
    "settings.store_data.commercial_register_document": "وثيقة السجل التجاري",
    "settings.store_data.document_uploaded": "تم رفع الوثيقة",
    "settings.store_data.document_ready": "الوثيقة جاهزة للمراجعة",
    "settings.store_data.remove_document": "إزالة الوثيقة",
    "settings.store_data.upload_commercial_register": "رفع السجل التجاري",
    "settings.store_data.accepted_formats": "PDF, JPG, PNG, DOC, DOCX - حجم الملف لا يزيد عن 10 ميقابايت",
    "settings.store_data.file_too_large": "حجم الملف كبير جداً. الحد الأقصى 10 ميقابايت",
    "settings.store_data.document_uploaded_success": "تم رفع وثيقة السجل التجاري بنجاح",
    "settings.store_data.document_upload_error": "فشل رفع الوثيقة. حاول مرة أخرى",
    "settings.store_data.document_ready_to_save": "تم اختيار الوثيقة. اضغط على حفظ التغييرات لرفعها",
    "settings.store_data.preview_document": "معاينة الوثيقة",
    "settings.store_data.choose_file": "اختر الملف",
    "settings.store_data.save_changes": "حفظ التغييرات",

    // Payment Settings
    "settings.payment.payment_methods_title": "إعدادات الدفع والتحصيل المالي",
    "settings.payment.brand_name": "اسم العلامة التجارية",
    "settings.payment.brand_name_placeholder": "أدخل اسم العلامة التجارية",
    "settings.payment.business_type": "نوع العمل",
    "settings.payment.business_type_placeholder": "اختر نوع العمل",
    "settings.payment.website": "الموقع الإلكتروني",
    "settings.payment.website_placeholder": "https://example.com",
    "settings.payment.commercial_reg": "رقم السجل التجاري",
    "settings.payment.commercial_reg_placeholder": "أدخل رقم السجل التجاري",
    "settings.payment.no_commercial_reg": "لا يوجد سجل تجاري ( عمل حر )",
    "settings.payment.upload_document": "صورة من المستند",
    "settings.payment.upload_hint": "حجم الملف لا يزيد عن 10 ميقابايت\nJPG, PNG or PDF",
    "settings.payment.choose_file": "اختر الملف",
    "settings.payment.save_changes": "حفظ التغييرات",
    "settings.payment.payment_records_title": "إعدادات الدفع والتحصيل المالي",
    "settings.payment.add_payment_method": "إضافة وسيلة دفع",
    "settings.payment.table.date": "التاريخ",
    "settings.payment.table.type": "النوع",
    "settings.payment.table.status": "الحالة",
    "settings.payment.table.details": "التفاصيل",
    "settings.payment.table.method": "طريقة الدفع",
    "settings.payment.table.actions": "خيارات",
    "settings.payment.table.completed": "مكتملة",
    "settings.payment.table.active": "مفعل",
    "settings.payment.table.new_completion": "تحويل بنكي",
    "settings.payment.table.pending_confirmation": "بانتظار التأكيد",
    "settings.payment.payment_records_summary": "سجل عمليات الدفع والتحصيل",
    "settings.payment.summary.date": "التاريخ",
    "settings.payment.summary.history": "التاريخ",
    "settings.payment.summary.type": "النوع",
    "settings.payment.summary.payment_method": "طريقة الدفع",
    "settings.payment.summary.status": "الحالة",
    "settings.payment.summary.actions": "خيارات",
    "settings.payment.summary.download_invoice": "تحميل الفاتورة",
    "settings.payment.summary.schedule_invoice": "دفع الفاتورة",
    "settings.payment.summary.completed": "مكتملة",
    "settings.payment.summary.pending_confirmation": "بانتظار التأكيد",
    "settings.payment.dialog.title": "إضافة طريقة دفع",
    "settings.payment.dialog.select_bank": "اختر البنك",
    "settings.payment.dialog.bank_placeholder": "اختر البنك من القائمة",
    "settings.payment.dialog.account_name": "اسم صاحب الحساب",
    "settings.payment.dialog.account_name_placeholder": "محمد احمد عادل",
    "settings.payment.dialog.account_number": "Bank Card/Account Number",
    "settings.payment.dialog.account_number_placeholder": "رقم الحساب",
    "settings.payment.dialog.iban": "IBAN",
    "settings.payment.dialog.iban_placeholder": "SA00 0000 0000 0000 0000 0000",
    "settings.payment.dialog.detected_bank": "البنك المكتشف",
    "settings.payment.dialog.iban_certificate": "شهادة الآيبان",
    "settings.payment.dialog.certificate_uploaded": "تم رفع الشهادة",
    "settings.payment.dialog.certificate_ready": "الشهادة جاهزة",
    "settings.payment.dialog.upload_certificate": "رفع شهادة الآيبان",
    "settings.payment.dialog.certificate_formats": "PDF, JPG, PNG (بحد أقصى 5MB)",
    "settings.payment.dialog.choose_file": "اختر ملف",
    "settings.payment.dialog.certificate_hint": "يمكنك الحصول على شهادة الآيبان من بنكك أو من خلال الخدمات المصرفية الإلكترونية",
    "settings.payment.dialog.file_too_large": "حجم الملف يجب ألا يتجاوز 5MB",
    "settings.payment.dialog.virtual": "افتراضي",
    "settings.payment.dialog.cancel": "إلغاء",
    "settings.payment.dialog.save": "حفظ التغييرات",
    "settings.payment.active": "مفعل",
    "settings.payment.inactive": "غير مفعل",
    "settings.payment.virtual": "افتراضي",
    "settings.payment.physical": "فعلي",
    "settings.payment.no_payment_methods": "لا توجد طرق دفع",
    "settings.payment.deleted": "تم الحذف",
    "settings.payment.deleted_message": "تم حذف طريقة الدفع بنجاح",
    "settings.payment.error": "خطأ",
    "settings.payment.error_message": "حدث خطأ، يرجى المحاولة مرة أخرى",
    "settings.payment.success": "نجاح",
    "settings.payment.added_message": "تمت إضافة طريقة الدفع بنجاح",
    "settings.payment.validation_error": "خطأ في التحقق",
    "settings.payment.fill_all_fields": "يرجى ملء جميع الحقول المطلوبة",
    "settings.payment.invalid_iban": "رقم الآيبان غير صحيح",
    "settings.payment.certificate_required": "يجب رفع شهادة الآيبان",
    "settings.payment.banks.alrajhi": "بنك الراجحي",
    "settings.payment.banks.ncb": "البنك الأهلي التجاري",
    "settings.payment.banks.sabb": "ساب",
    "settings.payment.banks.riyad": "بنك الرياض",
    "settings.payment.banks.alinma": "بنك الإنماء",
    "settings.payment.june_1": "1 يونيو",
    "settings.payment.june_1_new": "1 يونيو (جديد)",
    "settings.payment.bank_transfer": "تحويل بنكي",
    "settings.payment.payment_from_riyadh_shelf": "دفعة من رف الرياض",
    "settings.payment.payment_from_shelf_rental": "دفعة من تأجير رف",
    "settings.payment.shelf_rental_payment": "دفعة إيجار رف",
    "settings.payment.shelf_renewal_fees": "رسوم تجديد رف",
    "settings.payment.completed": "مكتملة",
    "settings.payment.pending": "معلقة",
    "settings.payment.failed": "فشلت",
    "settings.payment.pending_confirmation": "بانتظار التأكيد",
    "settings.payment.download_invoice": "تحميل الفاتورة",
    "settings.payment.view_invoice": "عرض الفاتورة",
    "settings.payment.pay_invoice": "دفع الفاتورة",
    "settings.payment.no_payment_records": "لا توجد سجلات دفع",
    "settings.payment.brand_payment": "دفعة من العلامة التجارية",
    "settings.payment.store_settlement": "تسوية للمتجر",
    "settings.payment.refund": "استرداد",
    "settings.payment.platform_fee": "رسوم شبر",
    "add_shelf.default_address": "الرياض، المملكة العربية السعودية",
    "settings.general.success": "نجاح",
    "settings.general.success_message": "تم حفظ الإعدادات العامة بنجاح",
    "settings.general.error": "خطأ",
    "settings.general.info": "معلومات",
    "settings.general.error_message": "حدث خطأ أثناء حفظ الإعدادات",
    "settings.general.saving": "جاري الحفظ...",
    "settings.general.uploading": "جاري الرفع...",
    "settings.general.image_updated": "تم تحديث الصورة بنجاح",
    "settings.general.invalid_image_type": "يرجى اختيار ملف صورة صالح",
    "settings.general.image_too_large": "حجم الصورة يجب أن يكون أقل من 5MB",
    "settings.general.image_upload_error": "حدث خطأ أثناء رفع الصورة",
    "image_cropper.title": "قص الصورة",
    "image_cropper.save": "حفظ الصورة",

    // Shelf Details
    "shelf_details.not_found": "الرف غير موجود",
    "shelf_details.not_found_description": "لم نتمكن من العثور على الرف المطلوب",
    "shelf_details.back_to_shelves": "العودة إلى الرفوف",
    "shelf_details.discount": "نسبة",
    "shelf_details.available": "متاح",
    "shelf_details.rented": "مؤجر",
    "shelf_details.cannot_edit_rented": "لا يمكن تعديل الرف المؤجر",
    "shelf_details.edit_shelf": "تعديل الرف",
    "shelf_details.location": "الموقع",
    "shelf_details.seller_details": "تفاصيل المؤجر",
    "shelf_details.renter_name": "اسم المؤجر",
    "shelf_details.communication_method": "وسيلة التواصل",
    "shelf_details.rental_date": "تاريخ الإيجار",
    "shelf_details.renter_rating": "تقييم المؤجر",
    "shelf_details.download_commercial_register": "تحميل السجل التجاري",
    "shelf_details.sold_products": "المنتجات المعروضة",
    "shelf_details.search_product": "ابحث باسم المنتج أو كوده أو...",
    "shelf_details.image": "الصورة",
    "shelf_details.product_name": "اسم المنتج",
    "shelf_details.code": "الكود",
    "shelf_details.price": "السعر",
    "shelf_details.quantity": "الكمية",
    "shelf_details.sales_count": "عدد المبيعات",
    "shelf_details.commission_revenue": "إيرادات العمولة",
    "shelf_details.payment_records": "سجل الدفعات",
    "shelf_details.payment_date": "تاريخ التحصيل",
    "shelf_details.status": "الحالة",
    "shelf_details.amount": "القيمة",
    "shelf_details.month": "الشهر",
    "shelf_details.collected": "تم التحصيل",
    "shelf_details.pending": "قيد",
    "shelf_details.previous_renters": "معلومات سابقة",
    "shelf_details.industry_type": "طبيعة التاجر",
    "shelf_details.rating": "التقييم",
    "shelf_details.shelf_info": "معلومات الرف",
    "shelf_details.shelf_name": "اسم الرف",
    "shelf_details.city": "المدينة",
    "shelf_details.branch": "الفرع",
    "shelf_details.dimensions": "الأبعاد",
    "shelf_details.monthly_price": "السعر الشهري",
    "shelf_details.discount_percentage": "نسبة الخصم",
    "shelf_details.store_commission": "عمولة المتجر",
    "shelf_details.available_from": "متاح من",
    "shelf_details.product_types": "أنواع المنتجات",
    "shelf_details.address": "العنوان",
    "shelf_details.previous_information": "معلومات سابقة",
    "shelf_details.view_renter": "مراسلة التاجر",
    "shelf_details.no_renter": "لا يوجد مؤجر حالياً",
    "shelf_details.activity_type": "نوع النشاط",
    "shelf_details.rental_start_date": "تاريخ الإيجار",
    "shelf_details.rental_end_date": "تاريخ الإيجار",
    "shelf_details.activity": "النشاط",
    "shelf_details.commercial_register": "السجل التجاري",
    "shelf_details.activity_care": "عناية بالبشرة",
    "shelf_details.download_commercial": "تحميل السجل",
    "shelf_details.location_info": "معلومات الموقع",
    "shelf_details.pricing_details": "التفاصيل والأسعار",
    "shelf_details.sample_product": "منتج عينة",
    "shelf_details.no_previous_renters": "لا يوجد مستأجرين سابقين",
    "shelf_details.excellent": "ممتاز",
    "shelf_details.pricing_and_commission": "السعر والعمولة",
    "shelf_details.pricing": "السعر",
    "shelf_details.commission": "العمولة",
    "shelf_details.renter_details": "تفاصيل المؤجّر",
    "shelf_details.displayed_products": "المنتجات المعروضة",
    "shelf_details.merchant_name": "اسم التاجر",
    "shelf_details.end_date": "تاريخ الانتهاء",
    "shelf_details.rental_method": "طريقة التأجير",
    "shelf_details.collection_date": "تاريخ التحصيل",
    "shelf_details.value": "القيمة",
    "shelf_details.revenue": "الإيرادات",
    "shelf_details.renter_will_appear_here": "سيظهر المؤجر هنا عند التأجير",
    "shelf_details.no_products_sold": "لا توجد منتجات معروضة",
    "shelf_details.products_will_appear_here": "ستظهر المنتجات هنا عند إضافتها",
    "shelf_details.no_payment_records": "لا توجد سجلات دفع",
    "shelf_details.payments_will_appear_here": "ستظهر الدفعات هنا عند تحصيلها",
    "shelf_details.rental_history_will_appear_here": "سيظهر تاريخ الإيجار هنا",
    "shelf_details.download": "تحميل",
    "shelf_details.monthly_rental": "إيجار شهري",
    "shelf_details.shelf_information": "معلومات الرف",
    "shelf_details.products": "المنتجات",
    "shelf_details.payments": "الدفعات",
    "shelf_details.rental_history": "تاريخ الإيجار",
    "shelf_details.total_revenue": "إجمالي الإيرادات",
    "shelf_details.products_sold": "المنتجات المباعة",
    "shelf_details.total_renters": "إجمالي المؤجرين",
    "shelf_details.actions": "الإجراءات",
    "shelf_details.duration": "المدة",
    "shelf_details.end_rental": "إنهاء الإيجار",
    "shelf_details.delete_shelf": "حذف الرف",
    "shelf_details.delete_shelf_title": "حذف الرف",
    "shelf_details.delete_shelf_description": "هل أنت متأكد من حذف هذا الرف؟ لا يمكن التراجع عن هذا الإجراء.",
    "settings.store_data.success": "نجاح",
    "settings.store_data.success_message": "تم حفظ بيانات المتجر بنجاح",
    "settings.store_data.locked_title": "بيانات المتجر محمية",
    "settings.store_data.locked_description": "لا يمكن تعديل بيانات المتجر بعد التسجيل الأولي لأسباب  . إذا كنت بحاجة إلى تحديث هذه المعلومات، يرجى الاتصال بالدعم.",
    "settings.store_data.document_locked": "المستند محمي ولا يمكن تغييره",
    "settings.store_data.error": "خطأ",
    "settings.store_data.error_message": "حدث خطأ أثناء حفظ بيانات المتجر",
    "settings.store_data.saving": "جاري الحفظ...",
    "settings.store_data.validation_error": "خطأ في التحقق",
    "settings.store_data.fill_required_fields": "يرجى ملء جميع الحقول المطلوبة",
    "settings.store_data.basic_info_required": "يرجى إكمال المعلومات الأساسية (الاسم، البريد الإلكتروني، رقم الهاتف)",
    "settings.store_data.document_required": "يرجى رفع وثيقة السجل التجاري",
    "settings.store_data.logo_uploaded": "تم رفع الشعار بنجاح",

    // Brand Data Settings
    "settings.brand_data.brand_name": "اسم العلامة التجارية",
    "settings.brand_data.brand_name_placeholder": "أدخل اسم علامتك التجارية",
    "settings.brand_data.brand_type": "نوع العلامة التجارية",
    "settings.brand_data.brand_type_placeholder": "مثل: ملابس، إلكترونيات، مستحضرات تجميل",
    "settings.brand_data.business_category": "فئة الأعمال",
    "settings.brand_data.business_category_placeholder": "مثل: ملابس، إلكترونيات، مستحضرات تجميل",
    "settings.brand_data.product_categories": "فئات المنتجات",
    "settings.brand_data.product_categories_placeholder": "مثل: ملابس نسائية، أجهزة إلكترونية، عطور",
    "settings.brand_data.website": "الموقع الإلكتروني",
    "settings.brand_data.website_placeholder": "https://example.com",
    "settings.brand_data.commercial_reg": "رقم السجل التجاري",
    "settings.brand_data.commercial_reg_placeholder": "أدخل رقم السجل التجاري",
    "settings.brand_data.freelance_document_number": "رقم وثيقة العمل الحر",
    "settings.brand_data.freelance_document_placeholder": "أدخل رقم وثيقة العمل الحر",
    "settings.brand_data.no_commercial_reg": "لا يوجد سجل تجاري ( عمل حر )",
    "settings.brand_data.brand_description": "وصف العلامة التجارية",
    "settings.brand_data.brand_description_placeholder": "اكتب وصفاً مختصراً عن علامتك التجارية ومنتجاتك",
    "settings.brand_data.upload_logo": "رفع شعار العلامة التجارية",
    "settings.brand_data.upload_hint": "حجم الملف لا يزيد عن 5 ميقابايت\nJPG, PNG",
    "settings.brand_data.choose_file": "اختر ملف",
    "settings.brand_data.upload_commercial_registration": "رفع صورة السجل التجاري",
    "settings.brand_data.upload_freelance_document": "رفع وثيقة العمل الحر",
    "settings.brand_data.commercial_register_document": "وثيقة السجل التجاري",
    "settings.brand_data.freelance_document": "وثيقة العمل الحر",
    "settings.brand_data.document_upload_hint": "PDF، PNG، JPG، JPEG (حد أقصى 10 ميجابايت)",
    "settings.brand_data.choose_document": "اختر الملف",
    "settings.brand_data.invalid_document_type": "يرجى رفع ملف صورة أو PDF فقط",
    "settings.brand_data.document_too_large": "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت",
    "settings.brand_data.commercial_registration_uploaded": "تم رفع السجل التجاري بنجاح",
    "settings.brand_data.freelance_document_uploaded": "تم رفع وثيقة العمل الحر بنجاح",
    "settings.brand_data.document_upload_error": "حدث خطأ في رفع المستند",
    "settings.brand_data.validation_error": "خطأ في التحقق",
    "settings.brand_data.fill_required_fields": "يرجى ملء جميع الحقول المطلوبة",
    "settings.brand_data.document_required": "يرجى رفع وثيقة السجل التجاري أو وثيقة العمل الحر",
    "settings.brand_data.success": "تم الحفظ بنجاح",
    "settings.brand_data.success_message": "تم حفظ بيانات العلامة التجارية بنجاح",
    "settings.brand_data.error": "خطأ",
    "settings.brand_data.error_message": "حدث خطأ أثناء حفظ البيانات",
    "settings.brand_data.saving": "جاري الحفظ...",
    "settings.brand_data.save_changes": "حفظ التغييرات",
    "settings.brand_data.logo_uploaded": "تم رفع الشعار بنجاح",
    "settings.brand_data.document_uploaded": "تم رفع الوثيقة",
    "settings.brand_data.document_ready": "الوثيقة جاهزة للمراجعة",
    "settings.brand_data.document_uploaded_success": "تم رفع الوثيقة بنجاح",
    "settings.brand_data.file_too_large": "حجم الملف كبير جداً. الحد الأقصى 10 ميقابايت",
    "settings.brand_data.document_ready_to_save": "تم اختيار الوثيقة. اضغط على حفظ التغييرات لرفعها",
    "settings.brand_data.preview_document": "معاينة الوثيقة",
    "settings.brand_data.remove_document": "إزالة الوثيقة",
    "settings.brand_data.accepted_formats": "PDF, JPG, PNG, DOC, DOCX - حجم الملف لا يزيد عن 10 ميقابايت",

    // Branches Settings
    "settings.branches.title": "إدارة الفروع",
    "settings.branches.description": "إدارة فروع متجرك",
    "settings.branches.coming_soon": "قريباً - سيتم إضافة إدارة الفروع",
    "settings.branches.empty_title": "لا توجد فروع حتى الآن",
    "settings.branches.empty_description": "أضف فروعًا لمتجرك لتوسيع نطاق عملك وإدارة مواقع متعددة",
    "settings.branches.add_branch": "إضافة فرع",

    // Financial Settings
    "settings.financial.title": "الإعدادات المالية",
    "settings.financial.description": "إدارة الحسابات البنكية والمدفوعات",
    "settings.financial.coming_soon": "قريباً - سيتم إضافة الإعدادات المالية",

    // Notifications Settings
    "settings.notifications.title": "إعدادات الإشعارات",
    "settings.notifications.description": "تحكم في الإشعارات التي تتلقاها",
    "settings.notifications.new_rentals": "طلبات الاستئجار الجديدة",
    "settings.notifications.new_rentals_desc": "احصل على إشعار عند وصول طلب استئجار جديد",
    "settings.notifications.sales_updates": "تحديثات المبيعات",
    "settings.notifications.sales_updates_desc": "إشعارات عن المبيعات والإيرادات اليومية",
    "settings.notifications.customer_messages": "رسائل العملاء",
    "settings.notifications.customer_messages_desc": "إشعارات عند وصول رسائل من العملاء",
    "settings.notifications.weekly_reports": "تقارير أسبوعية",
    "settings.notifications.weekly_reports_desc": "احصل على تقرير أسبوعي عن أداء متجرك",
    "settings.notifications.save_changes": "حفظ إعدادات الإشعارات",

    // Password Settings
    "settings.password.title": "الأمان وكلمة المرور",
    "settings.password.description": "إدارة أمان حسابك",
    "settings.password.current_password": "كلمة المرور الحالية",
    "settings.password.new_password": "كلمة المرور الجديدة",
    "settings.password.confirm_password": "تأكيد كلمة المرور الجديدة",
    "settings.password.two_factor": "المصادقة الثنائية",
    "settings.password.enable_two_factor": "تفعيل المصادقة الثنائية",
    "settings.password.two_factor_desc": "أضف طبقة حماية إضافية لحسابك",
    "settings.password.save_changes": "حفظ إعدادات الأمان",

    // Shelves Page
    "shelves.title": "إدارة الرفوف",
    "shelves.description": "تأكد للمساحات المعروضة في فروعك",
    "shelves.statistics_title": "احصائياتك",
    "shelves.statistics_description": "تابع حالة كل رف في فروعك، وابدأ بتأجير المساحات المتاحة لزيادة دخلك بسهولة",
    "shelves.my_shelves": "رفوفك",
    "shelves.rented": "الرفوف المؤجرة",
    "shelves.maintenance": "صيانة",

    // Rental Management
    "rental.renew_rental": "تجديد الإيجار",
    "rental.renew_description": "قم بتمديد فترة الإيجار الخاصة بك",
    "rental.current_end_date": "تاريخ الانتهاء الحالي",
    "rental.additional_months": "أشهر إضافية",
    "rental.new_end_date": "تاريخ الانتهاء الجديد",
    "rental.monthly_price": "السعر الشهري",
    "rental.duration": "المدة",
    "rental.total_price": "السعر الإجمالي",
    "rental.request_renewal": "طلب التجديد",
    "rental.renewal_requested": "تم طلب التجديد",
    "rental.renewal_requested_desc": "سيتم إخطار صاحب المتجر بطلب التجديد",
    "rental.renewal_failed": "فشل طلب التجديد",
    "rental.ending_soon": "الإيجار ينتهي قريباً",
    "rental.days_remaining": "متبقي {days} يوم",
    "rental.completed": "الإيجار مكتمل",
    "rental.rate_experience": "قيم تجربتك",

    // Review System
    "review.rate_experience": "قيم تجربتك",
    "review.rate_experience_with": "قيم تجربتك مع",
    "review.rating": "التقييم",
    "review.excellent": "ممتاز",
    "review.good": "جيد",
    "review.average": "متوسط",
    "review.poor": "ضعيف",
    "review.terrible": "سيء جداً",
    "review.submit": "إرسال التقييم",
    "review.submitted": "تم إرسال التقييم",
    "review.thank_you": "شكراً لك على تقييمك",
    "review.select_rating": "اختر تقييماً",
    "review.rating_required": "يرجى اختيار تقييم قبل الإرسال",
    "review.submit_failed": "فشل إرسال التقييم",
    "review.already_reviewed": "لقد قمت بتقييم هذا الإيجار بالفعل",

    // Landing Page
    "hero.title": "شبر تربط",
    "hero.highlight": "نقاط البيع بالعلامات التجارية",
    "hero.description":
      "ندعمك تتوسّع، توصل، وتزيد أرباح متجرك الإلكتروني أو محلك التجاري بكل بساطة وأقل جهد وتكلفة، عن طريق عرض منتجاتك في مساحات متاحة لدى شركاء شبر بدون فتح أي فرع.",
    "hero.start_now": "ابدأ تجربتك",
    "hero.go_to_dashboard": "انتقل إلى لوحة التحكم",
    "hero.verify_email_now": "تحقق من بريدك الإلكتروني الآن",
    "hero.learn_more": "تعلم المزيد",

    // Features
    "features.title": "ميزاتنا",
    "features.subtitle": "اكتشف كيف تساعدك شبر في تحقيق أهدافك التجارية",
    "features.clear_rights.title": "حقوق واضحة",
    "features.clear_rights.description": "كل منتج مربوط بكود QR خاص، يضمن تتبع كل عملية شراء بدقة، ويعطي كل طرف حقه من العمولة أو الإيراد.",
    "features.empty_spaces.title": "عائد مربح",
    "features.empty_spaces.description": "لو عندك رف، جدار أو زاوية متاحة، نساعدك تستثمرها وتحقق منها ربح بكل سهولة",
    "features.real_reach.title": "وصول مكفول",
    "features.real_reach.description": "لأصحاب المتاجر الإلكترونية، تقدر تحط منتجاتك في أحياء ومدن مختلفة بدون ما تفتح فرع أو توظف أحد.",
    "features.flexible_rental.title": "مرونة تفهمك",
    "features.flexible_rental.description": "ناقش أي شرط من شروط الشراكة عبر الدردشة الفورية.",

    // FAQ
    "faq.title": "أسئلتك المهمة…",
    "faq.subtitle": "إجابات على أكثر الأسئلة شيوعاً حول منصة شبر",
    "faq.q1": "كيف تعمل منصة شبر؟",
    "faq.a1": "شبر منصة رقمية تربط نقاط البيع بالعلامات التجارية لعرض منتجاتهم. نقطة البيع تشارك مساحة، والعلامة تستثمر بها.",
    "faq.q2": "هل يمكنني الاستثمار بأكثر من مساحة في نفس الوقت؟",
    "faq.a2": "أكيد! يمكنك الاستثمار في عدة نقاط بيع وبأكثر من منطقة لتوسيع حضورك وزيادة ربحك.",
    "faq.q3": "هل يمكنني تغيير الشروط؟",
    "faq.a3": "نعم، يمكنك تعديل التفاصيل أو الأسعار في المحادثة بين الطرفين، قبل تأكيد الطلب من الطرف الآخر.",
    "faq.q4": "هل يمكنني استئجار أكثر من رف في نفس الوقت؟",
    "faq.a4": "أكيد! يمكنك استئجار عدة رفوف في أكثر من متجر لتوسيع حضورك وزيادة مبيعاتك.",
    "faq.q5": "هل توفر المنصة خدمة عملاء؟",
    "faq.a5": "نعم، فريق شبر متواجد دائماً لدعمك والإجابة على أي استفسار عبر القنوات الرسمية.",

    // Footer
    "footer.contact": "تواصل معنا",
    "footer.phone": "+966 53 641 2311",
    "footer.email": "info@shibr.io",
    "footer.address": "الرياض، المملكة العربية السعودية",
    "footer.rights": "جميع الحقوق محفوظة",

    // شبر Section
    "shibr.title": "بين التوسع وزيادة الربح…",
    "shibr.highlight": "شـبــــر",
    "shibr.subtitle": "",
    "shibr.description": "شارك مساحة في محلك التجاري أو اعرض منتجاتك في نقاط بيع مختلفة عبر خطوات سهلة... سريعة... ومربحة",
    "shibr.service_stores": "صاحب المحل التجاري",
    "shibr.commercial_centers": "صاحب العلامة التجارية",
    "shibr.smart_service": "الخطوة الأولى",
    "shibr.smart_service_desc": "أنشئ حسابك وأضف رفوفك أو الزوايا المتاحة",
    "shibr.fast_service": "الخطوة الثانية",
    "shibr.fast_service_desc": "حدّد طريقة الإيجار: شهري ثابت، نسبة من المبيعات، أو مزيج",
    "shibr.integrated_service": "الخطوة الثالثة",
    "shibr.integrated_service_desc": "استقبل الطلبات وابدأ الكسب",

    // Commercial Centers
    "shibr.centers.premium_locations": "الخطوة الأولى",
    "shibr.centers.premium_locations_desc": "تصفح المحلات والأرفف، حسب المدينة والموقع",
    "shibr.centers.high_traffic": "الخطوة الثانية",
    "shibr.centers.high_traffic_desc": "احجز المساحة المناسبة لك",
    "shibr.centers.targeted_audience": "الخطوة الثالثة",
    "shibr.centers.targeted_audience_desc": "اربط منتجاتك بواسطة رمز QR وتابع طلباتك",

    // Video Section
    "video.title": "لأصحاب العلامات التجارية شيّك على المساحات المتاحة…",
    "video.highlight": "واحجز مكانك ونقطة البيع اللي تناسبك",
    "video.description":
      "لأن التفاصيل مهمة، اعرف كل تفصيلة عن مساحة مشروعك القادمة، حدّد المكان الصح لمنتجاتك واضمن حضور فعلي وتواجد ملموس.",
    "video.start_journey": "تصفح المساحات المتاحة",
    "video.jeddah_stores": "جدة - مواقع المتاجر المتاحة",
    "video.riyadh_stores": "الرياض - مواقع المتاجر المتاحة",

    // Stores Section
    "stores.title": "لأصحاب المحلات التجارية استفيد من كل مساحة عندك… شاركنا تفاصيلها ووسع دخلك",
    "stores.description": "لأن كل شبر هو فرصة، استثمر مساحتك المتاحة وشاركها كنقاط بيع، عرّفنا على مكانك وزودنا بمعلوماته واكسب ربح إضافي بكل يسر وسهولة.",

    // Why Choose Section
    "why_choose.title": "ليش تختار شبر؟",
    "why_choose.subtitle": "كل شبر تتوسع فيه يفرق..",
    "why_choose.description": "منصة تجمع بين نقاط البيع والعلامات التجارية.. سواء كنت صاحب محل تبغى تزيد دخلك، أو متجر إلكتروني تبغى توسّع وصولك، منصة شبر مصممة لك، توفر لك تجربة سلسة.. مرنة.. وتحفظ حقوقك من أول شبر إلى أول بيع.",

    // Statistics
    "stats.why_choose": "ليش تختار",
    "stats.platform": "للمنصة الرقمية",
    "stats.description":
      "الواقعية والرقمية في مكان واحد، منصة شبر تضم أكثر من 1000 تاجر وأكثر من 10000 منتج وخدمة متنوعة في المملكة العربية السعودية، وتوفر خدمة التوصيل السريع لجميع المناطق في المملكة العربية السعودية.",
    "stats.active_stores": "متجر نشط",
    "stats.happy_customers": "عميل سعيد",
    "stats.sales": "المبيعات",
    "stats.completed_orders": "طلب مكتمل",

    // FAQ
    "faq.highlight": "وجاوبنا عليها",
    "faq.description": "أسئلة تترواد لذهنك، وودك تعرف إجابتها… هنا ندعمك بأجوبة وافية… وإن كنت تبي زود.. تقدر تتواصل معنا مباشرة.",

    // Footer
    "footer.company": "روابط هامة",
    "footer.dashboard": "لوحة التحكم",
    "footer.available_stores": "المحلات المتاحة",
    "footer.customer_service": "اكتشف",
    "footer.home": "الرئيسية",
    "footer.contact_us": "تواصل معنا",
    "footer.why_us": "لماذا نحن",
    "footer.follow_us": "تابعنا",
    "footer.description":
      "شبر هي منصة تقنية تربط بين المتاجر الإلكترونية والمحلات التجارية الواقعية من خلال عرض وتأجير مساحات رفوف مخصصة داخل المحلات، بهدف تحويل المساحات غير المستغلة إلى نقاط بيع فورية.",
    "footer.social.twitter": "تويتر",
    "footer.social.linkedin": "لينكد إن",

    // Auth
    "auth.signin": "تسجيل الدخول",
    "auth.signup": "تسجيل حساب جديد",
    "auth.welcome":
      "مرحبًا بك! سجل دخولك للوصول إلى لوحة التحكم وإدارة نشاطك بكل سهولة، سواء كنت صاحب محل أو متجر إلكتروني.",
    "auth.welcome_back": "تسجيل الدخول",
    "auth.signin_description": "مرحبًا بك! سجل دخولك للوصول إلى لوحة التحكم وإدارة نشاطك بكل سهولة، سواء كنت صاحب محل أو متجر إلكتروني",
    "auth.dont_have_account": "لا تملك حساباً؟",
    "auth.mobile": "رقم الجوال",
    "auth.password": "كلمة المرور",
    "auth.password_placeholder": "من فضلك أدخل كلمة المرور",
    "auth.remember_me": "تذكرني",
    "auth.forgot_password": "نسيت كلمة المرور؟",
    "auth.recover_here": "استعادة هنا",
    "auth.ready_to_join": "على استعداد للانضمام إلينا؟",
    "auth.already_have_account": "أنت لديك حساب؟",
    "auth.back_to_home": "العودة للرئيسية",
    "auth.create_account": "إنشاء الحساب",
    "auth.signup_description":
      "اختر نوع حسابك، وسجّل بياناتك الأساسية، وابدأ في استكشاف فرص الربح أو التوسّع من خلال منصة تربط الواقع بالتجارة الإلكترونية.",
    "auth.account_type": "اختيار نوع الحساب",
    "auth.brand_owner": "صاحب متجر إلكتروني",
    "auth.store_owner": "صاحب محل",
    "auth.im_store_owner": "صاحب محل",
    "auth.im_brand_owner": "صاحب متجر إلكتروني",
    "auth.store_owner_description": "أملك محلاً تجارياً وأريد مشاركة مساحة متاحة لدي",
    "auth.brand_owner_description": "أملك متجر إلكتروني وأريد استثمار منتجاتي بمساحة محلية",
    "auth.select_account_type": "شارك مساحة أو استثمر بها",
    "auth.select_account_type_description": "عرّفنا على مشروعك أكثر... عشان نعرف كيف نخدمك، عندك نقطة بيع؟ أو علامة تجارية؟",
    "auth.i_have_store": "نقطة بيع",
    "auth.i_am_merchant": "علامة تجارية",
    "auth.store_benefit_1": "الاستفادة من المساحات بعرض منتجات مميّزة",
    "auth.store_benefit_2": "تحقيق أرباح من المساحات المتاحة",
    "auth.store_benefit_3": "إدارة واضحة وسهلة لجميع العمليات",
    "auth.brand_benefit_1": "عرض منتجاتك في المحلات التجارية",
    "auth.brand_benefit_2": "الوصول لعملاء جدد في مناطق مختلفة",
    "auth.brand_benefit_3": "تتبع أداء منتجاتك في جميع المساحات",
    "auth.continue": "المتابعة",
    "auth.continue_as_store_owner": "المتابعة كمحل تجاري",
    "auth.continue_as_brand_owner": "المتابعة كعلامة تجارية",
    "auth.registering_as": "أنت تسجل كـ",
    "auth.change_account_type": "تغيير نوع الحساب",
    "auth.full_name": "الاسم الكامل",
    "auth.full_name_placeholder": "أدخل اسمك بالكامل",
    "auth.phone_number": "رقم الجوال",
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
    "auth.agree_to": "أوافق على",
    "auth.terms_and_conditions": "الشروط والأحكام",
    "auth.privacy": "سياسة الخصوصية",
    "auth.platform_terms": "الخاصة بمنصة شبر",
    "auth.error": "خطأ",
    "auth.email_required": "البريد الإلكتروني مطلوب",
    "auth.password_required": "كلمة المرور مطلوبة",
    "auth.fill_required_fields": "يرجى ملء جميع الحقول المطلوبة",
    "auth.success": "نجاح",
    "auth.must_agree_terms": "يجب الموافقة على الشروط والأحكام",
    "auth.account_created_successfully": "تم إنشاء الحساب بنجاح",
    "auth.account_created": "تم إنشاء الحساب بنجاح",
    "auth.signup_failed": "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى",
    "auth.email_otp_failed": "فشل إرسال رمز التحقق إلى البريد",
    "auth.phone_otp_failed": "فشل إرسال رمز التحقق عبر واتساب",
    "auth.signin_success": "تم تسجيل الدخول بنجاح",
    "auth.invalid_credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    "auth.account_already_exists": "الحساب موجود بالفعل. يرجى تسجيل الدخول",
    "auth.email_already_exists": "هذا البريد الإلكتروني مستخدم بالفعل",
    "auth.phone_already_exists": "رقم الهاتف هذا مستخدم بالفعل",
    "auth.email_not_found": "البريد الإلكتروني غير مسجل",
    "auth.incorrect_password": "كلمة المرور غير صحيحة",
    "auth.invalid_email": "البريد الإلكتروني غير صالح",
    "auth.weak_password": "كلمة المرور ضعيفة جداً",
    "auth.signup_timeout": "انتهت مهلة إنشاء الحساب. يرجى المحاولة مرة أخرى",
    "auth.profile_creation_timeout": "انتهت مهلة إنشاء الملف الشخصي",
    "auth.user_not_found": "المستخدم غير موجود",
    "auth.invalid_password": "كلمة المرور غير صحيحة",
    "auth.network_error": "خطأ في الشبكة. يرجى التحقق من اتصالك",
    "auth.email_not_verified": "يرجى التحقق من بريدك الإلكتروني",
    "auth.rate_limit_exceeded": "محاولات كثيرة جداً. يرجى المحاولة لاحقاً",
    "auth.not_authenticated": "يرجى تسجيل الدخول للمتابعة",
    "auth.session_expired": "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى",
    "auth.profile_already_exists": "الملف الشخصي موجود بالفعل",
    "auth.profile_not_found": "لم يتم العثور على الملف الشخصي",
    "auth.unknown_error": "حدث خطأ غير متوقع",
    "auth.creating_account": "جاري إنشاء الحساب",
    "auth.please_wait": "يرجى الانتظار",

    // Password Reset
    "auth.forgot_password_description": "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور",
    "auth.send_reset_link": "إرسال رابط إعادة التعيين",
    "auth.back_to_signin": "العودة إلى تسجيل الدخول",
    "auth.check_your_email": "تحقق من بريدك الإلكتروني",
    "auth.password_reset_link_sent": "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
    "auth.password_reset_email_sent": "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة التعيين خلال دقائق",
    "auth.didnt_receive_email": "لم تستلم البريد الإلكتروني؟",
    "auth.try_another_email": "جرب بريد إلكتروني آخر",
    "auth.email_sent": "تم إرسال البريد الإلكتروني",
    "auth.something_went_wrong": "حدث خطأ ما. يرجى المحاولة مرة أخرى",
    "auth.reset_password": "إعادة تعيين كلمة المرور",
    "auth.reset_password_description": "أدخل كلمة المرور الجديدة لحسابك",
    "auth.enter_code_and_new_password": "أدخل رمز التحقق وكلمة المرور الجديدة",
    "auth.code_sent_to": "تم إرسال الرمز إلى",
    "auth.verification_code": "رمز التحقق",
    "auth.enter_6_digit_code": "أدخل رمز التحقق المكون من 6 أرقام",
    "auth.code_required": "رمز التحقق مطلوب",
    "auth.new_password": "كلمة المرور الجديدة",
    "auth.new_password_placeholder": "أدخل كلمة المرور الجديدة",
    "auth.confirm_password": "تأكيد كلمة المرور",
    "auth.confirm_password_placeholder": "أعد إدخال كلمة المرور الجديدة",
    "auth.passwords_dont_match": "كلمات المرور غير متطابقة",
    "auth.password_reset_success": "تم إعادة تعيين كلمة المرور بنجاح",
    "auth.password_reset_success_description": "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة",
    "auth.password_reset_failed": "فشل إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى",
    "auth.redirecting_to_signin": "جاري التوجيه إلى تسجيل الدخول",
    "auth.redirecting_to_dashboard": "جاري التوجيه إلى لوحة التحكم",
    "auth.invalid_verification_code": "رمز التحقق غير صحيح",
    "auth.code_expired": "انتهت صلاحية رمز التحقق",
    "auth.invalid_reset_link": "رابط إعادة التعيين غير صالح",
    "auth.invalid_or_expired_token": "رابط إعادة التعيين غير صالح أو منتهي الصلاحية",
    "auth.verifying_token": "جاري التحقق من الرابط...",

    // Email Verification
    "verification.title": "التحقق من البريد الإلكتروني",
    "verification.verify_email": "تأكيد البريد الإلكتروني",
    "verification.email_verified": "تم التحقق من البريد الإلكتروني",
    "verification.enter_code": "أدخل رمز التحقق المكون من 6 أرقام المرسل إلى بريدك الإلكتروني",
    "verification.invalid_code": "رمز التحقق غير صحيح",
    "verification.code_expired": "انتهت صلاحية رمز التحقق",
    "verification.user_not_found": "المستخدم غير موجود",
    "verification.success": "تم التحقق من البريد الإلكتروني بنجاح",
    "verification.error": "حدث خطأ أثناء التحقق",
    "verification.verifying": "جاري التحقق...",
    "verification.verify": "تحقق",
    "verification.didnt_receive": "لم تستلم الرمز؟",
    "verification.sending": "جاري الإرسال...",
    "verification.resend_in": "إعادة الإرسال خلال",
    "verification.resend_code": "إعادة إرسال الرمز",
    "verification.wait_before_resend": "يرجى الانتظار قبل طلب رمز جديد",
    "verification.code_sent": "تم إرسال رمز التحقق",
    "verification.codes_sent": "تم إرسال رموز التحقق إلى البريد وواتساب",
    "verification.verify_account": "تأكيد الحساب",
    "verification.enter_both_codes": "أدخل رمز التحقق المرسل إلى البريد الإلكتروني وواتساب",
    "verification.email_code": "رمز البريد الإلكتروني",
    "verification.whatsapp_code": "رمز واتساب",
    "verification.resend_email_code": "إعادة إرسال رمز البريد",
    "verification.resend_whatsapp_code": "إعادة إرسال رمز واتساب",
    "verification.secure_message": "نحن نحمي حسابك بالتحقق المزدوج",
    "verification.both_verified": "تم التحقق من البريد ورقم الهاتف",
    "verification.email_code_sent": "تم إرسال رمز التحقق إلى بريدك",
    "verification.resend_error": "فشل إعادة إرسال الرمز",
    "verification.redirecting": "جاري التوجيه إلى لوحة التحكم...",
    "verification.session_expired": "انتهت صلاحية الجلسة. يرجى المحاولة مرة أخرى",
    "verification.invalid_session": "جلسة غير صالحة. يرجى المحاولة مرة أخرى",
    // Phone Verification
    "verification.verify_phone": "تأكيد رقم الهاتف",
    "verification.phone_verified": "تم التحقق من رقم الهاتف",
    "verification.whatsapp_sent_to": "تم إرسال رمز التحقق عبر واتساب إلى",
    "verification.whatsapp_code_sent": "تم إرسال رمز التحقق عبر واتساب",
    "verification.enter_phone_code": "أدخل رمز التحقق المكون من 6 أرقام",
    "verification.verify_and_continue": "تحقق ومتابعة",
    "verification.phone_secure_message": "نحن نتحقق من رقم هاتفك لضمان أمان حسابك",
    "verification.sending_whatsapp_code": "جاري إرسال رمز التحقق عبر واتساب...",
    "verification.send_error": "فشل إرسال رمز التحقق",

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
    "orders.completed": "مكتمل",
    "orders.expired": "منتهي الصلاحية",
    "orders.in_transit": "في الطريق",
    "orders.received": "تم الاستلام",
    "orders.branch": "الفرع",
    "orders.request_date": "تاريخ الطلب",
    "orders.status": "الحالة",
    "orders.rental_duration": "مدة الايجار",
    "orders.price": "السعر",
    "orders.total_commission": "العمولة الإجمالية",
    "orders.platform": "المنصة",
    "orders.store_notes": "ملاحظات المتجر",
    "orders.rating": "التقييم",
    "orders.options": "خيارات",
    "orders.view_offer": "عرض",
    "orders.reject": "رفض",
    "orders.accept": "قبول",
    "orders.offer_details": "عرض التفاصيل",
    "orders.month": "شهر",
    "orders.months": "شهور",
    "orders.under_review_badge": "قيد المراجعة",
    "orders.rejected_badge": "مرفوض",
    "orders.request_details": "تفاصيل الطلب",
    "orders.request_number": "رقم الطلب",
    "orders.city": "المدينة",
    "orders.activity_type": "نوع النشاط",
    "orders.business_category": "فئة النشاط",
    "orders.renter_name": "اسم المؤجر",
    "orders.mobile_number": "رقم الجوال",
    "orders.commercial_register_number": "رقم السجل التجاري",
    "orders.commercial_register": "السجل التجاري",
    "orders.website": "الموقع الإلكتروني",
    "orders.email": "البريد الإلكتروني",
    "orders.brand_details": "تفاصيل العلامة التجارية",
    "orders.request_details_title": "تفاصيل الطلب",
    "orders.activity": "النشاط",
    "orders.rental_type": "نوع الإيجار",
    "orders.rental_date": "تاريخ الإيجار",
    "orders.notes": "ملاحظات",
    "orders.cafe": "مقهى",
    "orders.new_shelf": "رف جديد",
    "orders.monthly": "شهري",
    "orders.want_to_rent": "أريد الاستئجار",
    "orders.agreement_confirmation": "يرجى التأكد من صحة بيانات السجل التجاري قبل الموافقة على أي طلب تأجير",
    "orders.reject_request": "رفض الطلب",
    "orders.accept_request": "قبول الطلب",
    "orders.requester": "مقدم الطلب",
    "orders.thank_you_message": "شكرا لك على تقديم طلب الإيجار",
    "orders.view_details": "عرض التفاصيل",
    "orders.communication": "التواصل",
    "orders.message_brand_description": "تواصل مع صاحب العلامة التجارية لمناقشة تفاصيل الطلب والاتفاق على الشروط",
    "orders.start_conversation": "بدء المحادثة",
    "orders.message_brand_owner": "مراسلة صاحب العلامة",
    "orders.start_conversation_description": "ابدأ محادثة لمناقشة تفاصيل الطلب",
    "orders.conversation_will_be_created": "سيتم إنشاء محادثة جديدة عند إرسال الرسالة الأولى",
    "orders.rate_brand": "تقييم العلامة التجارية",
    "orders.rate_store": "تقييم المتجر",
    "orders.owner_name": "اسم المالك",
    "orders.social_media": "وسائل التواصل الاجتماعي",
    "orders.brand_information": "معلومات العلامة التجارية",
    "orders.conversation_closed": "المحادثة مغلقة",
    "orders.type_message": "اكتب رسالتك...",
    "orders.selected_products": "المنتجات المختارة",
    "orders.requested_quantity": "الكمية المطلوبة",

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
    "brand.dashboard.complete_profile_to_enable": "يرجى إكمال بيانات الملف الشخصي لتفعيل هذه الميزة",
    "brand.dashboard.welcome_to_shelfy": "مرحبا بك في شبر",
    "brand.dashboard.monitor_description": "راقب مبيعاتك، الرفوف المؤجرة، المنتجات، وأداء المنتجات بسهولة من مكان واحد",
    "brand.dashboard.rent_new_shelf": "تأجير رف جديد",
    "brand.dashboard.displayed_products_count": "عدد المنتجات المعروضة",
    "brand.dashboard.total_sales": "إجمالي المبيعات",
    "brand.dashboard.rented_shelves_count": "عدد الرفوف المؤجرة حاليًا",
    "brand.dashboard.pending_requests": "إجمالي المبيعات",
    "brand.dashboard.total_requests": "عدد المنتجات المعروضة",
    "brand.dashboard.increase_from_last_month": "+20.1% من الشهر الماضي",
    "brand.dashboard.from_last_month": "+20.1% من الشهر الماضي",
    "brand.dashboard.sales": "المبيعات",
    "brand.dashboard.no_sales_data": "لا توجد بيانات مبيعات",
    "brand.dashboard.sales_will_appear_here": "ستظهر المبيعات هنا عند حدوثها",
    "brand.dashboard.add_products_first": "أضف منتجات أولاً لبدء البيع",
    "brand.dashboard.see_more": "رؤية المزيد",
    "brand.dashboard.no_sales_yet": "لا يوجد لديك مبيعات بعد",
    "brand.dashboard.your_rented_shelves": "رفوفك المؤجرة",
    "brand.dashboard.rented_shelves_tab": "الرفوف المؤجرة",
    "brand.dashboard.rented_shelves_description": "نظرة سريعة على المحلات اللي تعرض فيها منتجاتك، وعدد الطلبات من كل رف",
    "brand.dashboard.no_shelves_currently": "ليس لديك رفوف في الوقت الحالي",
    "brand.dashboard.add_new_shelf": "إضافة رف جديد",
    "brand.dashboard.latest_sales_operations": "آخر عملياتك البيع",
    "brand.dashboard.sales_operations_tab": "عمليات البيع",
    "brand.dashboard.products_tab": "المنتجات",
    "brand.dashboard.sales_operations_description": "تابع أحدث الطلبات اللي تمت على منتجاتك مباشرة من رفوف العرض، وتأكد من نشاطك في الوقت الحقيقي",
    "brand.dashboard.no_sales_operations": "لا يوجد لديك عمليات بيع",
    "brand.dashboard.manage_your_shelves": "إدارة رفوفك في المتاجر",
    "brand.dashboard.no_shelves_yet": "لا توجد رفوف بعد",
    "brand.dashboard.start_renting_shelves_description": "ابدأ في تأجير رفوف في المتاجر الفعلية لعرض منتجاتك والوصول إلى عملاء جدد",
    "brand.dashboard.rent_your_first_shelf": "استأجر أول رف لك",
    "brand.dashboard.products_management": "إدارة المنتجات",
    "brand.dashboard.your_products_on_shelves": "منتجاتك المعروضة على رفوف المتاجر",
    "brand.dashboard.manage_products_description": "إدارة منتجاتك وتتبع أدائها على الرفوف",
    "brand.dashboard.confirm_delete_product": "هل أنت متأكد من حذف هذا المنتج؟",
    "brand.dashboard.import_products_excel": "استيراد المنتجات من Excel",
    "brand.dashboard.add_new_product": "إضافة منتج جديد",
    "brand.dashboard.sold_products_count": "عدد المنتجات للباعة",
    "brand.dashboard.total_products": "عدد المنتجات المعروضة",
    "brand.dashboard.total_products_count": "إجمالي عدد المنتجات",
    "brand.dashboard.orders_count": "عدد الطلبات",
    "brand.dashboard.high_orders": "طلبات عالية",
    "brand.dashboard.medium_orders": "طلبات متوسطة",
    "brand.dashboard.low_orders": "طلبات قليلة",
    "brand.dashboard.all_cities": "كل المدن",
    "brand.dashboard.search_products": "ابحث باسم المنتج أو مدينة الى ...",
    "brand.dashboard.table.options": "خيارات",
    "brand.dashboard.table.image": "الصورة",
    "brand.dashboard.table.product_name": "اسم المنتج",
    "brand.dashboard.table.code": "الكود",
    "brand.dashboard.table.price": "السعر",
    "brand.dashboard.table.quantity": "الكمية",
    "brand.dashboard.table.sales_count": "عدد المبيعات",
    "brand.dashboard.table.stores_count": "عدد المحلات",
    "brand.dashboard.table.actions": "خيارات",
    "brand.dashboard.manage_shelves_inside_stores": "إدارة رفوفك داخل المحلات",
    "brand.shelves.stats_overview": "إدارة رفوفك داخل المحلات",
    "brand.shelves.stats_description": "تابع جميع المساحات اللي حجزتها داخل المحلات الواقعية",
    "brand.shelves.total_sales": "إجمالي المبيعات",
    "brand.shelves.qr_scans": "عدد مسحات QR الإجمالية",
    "brand.shelves.rented_count": "عدد الرفوف المؤجرة حاليًا",
    "brand.dashboard.table.store_name": "اسم المحل",
    "brand.dashboard.table.city": "المدينة",
    "brand.dashboard.table.operations_count": "عدد العمليات",
    "brand.dashboard.table.rental_date": "تاريخ الإيجار",
    "brand.dashboard.table.end_date": "تاريخ الانتهاء",
    "brand.dashboard.table.rental_status": "حالة الإيجار",
    "brand.dashboard.operation": "عملية",
    "brand.dashboard.al_afaq_center": "مركز الآفاق",
    "brand.dashboard.qatr_basket": "سلة قطر",
    "brand.dashboard.style_box": "ستايل بوكس",
    "brand.dashboard.beautify_launch": "تجميل وإطلاق",
    "brand.dashboard.search_by_store_or_city": "ابحث باسم المحل أو مدينة أو...",
    "brand.dashboard.operations_count": "عدد العمليات",
    "brand.dashboard.products_page_description": "إدارة منتجاتك وتتبع أداء المبيعات ومراقبة المخزون عبر جميع أرفف المتاجر",
    "brand.dashboard.products_statistics_description": "تتبع مقاييس أداء منتجاتك واتجاهات المبيعات",
    "brand.dashboard.products_table_description": "عرض وإدارة جميع منتجاتك المعروضة على أرفف المتاجر",
    "brand.dashboard.your_products": "منتجاتك",
    "brand.dashboard.product_image": "الصورة",
    "brand.dashboard.product_name": "اسم المنتج",
    "brand.dashboard.product_code": "الكود",
    "brand.dashboard.price": "السعر",
    "brand.dashboard.quantity": "الكمية",
    "brand.dashboard.sales_count": "المبيعات",
    "brand.dashboard.stores_count": "المتاجر",
    "brand.dashboard.actions": "الإجراءات",

    // Product Dialog
    "brand.products.add_new_product": "إضافة منتج جديد",
    "brand.products.edit_product": "تعديل المنتج",
    "brand.products.product_image": "صورة المنتج",
    "brand.products.product_name": "اسم المنتج",
    "brand.products.product_name_placeholder": "مثال: تيشرت أبيض",
    "brand.products.product_code": "كود المنتج",
    "brand.products.product_sku": "رمز المنتج",
    "brand.products.category": "الفئة",
    "brand.products.select_category": "اختر الفئة",
    "brand.products.price": "السعر",
    "brand.products.cost": "التكلفة",
    "brand.products.quantity": "الكمية",
    "brand.products.description": "الوصف (اختياري)",
    "brand.products.description_placeholder": "أضف وصف مختصر ووواضح",
    "brand.products.save_product": "حفظ المنتج",
    "brand.products.image_hint": "صورة واضحة بصيغة JPG أو PNG",
    "brand.no_matching_products": "لا توجد منتجات مطابقة",
    "brand.no_products_yet": "لا توجد منتجات حالياً",
    "brand.start_adding_products_description": "ابدأ في إضافة المنتجات لعرضها في المحلات",
    "brand.add_first_product": "أضف منتجك الأول",

    // Marketplace
    "marketplace.title": "السوق",
    "marketplace.description": "اكتشف واستأجر أرفف في أفضل المتاجر الفعلية لعرض منتجاتك",
    "marketplace.search_placeholder": "ابحث عن المتاجر أو المواقع...",
    "marketplace.filter_city": "اختر المدينة",
    "marketplace.filter_category": "اختر الفئة",
    "marketplace.all_categories": "جميع الفئات",
    "marketplace.all_cities": "جميع المدن",
    "marketplace.all_types": "جميع الأنواع",
    "marketplace.category_general": "متجر عام",
    "marketplace.category_grocery": "بقالة",
    "marketplace.category_fashion": "أزياء",
    "marketplace.category_beauty": "مستحضرات تجميل",
    "marketplace.category_electronics": "إلكترونيات",
    "marketplace.category_sports": "رياضة",
    "marketplace.category_home": "المنزل",
    "marketplace.category_toys": "ألعاب",
    "marketplace.category_books": "كتب",
    "marketplace.category_home_living": "المنزل والمعيشة",
    "marketplace.category_food_beverages": "الأطعمة والمشروبات",
    "marketplace.category_kids_baby": "الأطفال والرضع",
    "marketplace.more_filters": "المزيد من الفلاتر",
    "marketplace.showing_results": "عرض {{count}} نتيجة",
    "marketplace.sort_by": "ترتيب حسب",
    "marketplace.sort_recommended": "الموصى به",
    "marketplace.sort_price_low": "السعر: من الأقل للأعلى",
    "marketplace.sort_price_high": "السعر: من الأعلى للأقل",
    "marketplace.sort_rating": "التقييم",
    "marketplace.category": "الفئة",
    "marketplace.available_shelves": "الأرفف المتاحة",
    "marketplace.price_per_month": "السعر شهرياً",
    "marketplace.price_and_commission": "السعر والعمولة",
    "marketplace.view_on_map": "عرض على الخريطة",
    "marketplace.your_location": "موقعك الحالي",
    "marketplace.location_prompt": "اسمح بالوصول إلى موقعك لرؤية المتاجر القريبة منك والحصول على الاتجاهات",
    "marketplace.location_permission_denied": "تم رفض إذن الموقع. يرجى السماح بالوصول للموقع لرؤية المتاجر القريبة منك",
    "marketplace.location_unavailable": "معلومات الموقع غير متاحة",
    "marketplace.location_timeout": "انتهت مهلة طلب الموقع",
    "marketplace.location_error": "حدث خطأ في الحصول على موقعك",
    "marketplace.geolocation_not_supported": "المتصفح الخاص بك لا يدعم تحديد الموقع الجغرافي",
    "marketplace.store_description": "وصف المتجر",
    "marketplace.view_details": "عرض التفاصيل",
    "marketplace.no_results_title": "لم يتم العثور على متاجر",
    "marketplace.no_results_description": "حاول تغيير معايير البحث أو الفلاتر",
    "marketplace.no_stores_found": "لم يتم العثور على متاجر",
    "marketplace.branch_not_found": "لم يتم العثور على الفرع",
    "marketplace.no_shelves_available": "لا توجد رفوف متاحة",
    "marketplace.back_to_branches": "العودة للفروع",
    "marketplace.available": "متاح",
    "marketplace.clear_filters": "مسح الفلاتر",
    "marketplace.available_from": "متاح من",
    "marketplace.stores_available": "متجر متاح",
    "marketplace.owner": "المالك",
    "marketplace.store_commission": "عمولة المتجر",
    "marketplace.monthly_rent": "الإيجار الشهري",
    "marketplace.sales_commission": "عمولة المبيعات",
    "marketplace.shelf_details": "تفاصيل الرف",
    "marketplace.shelf_images": "صور الرف",
    "marketplace.shelf_size": "حجم الرف",
    "marketplace.shelf_name": "اسم الرف",
    "marketplace.full_address": "العنوان الكامل",
    "marketplace.branch": "الفرع",
    "marketplace.store_owner": "صاحب المتجر",
    "marketplace.shelf_image": "صورة الرف",
    "marketplace.exterior_image": "صورة خارجية",
    "marketplace.interior_image": "صورة داخلية",
    "marketplace.map_error": "حدث خطأ في تحميل الخريطة",
    "marketplace.shelf_type": "نوع الرف",
    "marketplace.dimensions": "الأبعاد",
    "marketplace.rented_until": "مؤجر حتى",
    "marketplace.available": "متاح",
    "marketplace.general": "عام",
    "marketplace.month": "شهر",
    "marketplace.verified": "موثق",
    "marketplace.save": "وفر",
    "marketplace.type": "النوع",
    "marketplace.area": "المنطقة",
    "marketplace.all_areas": "جميع المناطق",
    "marketplace.north": "الشمال",
    "marketplace.south": "الجنوب",
    "marketplace.east": "الشرق",
    "marketplace.west": "الغرب",
    "marketplace.center": "الوسط",
    "marketplace.price_range": "نطاق السعر",
    "marketplace.min": "الحد الأدنى",
    "marketplace.max": "الحد الأقصى",
    "marketplace.search_stores": "بحث في المتاجر",
    "marketplace.select_month": "شهر أبريل",
    "marketplace.all_months": "جميع الشهور",
    "marketplace.january": "يناير",
    "marketplace.february": "فبراير",
    "marketplace.march": "مارس",
    "marketplace.april": "أبريل",
    "marketplace.may": "مايو",
    "marketplace.june": "يونيو",
    "marketplace.july": "يوليو",
    "marketplace.august": "أغسطس",
    "marketplace.september": "سبتمبر",
    "marketplace.october": "أكتوبر",
    "marketplace.november": "نوفمبر",
    "marketplace.december": "ديسمبر",
    "marketplace.view_map": "عرض الخريطة",
    "marketplace.location": "الموقع",
    "marketplace.use_current_location": "استخدم موقعك الحالي",
    "marketplace.branches": "الفروع",
    "marketplace.branch": "فرع",
    "marketplace.stores": "المتاجر",
    "marketplace.total_branches": "إجمالي الفروع",
    "marketplace.cities_covered": "المدن المغطاة",
    "marketplace.locations": "المواقع",
    "marketplace.view_branches": "عرض الفروع",
    "marketplace.back_to_stores": "العودة للمتاجر",
    "marketplace.back_to_branches": "العودة للفروع",
    "marketplace.store_not_found": "المتجر غير موجود",
    "marketplace.no_branches_found": "لا توجد فروع",
    "marketplace.available_shelves": "الأرفف المتاحة",
    "marketplace.shelves_count": "{count} رف متاح",
    "marketplace.price_from": "من",
    "marketplace.view_shelves": "عرض الأرفف",
    "marketplace.branch_details": "تفاصيل الفرع",
    "marketplace.all_shelves": "جميع الأرفف",
    "marketplace.product_types": "أنواع المنتجات",

    // Marketplace Details Page
    "marketplace.details.send_request_title": "أرسل طلبك لاستئجار هذا الرف",
    "marketplace.details.send_request_description": "ادخل بياناتك وحدد مدة الحجز. وسوف يتم إرسال الطلب لصاحب المحل للمراجعة والموافقة خلال وقت قصير.",
    "marketplace.details.booking_duration": "مدة الحجز المطلوبة",
    "marketplace.details.pick_dates": "اختر التواريخ",
    "marketplace.details.product_type": "نوع المنتج",
    "marketplace.details.select_product_type": "اختر نوع المنتج",
    "marketplace.details.product_description": "وصف المنتجات التي تنوي عرضها",
    "marketplace.details.product_description_placeholder": "مثال: منتجات عناية بالبشرة طبيعية - أدوات مكتبية مخصصة للأطفال",
    "marketplace.details.product_count": "عدد قطع المنتجات بالتقريب",
    "marketplace.details.additional_notes": "ملاحظات إضافية (اختياري)",
    "marketplace.details.additional_notes_placeholder": "مثال: أحتاج رف في مستوى رؤية واضح",
    "marketplace.details.approval_notice": "الموافقة على الطلب تتم من قبل صاحب المحل خلال 48 ساعة كحد أقصى. لا يتم سحب أي مبالغ حتى يتم التفعيل رسمياً.",
    "marketplace.details.submit_request": "إرسال الطلب للمراجعة",
    "marketplace.details.online_status": "متصل",
    "marketplace.details.type_message": "اكتب رسالتك",
    "marketplace.details.sample_message1": "السلام عليكم اريد تفاصيل اكثر عن الرف المتواجد وشكراً جزيلاً",
    "marketplace.details.sample_message2": "أهلاً وسهلاً بك! 😊 سوف ارسل لك كل المعلومات المتاحه وايضا صور اضافية",
    "marketplace.details.sample_message3": "شكرا لك سوف اقدم لك طلب ايجار وسانتظر قبولة",
    "marketplace.details.select_products": "اختر المنتجات",
    "marketplace.details.select_products_description": "اختر المنتجات التي تريد عرضها على هذا الرف",
    "marketplace.details.choose_products": "اختر المنتجات",
    "marketplace.details.additional_product_details": "تفاصيل إضافية عن المنتجات",
    "marketplace.details.selected_products_summary": "ملخص المنتجات المختارة",
    "marketplace.details.products_selected": "المنتجات المختارة",
    "marketplace.details.total_value": "القيمة الإجمالية",
    "marketplace.details.total_items": "إجمالي القطع",
    "marketplace.details.communication_title": "التواصل",
    "marketplace.details.communication_description": "تواصل مع صاحب المتجر بخصوص طلب الإيجار",
    "marketplace.details.price_summary": "ملخص الأسعار",
    "marketplace.details.monthly_price": "السعر الشهري",
    "marketplace.details.duration": "المدة",
    "marketplace.details.total": "الإجمالي",
    "marketplace.details.product_quantity": "كمية المنتج",
    "marketplace.details.product_quantity_placeholder": "أدخل كمية المنتج",
    "marketplace.details.product_preview": "معاينة المنتج",
    "marketplace.details.type": "النوع",
    "marketplace.details.quantity": "الكمية",
    "marketplace.details.description": "الوصف",

    // Products
    "products.stock": "المخزون",
    "products.add_product": "إضافة منتج",
    "product.categories.clothing": "ملابس",
    "product.categories.accessories": "إكسسوارات",
    "product.categories.cosmetics": "مستحضرات تجميل",
    "product.categories.electronics": "إلكترونيات",
    "product.categories.food": "أغذية",
    "product.categories.other": "أخرى",
    "product.categories.multiple": "متعددة",

    // Brand Shelves Page
    "brand.shelves.page_description": "تابع جميع المساحات التي حجزتها داخل المحلات الواقعية",
    "brand.shelves.total_qr_scans": "عدد مسحات QR الإجمالية",
    "brand.shelves.current_shelves_count": "عدد الرفوف المؤجرة حالياً",
    "brand.shelves.from_last_month": "من الشهر الماضي",
    "brand.shelves.manage_shelves_inside_stores": "إدارة رفوفك داخل المحلات",
    "brand.shelves.shelves_management_description": "تابع جميع المساحات التي حجزتها داخل المحلات الواقعية، أضف منتجاتك، حقق أكواد QR، وتأكد أن عرضك على الأرض بشكل بكفاءة",
    "brand.shelves.add_new_shelf": "استئجار رف جديد",
    "brand.shelves.store_name": "اسم المحل",
    "brand.shelves.city": "المدينة",
    "brand.shelves.operations_count": "عدد العمليات",
    "brand.shelves.rental_date": "تاريخ الإيجار",
    "brand.shelves.end_date": "تاريخ الانتهاء",
    "brand.shelves.rental_status": "حالة الإيجار",
    "brand.shelves.operation": "عملية",
    "brand.shelves.increase_from_last_month": "+20.1% من الشهر الماضي",
    "brand.shelves.rented_shelf": "الرفوف المؤجرة",
    "brand.shelves.available_shelf": "الرفوف المتاحة",
    "brand.shelves.action": "إجراء",
    "brand.shelves.get_details": "التفاصيل القادمة",
    "brand.shelves.price": "السعر",
    "brand.shelves.supplier": "المؤجر",
    "brand.shelves.status": "الحالة",
    "brand.shelves.shelf_name": "اسم الرف",
    "brand.shelves.details_modify": "تعديل التفاصيل",
    "brand.shelves.available_for_rent": "متاح للإيجار",
    "brand.shelves.rented": "مؤجر",
    "brand.shelves.shipping_requests": "طلبات الشحن",
    "brand.shelves.shipping_requests_description": "تتبع تفاصيل شحنتك للمحل",
    "brand.shelves.cancel_notice": "سوف يتم إلغاء الطلبات بعد 48 ساعة في حالة عدم الموافقة عليها",
    "brand.shelves.under_review": "قيد المراجعة",
    "brand.shelves.on_the_way": "في الطريق",
    "brand.shelves.delivered": "تم التسليم",
    "brand.shelves.accepted": "مقبول",
    "brand.shelves.rejected": "مرفوض",
    "brand.shelves.self_delivery": "تسليم ذاتي",
    "brand.shelves.flight": "طيران",
    "brand.shelves.search_placeholder": "ابحث باسم المحل أو مدينة أو...",
    "brand.shelves.options": "خيارات",
    "brand.shelves.shipping_method": "طريقة الشحن",
    "brand.shelves.request_date": "تاريخ الطلب",
    "brand.shelves.quantity_requested": "الكمية المطلوبة",
    "brand.shelves.branch": "الفرع",
    "brand.shelves.store": "المحل",

    // Notifications
    "notifications.title": "الإشعارات",
    "notifications.mark_all_read": "قراءة الكل",
    "notifications.no_notifications": "لا توجد إشعارات",
    "notifications.new_notifications": "إشعارات جديدة",
    "notifications.notifications": "الإشعارات",
    "notifications.no_new": "لا جديد",

    // Status/State Values - Additional
    "status.pending": "قيد المراجعة",
    "status.payment_pending": "بانتظار الدفع",
    "status.payment_processing": "جاري التحقق من الدفع",
    "status.completed": "مكتمل",
    "status.cancelled": "ملغي",
    "status.expired": "منتهي الصلاحية",
    "status.rejected": "مرفوض",
    "status.online": "متصل",

    // Common Actions
    "actions.accept_rental_request": "قبول طلب الإيجار",
    "actions.reject_rental_request": "رفض طلب الإيجار",

    // Action Buttons
    "action.pay_now": "ادفع الآن",
    "action.verifying": "جاري التحقق",
    "action.view": "عرض",
    "action.view_details": "عرض التفاصيل",
    "action.manage": "إدارة",
    "action.waiting": "بانتظار الموافقة",

    // Payment Dialog
    "payment.bank_transfer_title": "التحويل البنكي",
    "payment.transfer_instructions": "يرجى تحويل المبلغ إلى الحساب البنكي أدناه",
    "payment.store_name": "اسم المتجر",
    "payment.shelf_name": "اسم الرف",
    "payment.amount_due": "المبلغ المستحق",
    "payment.transfer_to": "التحويل إلى",
    "payment.bank_name": "اسم البنك",
    "payment.account_name": "اسم الحساب",
    "payment.iban": "رقم الآيبان",
    "payment.iban_copied": "تم نسخ رقم الآيبان",
    "payment.copy_failed": "فشل نسخ رقم الآيبان",
    "payment.transfer_notice": "يرجى الاحتفاظ بإيصال التحويل. سيتم تفعيل الرف خلال 24 ساعة بعد التحقق من الدفع.",
    "payment.confirm_transfer_completed": "تأكيد إتمام التحويل",
    "payment.confirmation_success_title": "تم تأكيد التحويل",
    "payment.confirmation_success_description": "سيتم التحقق من الدفعة وتفعيل الرف خلال 24 ساعة",
    "payment.confirmation_failed": "فشل تأكيد التحويل. يرجى المحاولة مرة أخرى.",

    // Time Periods
    "period.daily": "يومي",
    "period.weekly": "أسبوعي",
    "period.monthly": "شهري",
    "period.yearly": "سنوي",

    // Time References
    "time.yesterday": "الأمس",
    "time.last_day": "الأمس",
    "time.last_week": "الأسبوع الماضي",
    "time.last_month": "الشهر الماضي",
    "time.last_year": "السنة الماضية",
    "time.from": "من",
    "time.daily": "يومي",
    "time.weekly": "أسبوع",
    "time.monthly": "شهري",
    "time.yearly": "سنوي",

    // Chat
    "chat.conversations": "المحادثات",
    "chat.chat": "محادثة",
    "chat.no_conversations": "لا توجد محادثات",
    "chat.no_messages_yet": "لا توجد رسائل بعد",
    "chat.type_message_placeholder": "اكتب رسالتك...",
    "chat.status.new": "جديد",
    "chat.request_accepted_message": "مرحباً! تم قبول طلبك...",
    "chat.shelf_unavailable_message": "عذراً، الرف غير متاح حالياً...",

    // Brand Dashboard
    "brand.current_shelves_count": "عدد الرفوف الحالية",
    "brand.active_shelves": "رفوف نشطة",
    "brand.pending_requests": "طلبات قيد المراجعة",
    "brand.awaiting_approval": "بانتظار الموافقة",
    "brand.total_requests": "إجمالي الطلبات",
    "brand.all_requests": "كل الطلبات",
    "brand.current_shelves": "إدارة رفوفك داخل المحلات",
    "brand.no_matching_shelves": "لا توجد رفوف مطابقة",
    "brand.no_shelves_yet": "لا توجد رفوف حالياً",
    "brand.rent_first_shelf": "استأجر رفك الأول",
    "brand.current_shelves_description": "تابع جميع المساحات اللي حجزتها داخل المحلات الواقعية، أضف منتجاتك، حمّل أكواد QR، وتأكد إن عرضك على الأرض شغال بكفاءة.",
    "brand.no_search_results": "لا توجد نتائج للبحث",
    "brand.try_different_search": "جرب البحث بكلمات مختلفة",
    "brand.start_renting_shelves_description": "ابدأ في استئجار الرفوف لعرض منتجاتك",
    "brand.rent_your_first_shelf": "استأجر رفك الأول",

    // Additional Table Headers
    "table.store_name": "اسم المحل",
    "table.city": "المدينة",
    "table.sales_count": "عدد المبيعات",
    "table.order_number": "رقم الطلب",
    "table.product_name": "اسم المنتج",
    "table.date": "التاريخ",
    "table.rental_start_date": "تاريخ الإيجار",
    "table.rental_end_date": "تاريخ الانتهاء",
    "table.product_count": "عدد المنتجات",
    "table.rental_date": "تاريخ الإيجار",
    "table.end_date": "تاريخ الانتهاء",
    "table.shelf_size": "حجم الرفوف",
    "table.count": "العدد",
    "table.start": "البداية",
    "table.end": "النهاية",
    "table.action": "الإجراء",
    "table.actions": "إجراءات",
    "table.request_date": "تاريخ الطلب",
    "table.rating": "التقييم",
    "table.operations_count": "عدد العمليات",
    "table.rental_price": "سعر الإيجار",
    "table.image": "الصورة",
    "table.sku": "رمز المنتج",
    "table.quantity": "الكمية",

    // Store Dashboard
    "store.your_statistics": "إحصائياتك",
    "store.view_details": "عرض التفاصيل",
    "store.incoming_requests": "طلبات الوارد من المتاجر الإلكترونية",
    "store.no_matching_requests": "لا توجد طلبات مطابقة",
    "store.no_requests_yet": "لا توجد طلبات حالياً",
    "store.requests_will_appear_here": "ستظهر الطلبات هنا عند توفرها",
    "store.try_different_search": "حاول البحث بكلمات مختلفة",
    "store.incoming_requests_description": "تابع طلبات استئجار الرفوف من المتاجر الإلكترونية، وراجع تفاصيل كل طلب، واختر الموافقة أو الرفض بناءً على المعلومات المعروضة.",
    "store.cancellation_notice": "سوف يتم إلغاء الطلبات بعد 48 ساعة في حالة عد الموافقة عليها",

    // Common UI
    "ui.add_shelf": "إضافة رف",
    "ui.rent_new_shelf": "استئجار رف جديد",
    "ui.add": "إضافة",
    "ui.complete_data_first": "يرجى إكمال بياناتك أولاً",
    "ui.search_placeholder": "بحث...",

    // Duration
    "duration.month_singular": "شهر",
    "duration.months_plural": "شهور",

    // Pagination
    "pagination.previous": "السابق",
    "pagination.next": "التالي",
    "pagination.showing": "عرض {start}-{end} من {total} طلب",

    // Forms & Validation
    "form.fill_required_fields": "يرجى ملء جميع الحقول المطلوبة",
    "form.login_first": "يرجى تسجيل الدخول أولاً",
    "form.request_updated_success": "تم تحديث طلبك بنجاح!",
    "form.request_submitted_success": "تم إرسال طلبك بنجاح!",
    "form.submit_error": "حدث خطأ في إرسال الطلب",
    "form.chat_unavailable": "المحادثة غير متاحة",
    "form.description_optional": "الوصف (اختياري)",
    "form.description_example": "مثال: يجانب الباب - يمين الداخل",
    "form.address": "العنوان",
    "form.click_map_select_location": "انقر على الخريطة لتحديد الموقع",
    "form.add_customer_message": "يمكنك إضافة رسالة للعميل (اختياري)",

    // Auth
    "auth.and": "و",

    // Validation messages
    "validation.full_name_required": "الاسم الكامل مطلوب",
    "validation.full_name_min_length": "الاسم الكامل يجب أن يكون على الأقل حرفين",
    "validation.email_required": "البريد الإلكتروني مطلوب",
    "validation.email_invalid": "البريد الإلكتروني غير صالح",
    "validation.phone_required": "رقم الجوال مطلوب",
    "validation.phone_invalid": "رقم الجوال السعودي غير صالح",
    "validation.password_required": "كلمة المرور مطلوبة",
    "validation.password_min_8": "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    "validation.terms_required": "يجب الموافقة على الشروط والأحكام",
    "validation.store_name_required": "اسم المتجر مطلوب لأصحاب المحلات",
    "validation.brand_name_required": "اسم العلامة التجارية مطلوب لأصحاب المتاجر الإلكترونية",

    // Orders
    "orders.login_to_view": "يرجى تسجيل الدخول لعرض الطلبات",

    // Search/Filter
    "search.store_or_city_placeholder": "ابحث باسم المتجر أو مدينة الرف...",
  },
  en: {
    // Common
    "common.shibr": "Shibr",
    "common.coming_soon": "Coming Soon",
    "common.error": "Error",
    "common.success": "Success",

    // Error pages
    "error.title": "Something went wrong",
    "error.description": "We're sorry, an unexpected error occurred. Please try again.",
    "error.try_again": "Try Again",
    "error.go_home": "Go Home",
    "error.go_dashboard": "Go to Dashboard",
    "error.details": "Error Details",
    "error.code": "Error Code",
    "error.admin_dashboard_title": "Admin Dashboard Error",
    "error.admin_dashboard_description": "An error occurred while loading the admin dashboard",
    "error.brand_dashboard_title": "Brand Dashboard Error",
    "error.brand_dashboard_description": "An error occurred while loading the brand dashboard",
    "error.store_dashboard_title": "Store Dashboard Error",
    "error.store_dashboard_description": "An error occurred while loading the store dashboard",

    // 404 Page
    "404.title": "404",
    "404.subtitle": "Page Not Found",
    "404.description": "Sorry, we couldn't find the page you're looking for.",
    "404.go_home": "Go Home",
    "404.browse_marketplace": "Browse Marketplace",
    "404.search_suggestion": "Try searching for what you need or return to the homepage",
    "common.submitting": "Submitting...",
    "common.uploading_images": "Uploading images...",
    "common.remove": "Remove",
    "common.fill_required_fields": "Please fill all required fields",
    "common.user_not_found": "User not found",
    "common.search": "Search",
    "common.loading": "Loading...",
    "common.not_specified": "Not specified",
    "common.none": "None",
    "common.all": "All",
    "common.new": "New",
    "common.currency_symbol": "SAR",
    "common.save": "Save",
    "common.save_changes": "Save Changes",
    "common.saving": "Saving...",
    "common.optional": "Optional",
    "common.address": "Address",
    "common.description": "Description",
    "common.download": "Download",
    "common.no_description": "No description",
    "common.language.arabic": "العربية",
    "common.language.english": "English",
    "common.theme.light": "Light",
    "common.theme.dark": "Dark",
    "common.theme.system": "System",
    "common.theme.toggle": "Toggle theme",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.clear_filters": "Clear Filters",
    "common.sar": "SAR",
    "common.selected": "selected",
    "common.delete": "Delete",
    "common.deleting": "Deleting...",
    "common.no_results": "No results found",
    "common.try_different_search": "Try a different search",
    "common.no_notes": "No notes",
    "common.edit": "Edit",
    "common.details": "Details",
    "common.view": "View",
    "common.upload": "Upload",
    "common.submit": "Submit",
    "common.create": "Create",
    "common.please_fix_errors": "Please fix errors before continuing",
    "common.something_went_wrong": "Something went wrong",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.clear_search": "Clear search",
    "common.view_all": "View All",
    "common.unknown": "Unknown",
    "common.logo_alt": "Shibr logo",
    "common.currency": "SAR",
    "common.completed": "Completed",
    "common.pending": "Pending",
    "common.active": "Active",
    "common.expired": "Expired",
    "common.progress": "Progress",
    "common.start_date": "Start Date",
    "common.end_date": "End Date",
    "common.day": "day",
    "common.days": "days",
    "common.remaining": "remaining",
    "common.small": "Small",
    "common.medium": "Medium",
    "common.large": "Large",
    "common.monthly": "monthly",
    "common.month": "month",
    "common.months": "months",
    "common.july": "July",
    "common.june": "June",
    "common.riyadh": "Riyadh",
    "common.jeddah": "Jeddah",
    "common.dammam": "Dammam",
    "common.brand_name": "Brand Name",
    "common.join_date": "Join Date",
    "common.registration_number": "Registration Number",
    "common.registration_document": "Registration Document",
    "common.business_type": "Business Type",
    "common.registered_company": "Registered Company",
    "common.freelancer": "Freelancer",
    "common.date": "Date",
    "common.inactive": "Inactive",
    "common.status": "Status",
    "common.actions": "Actions",
    "common.subtotal": "Subtotal",
    "common.unit_price": "Unit Price",
    "common.quantity": "Quantity",
    "common.order_summary": "Order Summary",
    "common.total_amount": "Total Amount",
    "common.total_items": "Total Items",
    "common.total": "Total",
    "common.products": "Products",
    "common.items": "Items",
    "orders.mock.step_store": "Step Store",

    // Navigation
    "nav.home": "Home",
    "nav.renter_store": "Join Shibr Community",
    "nav.stores": "Stores",
    "nav.why_us_nav": "Why Us",
    "nav.contact": "Contact Us",
    "nav.blog": "Blog",
    "nav.signin": "Sign In",
    "nav.marketplace": "Marketplace",
    "nav.dashboard": "Dashboard",
    "nav.settings": "Settings",
    "nav.signout": "Sign Out",
    "nav.verify_email": "Verify Email",
    "nav.email_not_verified": "Email not verified",
    "nav.navigation": "Navigation",
    "nav.open_menu": "Open menu",
    "nav.close_menu": "Close menu",
    "nav.questions": "Join Shibr Community",
    "nav.services": "Stores",
    "nav.why_us": "Why Us",

    // Dashboard Navigation
    "dashboard.home": "Home",
    "dashboard.products": "Products",
    "dashboard.shelves": "Shelves",
    "dashboard.shelves_description": "Manage available shelves in your store",

    // Public Store Page
    "store.cart": "Cart",
    "store.welcome_message": "Welcome to our store",
    "store.available_products": "Available Products",
    "store.available": "available",
    "store.in_stock": "in stock",
    "store.out_of_stock": "Out of Stock",
    "store.add_to_cart": "Add to Cart",
    "store.added_to_cart": "Added to cart",
    "store.no_products": "No products available",
    "store.view_cart": "View Cart",
    "store.checkout": "Checkout",
    "store.empty_cart": "Cart is empty",
    "store.cart_items": "Cart Items",
    "store.quantity": "Quantity",
    "store.price": "Price",
    "store.products": "Products",
    "store.tax": "Tax",
    "store.subtotal": "Subtotal",
    "store.total": "Total",
    "store.continue_shopping": "Continue Shopping",
    "store.cart_limit_reached": "Maximum quantity reached",
    "store.already_in_cart": "already in cart",
    "store.max": "max",
    "store.max_quantity_in_cart": "Maximum quantity for this product is already in cart",
    "store.stock_limit": "Stock limit exceeded",
    "store.only": "Only",
    "store.each": "each",
    "store.fill_required": "Please fill required information",
    "store.fill_all_fields": "Please fill all fields",
    "store.invalid_email": "Invalid email address",
    "store.invalid_phone": "Invalid phone number",
    "store.saudi_phone_format": "Please enter a valid Saudi mobile number",
    "store.order_failed": "Order failed",
    "store.enter_name": "Enter full name",
    "store.enter_email": "Enter email address",
    "store.payment_on_delivery": "Payment on delivery",
    "store.enter_phone_title": "Enter Phone Number",
    "store.enter_phone_description": "We'll send your order receipt to your phone",
    "store.name_label": "Full Name",
    "store.name_placeholder": "Enter your full name",
    "store.name_required": "Name is required",
    "store.phone_label": "Phone Number",
    "store.phone_required": "Phone number is required",
    "store.invalid_phone_format": "Phone number must start with 05 and be 10 digits",
    "store.proceed_checkout": "Proceed to Checkout",
    "store.customer_info": "Customer Information",
    "store.customer_name": "Full Name",
    "store.customer_email": "Email",
    "store.customer_phone": "Phone Number",
    "store.payment_method": "Payment Method",
    "store.cash": "Cash",
    "store.bank_transfer": "Bank Transfer",
    "store.card": "Credit Card",
    "store.order_notes": "Order Notes",
    "store.place_order": "Place Order",
    "store.order_summary": "Order Summary",
    "store.order_success": "Order Received",
    "store.order_success_description": "Thank you! We'll contact you soon",
    "store.order_number": "Order Number",
    "store.track_order": "Track Order",
    "store.send_otp": "Send Verification Code",
    "store.verify_otp": "Verify",
    "store.otp_label": "Verification Code",
    "store.otp_placeholder": "Enter 6-digit verification code",
    "store.otp_sent": "Verification code sent to your WhatsApp",
    "store.otp_verified": "Phone number verified successfully",
    "store.otp_sending": "Sending...",
    "store.otp_verifying": "Verifying...",
    "store.otp_required": "Please verify your phone number first",
    "store.resend_otp": "Resend Code",
    "store.invalid_otp": "Invalid verification code",
    "store.otp_expired": "Verification code has expired",
    "store.otp_too_many_attempts": "Too many failed attempts. Please request a new code",
    "store.otp_rate_limit": "Too many requests. Please try again later",
    "store.phone_verified": "Verified",

    // Payment Page
    "payment.title": "Payment",
    "payment.secure_checkout": "Secure Checkout",
    "payment.ordering_from": "Ordering from",
    "payment.receipt_phone": "Receipt Phone Number",
    "payment.payment_method": "Payment Method",
    "payment.pay_with_card": "Pay with Card",
    "payment.pay_with_apple": "Apple Pay",
    "payment.apple_pay": "Apple Pay",
    "payment.pay_with_apple_pay": "Pay with Apple Pay",
    "payment.apple_pay_notice": "Use Apple Pay for fast and secure checkout",
    "payment.apple_pay_ready": "Apple Pay Ready",
    "payment.click_pay_to_continue": "Click Pay to continue",
    "payment.setup_apple_pay": "Set up Apple Pay",
    "payment.apple_pay_test_mode": "This is test mode. Apple Pay payment will be simulated.",
    "payment.verifying_apple_pay": "Verifying Apple Pay...",
    "payment.card_number": "Card Number",
    "payment.cardholder_name": "Cardholder Name",
    "payment.expiry_date": "Expiry Date",
    "payment.cvv": "CVV",
    "payment.test_mode_notice": "This is test mode. No charges will be made to your card.",
    "payment.order_summary": "Order Summary",
    "payment.pay_now": "Pay Now",
    "payment.confirm_order": "Confirm Order",
    "payment.no_order_data": "No order data found",
    "payment.redirecting_cart": "Redirecting to cart...",
    "payment.invalid_card_number": "Invalid card number",
    "payment.invalid_card_name": "Cardholder name is required",
    "payment.invalid_expiry": "Invalid expiry date",
    "payment.invalid_cvv": "Invalid CVV",
    "payment.processing_payment": "Processing Payment",
    "payment.verifying_card": "Verifying card details...",
    "payment.confirming_order": "Confirming your order...",
    "payment.payment_successful": "Payment Successful",
    "payment.order_confirmed": "Your order has been confirmed",
    "payment.payment_failed": "Payment Failed",
    "payment.payment_declined": "Your card was declined. Please try again.",
    "payment.order_failed": "Failed to create order",
    "payment.redirecting_back": "Redirecting back...",
    "payment.secure_payment": "Secure payment processing",
    "payment.card": "Card",
    "payment.redirecting": "Redirecting...",
    "payment.checkout_creation_failed": "Failed to create checkout session",
    "payment.user_not_found": "User data not found",
    "payment.amount_not_found": "Payment amount not found",
    "payment.secure_checkout_description": "You will be redirected to a secure payment page",
    "payment.accepted_methods": "Accepted payment methods:",
    "payment.transaction_declined": "Transaction Declined",
    "payment.payment_not_processed": "Your payment was not processed. Please try again.",
    "payment.status": "Status",
    "payment.common_reasons": "Common reasons:",
    "payment.insufficient_funds": "Insufficient funds",
    "payment.incorrect_card_details": "Incorrect card details",
    "payment.card_expired": "Card expired",
    "payment.transaction_limit_exceeded": "Transaction limit exceeded",
    "payment.try_again": "Try Again",
    "payment.back_to_dashboard": "Back to Dashboard",
    "payment.need_help": "Need help?",
    "payment.contact_support": "Contact support",
    "payment.invoice_details": "Invoice Details",
    "payment.invoice_number": "Invoice Number",
    "payment.subtotal": "Subtotal",
    "payment.tax": "Tax",
    "payment.total_amount": "Total Amount",
    "payment.platform_fee": "Platform Fee",
    "payment.complete_payment": "Complete Payment",
    "payment.by_proceeding_agreement": "By proceeding, you agree to our terms of service",
    "payment.terms_and_conditions": "and terms and conditions",
    "payment.success_title": "Success",
    "payment.payment_confirmed": "Payment confirmed successfully",
    "payment.rental_activated": "Your rental has been activated",
    "payment.error_title": "Payment Error",
    "payment.error_message": "An error occurred while processing your payment",
    "payment.already_completed": "Payment Already Completed",
    "payment.rental_active_message": "Your rental request is already active",
    "payment.view_rental_details": "View Rental Details",
    "payment.missing_payment_info": "Missing payment information",
    "payment.card_payment": "Card Payment",
    "payment.loading_card_form": "Loading card form...",
    "payment.card_error": "Card Error",
    "payment.initialization_error": "Failed to initialize payment system",
    "payment.card_not_ready": "Card form not ready",
    "payment.tokenization_failed": "Failed to process card data",
    "payment.processing": "Processing...",
    "payment.verifying_payment": "Verifying payment...",
    "payment.please_wait_verification": "Please wait while we verify your payment",
    "payment.failed_title": "Payment Failed",
    "payment.failed_message": "Your payment could not be processed. Please try again.",
    "payment.payment_not_completed": "Payment not completed",
    "payment.verification_failed": "Payment verification failed",
    "store.back_to_cart": "Back to Cart",

    // Order Confirmation Page
    "order.thank_you": "Thank You!",
    "order.confirmation_message": "Your order has been received and is being processed.",
    "order.order_details": "Order Details",
    "order.order_number": "Order Number",
    "order.order_date": "Order Date",
    "order.contact_phone": "Contact Phone",
    "order.payment_method": "Payment Method",
    "order.store": "Store",
    "order.brand": "Brand",
    "order.items": "Items",
    "order.subtotal": "Subtotal",
    "order.tax": "Tax",
    "order.total": "Total",
    "order.whats_next": "What's Next?",
    "order.step1_title": "Order Confirmation",
    "order.step1_description": "The store will review and confirm your order.",
    "order.step2_title": "Order Preparation",
    "order.step2_description": "Your order will be carefully prepared.",
    "order.step3_title": "Pick Up Order",
    "order.step3_description": "Visit the store to pick up your order.",
    "order.estimated_time": "Estimated time",
    "order.minutes": "minutes",
    "order.continue_shopping": "Continue Shopping",
    "order.back_to_home": "Back to Home",
    "order.status.pending": "Pending",
    "order.status.confirmed": "Confirmed",
    "order.status.processing": "Processing",
    "order.status.ready": "Ready",
    "order.status.delivered": "Delivered",
    "order.status.cancelled": "Cancelled",
    "order.status.refunded": "Refunded",

    // QR Stores Page
    "qr_stores.title": "QR Shelf Stores",
    "qr_stores.description": "Create and manage QR codes for rented shelf stores",
    "qr_stores.generate_qr": "Generate QR Code",
    "qr_stores.regenerate_qr": "Regenerate QR Code",
    "qr_stores.view_qr": "View QR Code",
    "qr_stores.generating": "Generating...",
    "qr_stores.qr_generated": "QR Code Generated",
    "qr_stores.qr_generated_description": "QR code has been generated successfully",
    "qr_stores.qr_generation_failed": "Failed to generate QR code",
    "qr_stores.no_qr_generated": "No QR code generated yet",
    "qr_stores.download_qr": "Download QR",
    "qr_stores.copy_link": "Copy Link",
    "qr_stores.view_store": "View Store",
    "qr_stores.link_copied": "Link Copied",
    "qr_stores.copy_failed": "Failed to copy link",
    "qr_stores.scans": "Scans",
    "qr_stores.orders": "Orders",
    "qr_stores.revenue": "Revenue",
    "qr_stores.qr_code_ready": "QR Code Ready",
    "qr_stores.qr_code_ready_description": "You can now download or print the QR code",
    "qr_stores.store_url": "Store URL",
    "qr_stores.qr_store": "QR Store",
    "qr_stores.qr_store_description": "QR code for customers to scan and purchase products",
    "qr_stores.analytics": "Analytics",
    "qr_stores.views": "Views",
    "qr_stores.conversion_rate": "Conversion Rate",

    // Shelves Page
    "shelves.header_description": "Track the status of each shelf in your branches, and know what rentable spaces are available to easily increase your income.",
    "shelves.total_rented_shelves": "Total Rented Shelves",
    "shelves.total_sales": "Total Sales",
    "shelves.available_shelves": "Available Shelves",
    "shelves.increase_from_last_month": "+20.1% from last month",
    "shelves.your_shelves": "Your Shelves",
    "shelves.manage_description": "Easily manage your shelves across all branches, track their status, renters, and collection dates in one place.",
    "shelves.display_shelf_now": "Display Your Shelf Now",
    "shelves.search_placeholder": "Search by renter name or city...",
    "shelves.all_filter": "All",
    "shelves.rented_shelves_filter": "Rented Shelves",
    "shelves.available_shelves_filter": "Available Shelves",
    "shelves.table.shelf_name": "Shelf Name",
    "shelves.table.branch_name": "Branch Name",
    "shelves.table.renter": "Renter",
    "shelves.table.price": "Price",
    "shelves.table.net_revenue": "Net Revenue",
    "shelves.table.status": "Status",
    "shelves.table.next_collection": "Next Collection",
    "shelves.table.available_from": "Available From",
    "shelves.table.rental_date": "Rental Date",
    "shelves.table.action": "Action",
    "shelves.status.rented": "Rented",
    "shelves.status.available": "Available",
    "shelves.status.pending": "Pending",
    "shelves.status.unavailable": "Unavailable",
    "shelves.view_details": "View Details",
    "shelves.total_shelves": "Total Shelves",
    "shelves.from_rented_shelves": "From Rented Shelves",
    "shelves.pending_approval": "Pending Approval",
    "shelves.no_shelves_found": "No shelves found",
    "shelves.shelves_will_appear_here": "Shelves will appear here when added",
    "shelves.showing": "Showing",
    "shelves.of": "of",
    "shelves.shelves": "shelves",

    // Add Shelf
    "add_shelf.title": "Add a new shelf for one of your store branches",
    "add_shelf.description": "🍊 Register a new display space to be available for brands on the platform, and specify its location, price, and rental method",
    "add_shelf.shelf_name": "Shelf Name",
    "add_shelf.shelf_name_placeholder": "Front Shelf",
    "add_shelf.city": "City",
    "add_shelf.city_placeholder": "Example: Jeddah, Riyadh, Dammam",
    "add_shelf.branch": "Branch",
    "add_shelf.branch_placeholder": "Example: Al Rawdah District, King Fahd Street",
    "add_shelf.discount_percentage": "Store's Sales Percentage",
    "add_shelf.discount_percentage_tooltip": "Shibr adds {fee}% commission to the price",
    "add_shelf.discount_placeholder": "Example 5%",
    "add_shelf.monthly_price": "Monthly Subscription Price",
    "add_shelf.monthly_price_tooltip": "Shibr takes {fee}% commission from subscription",
    "add_shelf.price_placeholder_min": "Example 500 SAR",
    "add_shelf.price_placeholder_max": "580 SAR",
    "add_shelf.available_from": "Available From",
    "add_shelf.available_date": "April",
    "add_shelf.rental_duration": "Shelf Dimensions",
    "add_shelf.length": "Length",
    "add_shelf.width": "Width",
    "add_shelf.depth": "Depth",
    "add_shelf.product_type": "Suitable Product Types (Optional)",
    "add_shelf.suitable_product_types": "Suitable Product Categories (Optional)",
    "add_shelf.select_all_categories": "Select all categories that can be displayed on this shelf",

    // Product Categories - Simplified
    "product_categories.food_beverages": "Food & Beverages",
    "product_categories.health_beauty": "Health & Beauty",
    "product_categories.fashion": "Fashion",
    "product_categories.electronics": "Electronics",
    "product_categories.home_living": "Home & Living",
    "product_categories.kids_baby": "Kids & Baby",
    "product_categories.sports_fitness": "Sports & Fitness",
    "product_categories.books_stationery": "Books & Stationery",
    "product_categories.other": "Other",

    // Business Categories - Stores
    "business_categories.البقالات والسوبر ماركت": "Supermarket",
    "business_categories.المتاجر الإلكترونية": "Electronics Store",
    "business_categories.متاجر الملابس والأزياء": "Clothing Store",
    "business_categories.متاجر الأحذية": "Shoe Store",
    "business_categories.متاجر الأدوات المنزلية": "Home Appliances Store",
    "business_categories.متاجر الأثاث": "Furniture Store",
    "business_categories.متاجر الأدوات والمعدات": "Hardware Store",
    "business_categories.مكتبات وقرطاسية": "Bookstore & Stationery",
    "business_categories.مطاعم ومقاهي": "Restaurant & Cafe",
    "business_categories.متاجر المواد الغذائية": "Food Store",
    "business_categories.مخابز ومعجنات": "Bakery & Pastry",
    "business_categories.جزارات ولحوم": "Butcher Shop",
    "business_categories.متاجر الخضار والفواكه": "Fruits & Vegetables Store",
    "business_categories.صيدليات": "Pharmacy",
    "business_categories.مراكز التجميل": "Beauty Center",
    "business_categories.متاجر مستحضرات التجميل": "Cosmetics Store",
    "business_categories.عيادات طبية": "Medical Clinic",
    "business_categories.مختبرات طبية": "Medical Laboratory",
    "business_categories.خدمات الصيانة والإصلاح": "Maintenance & Repair Services",
    "business_categories.خدمات النظافة": "Cleaning Services",
    "business_categories.خدمات النقل والتوصيل": "Transportation & Delivery Services",
    "business_categories.خدمات التعليم": "Education Services",
    "business_categories.مكاتب محاسبة": "Accounting Office",
    "business_categories.متاجر الهواتف والإكسسوارات": "Mobile Phones & Accessories Store",
    "business_categories.مراكز صيانة الهواتف": "Mobile Phone Repair Center",
    "business_categories.متاجر الحواسيب والأجهزة": "Computer & Device Store",
    "business_categories.شركات الاتصالات": "Telecommunications Company",
    "business_categories.معارض السيارات": "Car Showroom",
    "business_categories.ورش صيانة السيارات": "Car Repair Shop",
    "business_categories.متاجر قطع غيار السيارات": "Auto Parts Store",
    "business_categories.محطات الوقود": "Gas Station",
    "business_categories.متاجر الألعاب والترفيه": "Toys & Entertainment Store",
    "business_categories.متاجر المعدات الرياضية": "Sports Equipment Store",
    "business_categories.صالات الألعاب الرياضية": "Sports Hall",
    "business_categories.مراكز الترفيه": "Entertainment Center",
    "business_categories.مكاتب عقارية": "Real Estate Office",
    "business_categories.متاجر مواد البناء": "Construction Materials Store",
    "business_categories.ورش البناء والمقاولات": "Construction & Contracting Workshop",
    "business_categories.مكاتب استشارات": "Consulting Office",
    "business_categories.مكاتب محاماة": "Law Office",
    "business_categories.مكاتب تأمين": "Insurance Office",
    "business_categories.متاجر الهدايا والهدايا التذكارية": "Gift & Souvenir Store",
    "business_categories.خدمات أخرى": "Other Services",
    "business_categories.مركز تسوق": "Shopping Center",
    "business_categories.مركز تجاري": "Commercial Center",
    "business_categories.سوق شعبي": "Popular Market",
    "business_categories.معرض فني": "Art Gallery",
    "business_categories.متجر كبير": "Large Store",
    "add_shelf.product_type_placeholder": "Example: Cosmetics / Cups / Devices",
    "add_shelf.description_label": "Description (Optional)",
    "add_shelf.description_placeholder": "Example: 'Near the door - right side of entrance'",
    "add_shelf.title_label": "Title",
    "add_shelf.address_label": "The Address",
    "add_shelf.location_on_map": "Select on Map",
    "add_shelf.address": "Hittin, Riyadh 13512, Saudi Arabia",
    "add_shelf.no_location_selected": "No location selected",
    "add_shelf.location_selected": "Location selected on map",
    "add_shelf.click_to_select_location": "Click to select location on map",
    "add_shelf.map_instructions": "Use the buttons to select a city or enter coordinates manually",
    "add_shelf.center_riyadh": "Riyadh",
    "add_shelf.center_jeddah": "Jeddah",
    "add_shelf.center_dammam": "Dammam",
    "add_shelf.latitude": "Latitude",
    "add_shelf.longitude": "Longitude",
    "add_shelf.shelf_image": "Shelf Image",
    "add_shelf.shelf_images": "Shelf Images",
    "add_shelf.upload_shelf_image": "Shelf Image",
    "add_shelf.upload_shelf_image_desc": "File size not exceeding 10 MB - JPG, PNG, GIF, WebP",
    "add_shelf.upload_interior_image": "Store Interior Image",
    "add_shelf.upload_interior_image_desc": "File size not exceeding 10 MB - JPG, PNG, GIF, WebP",
    "add_shelf.upload_exterior_image": "Store Exterior Image",
    "add_shelf.upload_exterior_image_desc": "File size not exceeding 10 MB - JPG, PNG, GIF, WebP",
    "add_shelf.submit_button": "Publish Shelf Now",
    "add_shelf.price_increase_notice": "Price will be increased by approximately {fee}%",
    "add_shelf.success_message": "Shelf added successfully and is now available for rent",
    "add_shelf.error_message": "Error adding shelf. Please try again",
    "add_shelf.discount_max_error": "Percentage must not exceed 22%",
    "add_shelf.file_size_error": "File size must not exceed 10MB",
    "add_shelf.price_fee_notice": "A Shibr fee will be added to the price",
    "add_shelf.shibr_percentage": "Shibr Percentage",
    "add_shelf.shelf_dimensions": "Shelf Dimensions",
    "add_shelf.update_button": "Update Shelf",
    "add_shelf.max_discount_error": "Maximum discount is {max}%",
    "add_shelf.platform_fee_notice": "A {fee}% Shibr fee will be added to the price",
    "add_shelf.update_success_message": "Shelf updated successfully",
    "add_shelf.description_optional": "Description (Optional)",
    "add_shelf.description_example": "Example: Next to the door - Right side of entrance",
    "add_shelf.loading_map": "Loading map...",
    "add_shelf.click_map_to_select": "Click on the map to select location",
    "add_shelf.location": "Location",
    "add_shelf.location_permission_denied": "Using default location - you can manually select location on the map",
    "add_shelf.required_fields_error": "Please fill in all required fields",
    "add_shelf.submit_error": "An error occurred during submission. Please try again",
    "add_shelf.price_must_be_positive": "Monthly price must be greater than zero",
    "add_shelf.commission_must_be_positive": "Commission rate must be greater than zero",
    "add_shelf.dimensions_must_be_positive": "Shelf dimensions (length, width, and depth) must be greater than zero",
    "add_shelf.cm": "cm",
    "add_shelf.dimension_placeholder": "0",
    "add_shelf.enter_dimensions": "Enter dimensions",
    "add_shelf.total_size": "Total size",
    "add_shelf.pick_date": "Pick date",
    "add_shelf.discount_percentage_placeholder": "0",
    "add_shelf.monthly_price_placeholder": "0",
    "add_shelf.uploading_images": "Uploading images...",
    "shelves.new_shelf": "New Shelf",
    "shelves.riyadh_shelf": "Riyadh Shelf",
    "shelves.dammam_shelf": "Dammam Shelf",
    "shelves.select_branch": "Select Branch",
    "shelves.select_branch_placeholder": "Select store branch",
    "shelves.no_branches_available": "No branches available. Please create a branch first.",
    "shelves.store_images_from_branch": "Store Images (from branch)",
    "shelves.select_city": "Select City",
    "shelves.address": "Address",
    "shelves.enter_address": "Enter address",
    "shelves.coordinates": "Coordinates",
    "shelves.city": "City",
    "dashboard.orders": "Orders",
    "dashboard.settings": "Settings",
    "dashboard.branches": "Branches",
    "dashboard.marketplace": "Marketplace",
    "dashboard.profile": "Profile",
    "dashboard.posts": "Posts",
    "dashboard.stores": "Stores",
    "dashboard.brands": "Brands",
    "dashboard.payments": "Payments",
    "dashboard.logout": "Logout",
    "dashboard.view_landing_page": "View Landing Page",
    "dashboard.user.profile": "Profile",
    "dashboard.user.settings": "Settings",
    "dashboard.user.name": "User Name",
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
    "dashboard.complete_profile_first": "Please complete your store data first",
    "dashboard.profile_complete": "Profile Complete",
    "dashboard.complete_your_profile": "Complete Your Profile",
    "dashboard.missing_fields": "Missing fields: {count}",
    "dashboard.complete_now": "Complete Now",
    "dashboard.manage_store_starts_here": "Managing your store starts here",
    "dashboard.display_shelf_now": "Display shelf now",
    "dashboard.monitor_performance_description":
      "Monitor your performance, display your shelves for rent, and start increasing your income with Shibr.",
    "dashboard.currently_rented_brands": "Currently rented brands count",
    "dashboard.total_sales": "Total Sales",
    "dashboard.incoming_orders": "Incoming Orders",
    "dashboard.increase_from_last_month": "+20.1% from last month",
    "dashboard.new_rental_requests": "New rental requests",
    "dashboard.see_more": "See more",
    "dashboard.no_rental_requests": "You have no rental requests",
    "dashboard.rental_requests_will_appear_here": "Rental requests will appear here when received",
    "dashboard.your_shelves": "Your shelves",
    "dashboard.no_shelves_displayed": "You have no shelves displayed at the moment",
    "dashboard.shelves_will_appear_here": "Shelves will appear here when added",

    // Admin Dashboard
    "dashboard.control_panel": "Control Panel",
    "dashboard.platform_overview": "Comprehensive overview of platform performance and statistics",
    "dashboard.total_users": "Total Users",
    "dashboard.from_last_month": "from last month",
    "dashboard.from_yesterday": "from yesterday",
    "dashboard.from_last_week": "from last week",
    "dashboard.shelves_count": "Shelves Count",
    "dashboard.rented": "rented",
    "dashboard.available": "available",
    "dashboard.total_revenue": "Total Revenue",
    "dashboard.from_rentals": "from rentals",
    "dashboard.rental_requests": "Rental Requests",
    "dashboard.revenue_rate": "Revenue Rate",
    "dashboard.revenue_overview": "Revenue Overview",
    "dashboard.total_revenue_from_platform": "Total revenue from platform",
    "dashboard.live": "Live",
    "dashboard.top_performing_stores": "Top Selling Brands",
    "dashboard.based_on_monthly_revenue": "Based on monthly revenue",
    "dashboard.store_name": "Store Name",
    "dashboard.brand_name": "Brand Name",
    "dashboard.revenue": "Revenue",
    "dashboard.growth": "Growth",
    "dashboard.no_stores_data": "No brands data available",
    "dashboard.yearly": "Yearly",
    "dashboard.monthly": "Monthly",
    "dashboard.weekly": "Weekly",
    "dashboard.daily": "Daily",
    "dashboard.top_selling_products": "Top Selling Products",
    "dashboard.increase_by": "Increase by",
    "dashboard.this_month": "this month",
    "dashboard.show_total_turnover": "Show total turnover for the month",
    "dashboard.stores_management": "Stores Management",
    "dashboard.branch": "Branch",
    "dashboard.shelf_name": "Shelf Name",
    "dashboard.date_added": "Date Added",
    "dashboard.status": "Status",
    "dashboard.options": "Options",
    "dashboard.view": "View",
    "dashboard.edit": "Edit",
    "dashboard.reject": "Reject",
    "dashboard.status_under_review": "Under Review",
    "dashboard.status_accepted": "Accepted",

    // Branches Page
    "branches.page_title": "Branch Management",
    "branches.add_branch": "Add Branch",
    "branches.branch_name": "Branch Name",
    "branches.all_filter": "All",
    "branches.active_filter": "Active",
    "branches.inactive_filter": "Inactive",
    "branches.search_placeholder": "Search by branch name or city...",
    "branches.stats.total": "Total Branches",
    "branches.stats.active": "Active Branches",
    "branches.stats.total_shelves": "Total Shelves",
    "branches.create_title": "Add New Branch",
    "branches.create_description": "Add a new branch for your store with location and images",
    "branches.edit_title": "Edit Branch",
    "branches.edit_description": "Update branch details",
    "branches.branch_name_label": "Branch Name",
    "branches.branch_name_placeholder": "Example: Main Riyadh Branch",
    "branches.city_label": "City",
    "branches.location_label": "Location",
    "branches.exterior_image_label": "Store Exterior Image",
    "branches.interior_image_label": "Store Interior Image",
    "branches.created_success": "Branch created successfully",
    "branches.updated_success": "Branch updated successfully",
    "branches.deleted_success": "Branch deleted successfully",
    "branches.branch_name_required": "Branch name is required",
    "branches.city_required": "City is required",
    "branches.address_required": "Address is required",
    "branches.delete_error_has_shelves": "Cannot delete branch with existing shelves. Please delete shelves first.",
    "branches.no_branches": "No branches",
    "branches.no_branches_description": "Start by adding a branch for your store",
    "branches.shelves_count": "Shelves Count",
    "branches.delete_confirm_title": "Are you sure you want to delete this branch?",
    "branches.delete_confirm_description": "Branch {name} will be deleted. This action cannot be undone.",
    "branches.details": "Branch Details",
    "branches.branch_details": "Branch Details",
    "branches.images": "Images",
    "branches.no_images": "No images",
    "branches.shelves_in_branch": "Shelves in this branch",
    "branches.upload_exterior_image": "Store Exterior Image",
    "branches.upload_interior_image": "Store Interior Image",

    // Posts Page
    "posts.title": "Shelf Publishing Requests",
    "posts.description": "Review shelf data added by store owners and verify details before approving publication on the platform.",
    "posts.all_shelves": "All Shelves",
    "posts.shelves_tab": "Shelves",
    "posts.new_post": "New Post",
    "posts.total_posts": "Total Posts",
    "posts.active_posts": "Active Posts",
    "posts.under_review": "Under Review",
    "posts.drafts": "Drafts",
    "posts.search_placeholder": "Search posts...",
    "posts.filter": "Filter",
    "posts.filter_all": "All",
    "posts.all_posts": "All Posts",
    "posts.table.title": "Title",
    "posts.table.author": "Author",
    "posts.table.category": "Category",
    "posts.table.status": "Status",
    "posts.table.date": "Date",
    "posts.table.views": "Views",
    "posts.table.actions": "Actions",
    "posts.table.percentage": "Percentage",
    "posts.status.published": "Published",
    "posts.status.under_review": "Under Review",
    "posts.status.draft": "Draft",
    "posts.status.rented": "Rented",
    "posts.status.rejected": "Rejected",
    "posts.no_results": "No results found",
    "posts.no_posts": "No posts yet",
    "posts.try_different_filter": "Try using different filters or search terms",
    "posts.posts_will_appear_here": "Shelf posts will appear here once added by store owners",
    "posts.clear_filters": "Clear filters",
    "posts.category.announcements": "Announcements",
    "posts.category.offers": "Offers",
    "posts.category.products": "Products",
    "posts.category.tips": "Tips",
    "posts.actions.view": "View",
    "posts.actions.edit": "Edit",
    "posts.actions.delete": "Delete",

    // Stores Page
    "stores.title": "Registered Commercial Stores on Shibr",
    "stores.description": "Comprehensive overview of store performance at Shibr",
    "stores.add_store": "Add Store",
    "stores.total_stores": "Total Stores",
    "stores.active_stores": "Active Stores",
    "stores.total_shelves": "Total Shelves",
    "stores.rented_shelves": "Rented Shelves",
    "stores.under_review": "Under Review",
    "stores.suspended": "Suspended",
    "stores.search_placeholder": "Search stores...",
    "stores.filter": "Filter",
    "stores.all_stores": "All Stores",
    "stores.stores_tab": "Stores",
    "stores.table.store": "Store",
    "stores.table.owner": "Owner",
    "stores.table.location": "Location",
    "stores.table.category": "Category",
    "stores.table.rating": "Rating",
    "stores.table.shelves": "Shelves Count",
    "stores.table.rentals": "Rentals Count",
    "stores.table.status": "Status",
    "stores.table.revenue": "Revenue",
    "stores.table.actions": "Actions",
    "stores.status.active": "Active",
    "stores.status.under_review": "Under Review",
    "stores.status.suspended": "Suspended",
    "stores.actions.view_details": "View Details",
    "stores.actions.edit": "Edit",
    "stores.actions.suspend": "Suspend",
    "stores.category.electronics": "Electronics",
    "stores.category.beauty": "Beauty",
    "stores.category.perfumes": "Perfumes",
    "stores.category.sports": "Sports",
    "stores.category.cafes": "Cafes",
    "stores.no_results": "No results found",
    "stores.no_stores": "No stores yet",
    "stores.try_different_search": "Try a different search term",
    "stores.stores_will_appear_here": "Stores will appear here when added",
    "stores.overview": "Overview",
    "stores.rentals": "Rentals",
    "stores.performance": "Performance",
    "stores.payment_summary": "Payment Summary",
    "stores.payments": "Payments",
    "stores.month_column": "Month",
    "stores.rented_shelves_count": "Rented Shelves Count",
    "stores.total_income": "Total Income",
    "stores.payment_method": "Payment Method",
    "stores.owner": "Owner",
    "stores.location": "Location",
    "stores.join_date": "Join Date",
    "stores.utilization": "Utilization Rate",
    "stores.shelves_count": "Shelves Count",
    "stores.renters_count": "Renters Count",
    "stores.total_revenue": "Total Revenue",
    "stores.active_rentals": "Active Rentals",
    "stores.monthly_revenue": "Monthly Revenue",
    "stores.branches": "Branches",
    "stores.branch_name": "Branch Name",
    "stores.city": "City",
    "stores.rented": "Rented",
    "stores.available": "Available",
    "stores.brand": "Brand",
    "stores.product": "Product",
    "stores.shelf": "Shelf",
    "stores.period": "Period",
    "stores.price": "Price",
    "stores.store_name_rental": "Store Name",
    "stores.rented_shelf": "Rented Shelf",
    "stores.duration": "Duration",
    "stores.payment": "Payment",
    "stores.status": "Status",
    "stores.rental_status.active": "Active",
    "stores.rental_status.pending": "Pending",
    "stores.rental_status.payment_pending": "Payment Pending",
    "stores.rental_status.completed": "Completed",
    "stores.rental_status.cancelled": "Cancelled",
    "stores.rental_status.rejected": "Rejected",
    "stores.rental_status.expired": "Expired",
    "stores.revenue_trend": "Revenue Trend",
    "stores.last_3_months": "Last 3 Months",
    "stores.month": "Month",
    "stores.revenue": "Revenue",
    "stores.rentals_count": "Rentals Count",
    "stores.avg_rental_value": "Avg Rental Value",
    "stores.activate": "Activate",
    "stores.suspend": "Suspend",
    "stores.view_profile": "View Profile",
    "stores.suspend_account": "Suspend Account",
    "stores.delete_store": "Delete Store",
    "stores.store_name": "Store Name",
    "stores.store_owner": "Store Owner",
    "stores.store_information": "Store Information",
    "stores.branches_count": "Branches Count",
    "stores.registration_date": "Registration Date",
    "stores.commercial_registry_number": "Commercial Registry Number",
    "stores.commercial_registry": "Commercial Registry",
    "stores.shelves": "Shelves",
    "stores.shelf_name": "Shelf Name",
    "stores.branch": "Branch",
    "stores.monthly_price": "Monthly Price",
    "stores.rented_to": "Rented To",
    "stores.options": "Options",
    "stores.shelf_status.active": "Active",
    "stores.shelf_status.rented": "Rented",
    "stores.shelf_status.available": "Available",
    "stores.shelf_status.suspended": "Suspended",
    "stores.shelf_status.under_review": "Under Review",
    "stores.shelf_status.rejected": "Rejected",
    "stores.filter.all": "All",
    "stores.search_shelves_placeholder": "Search by name or branch",
    "stores.no_shelves": "No shelves",
    "stores.no_shelves_found": "No shelves found",
    "stores.shelves_will_appear_here": "Shelves will appear here when added",
    "stores.try_different_filter": "Try a different filter",
    "stores.store_details": "Store Details",
    "stores.shelf_details": "Shelf Details",
    "stores.no_rentals": "No rentals",
    "stores.rentals_will_appear_here": "Rentals will appear here when available",
    "stores.no_payments": "No payments",
    "stores.payments_will_appear_here": "Payments will appear here when recorded",

    // Brands page
    "brands.title": "Brands",
    "brands.description": "Overview of brand performance on the platform",
    "brands.total_brands": "Total Brands",
    "brands.total_products": "Total Products",
    "brands.total_revenue": "Total Revenue",
    "brands.all_brands": "All Brands",
    "brands.search_placeholder": "Search brands...",
    "brands.table.brand": "Brand",
    "brands.table.category": "Category",
    "brands.table.products": "Products",
    "brands.table.stores": "Stores",
    "brands.table.revenue": "Revenue",
    "brands.table.status": "Status",
    "brands.status.active": "Active",
    "brands.status.suspended": "Suspended",
    "brands.category.general": "General",
    "brands.category.registered_company": "Registered Company",
    "brands.category.freelancer": "Freelancer",
    "brands.category.sports": "Sports",
    "brands.category.Sports": "Sports",
    "brands.category.electronics": "Electronics",
    "brands.category.Electronics": "Electronics",
    "brands.category.fashion": "Fashion",
    "brands.category.Fashion": "Fashion",
    "brands.category.food": "Food",
    "brands.category.Food": "Food",
    "brands.category.beverages": "Beverages",
    "brands.category.Beverages": "Beverages",
    "brands.category.home": "Home",
    "brands.category.Home": "Home",
    "brands.category.health": "Health",
    "brands.category.Health": "Health",
    "brands.category.toys": "Toys",
    "brands.category.Toys": "Toys",
    "brands.category.books": "Books",
    "brands.category.Books": "Books",
    "brands.category.clothing": "Clothing",
    "brands.category.Clothing": "Clothing",
    "brands.category.T Shirts": "T-Shirts",
    "brands.category.T-Shirts": "T-Shirts",
    "brands.category.t-shirts": "T-Shirts",
    "brands.overview": "Overview",
    "brands.stores": "Stores",
    "brands.payment_summary": "Payment Summary",
    "brands.suspend_account": "Suspend Account",
    "brands.delete_brand": "Delete Brand",
    "brands.brand_name": "Brand Name",
    "brands.brand_owner": "Brand Owner",
    "brands.owner_name": "Owner Name",
    "brands.brand_details": "Brand Details",
    "brands.brand_information": "Brand Information",
    "brands.join_date": "Join Date",
    "brands.registration_number": "Registration Number",
    "brands.registration_document": "Registration Document",
    "brands.registration_date": "Registration Date",
    "brands.commercial_registry_number": "Commercial Registry Number",
    "brands.commercial_registry": "Commercial Registry",
    "brands.download": "Download",
    "brands.products": "Products",
    "brands.products_displayed": "Displayed Products",
    "brands.search_products_placeholder": "Search products",
    "brands.product_name": "Product Name",
    "brands.product_code": "Product Code",
    "brands.price": "Price",
    "brands.quantity": "Quantity",
    "brands.sales": "Sales",
    "brands.stores_count": "Stores Count",
    "brands.stores_list": "Stores List",
    "brands.search_stores_placeholder": "Search stores",
    "brands.products_count": "Products Count",
    "brands.revenue": "Revenue",
    "brands.status": "Status",
    "brands.month_column": "Month",
    "brands.products_sold": "Products Sold",
    "brands.total_income": "Total Income",
    "brands.payment_method": "Payment Method",
    "brands.total_stores": "Total Stores",
    "brands.status.inactive": "Inactive",
    "brands.total_payments_due": "Total Payments Due",
    "brands.rented_shelves_count": "Rented Shelves Count",
    "brands.payment_collection_log": "Payment Collection Log",
    "brands.displayed_products": "Displayed Products",
    "brands.invoice_number": "Invoice Number",
    "brands.payment_date": "Payment Date",
    "brands.payment_status": "Payment Status",
    "brands.collection_date": "Collection Date",
    "brands.paid": "Paid",
    "brands.pending": "Pending",
    "brands.no_payments": "No payments",
    "brands.payments_will_appear_here": "Payments will appear here when available",
    "brands.no_products": "No products",
    "brands.display_date": "Display Date",
    "brands.product_image": "Image",
    "brands.sales_count": "Sales Count",
    "brands.search_payments_placeholder": "Search payments...",
    "brands.select_month": "Select Month",
    "brands.filter_all": "All",
    "brands.filter_completed": "Completed",
    "brands.filter_needs_collection": "Needs Collection",
    "brands.filter_upcoming": "Upcoming",
    "brands.store_owner": "Store Owner",
    "brands.website": "Website",
    "brands.contact_method": "Contact Method",
    "brands.payment_operations_log": "Payment Operations Log",
    "brands.history": "History",
    "brands.store": "Store",
    "brands.operation_type": "Payment Method",
    "brands.amount": "Amount",
    "brands.status_column": "Status",
    "brands.options": "Options",
    "brands.download_invoice": "Download Invoice",
    "brands.payment_completed": "Completed",
    "brands.payment_pending": "Pending Confirmation",
    "brands.payment_transfer": "Bank Transfer",
    "brands.category.beauty": "Beauty",
    "brands.category.health_beauty": "Health & Beauty",
    "brands.no_results": "No results found",
    "brands.no_brands": "No brands",
    "brands.try_different_search": "Try searching with different keywords",
    "brands.brands_will_appear_here": "Brands will appear here when added",
    "brands.products_will_appear_here": "Products will appear here when added",
    "brands.clear_search": "Clear search",

    // Posts page
    "posts.post_details": "Post Details",
    "posts.shelf_details": "Shelf Details",
    "posts.store_name": "Store Name",
    "posts.branch": "Branch",
    "posts.shelf_name": "Shelf Name",
    "posts.rental_price": "Rental Price",
    "posts.price_with_percentage": "Price with Percentage",
    "posts.address": "Address",
    "posts.added_date": "Added Date",
    "posts.shelf_dimensions": "Shelf Dimensions",
    "posts.suitable_products": "Suitable Product Types",
    "posts.rental_period": "Rental Period",
    "posts.store_info": "Store Information",
    "posts.store_field": "Store",
    "posts.store_branch": "Branch",
    "posts.store_review_date": "Review Date",
    "posts.rental_method": "Rental Method",
    "posts.contact_method": "Contact Method",
    "posts.commercial_registry": "Commercial Registry",
    "posts.download_registry": "Download Registry",
    "posts.shelf_description": "Shelf Description",
    "posts.shelf_images": "Shelf Images",
    "posts.shelf_information": "Shelf Information",
    "posts.monthly_price": "Monthly Price",
    "posts.commission_percentage": "Commission Percentage",
    "posts.date_added": "Date Added",
    "posts.location": "Location",
    "posts.dimensions": "Dimensions",
    "posts.width": "Width",
    "posts.height": "Height",
    "posts.depth": "Depth",
    "posts.no_images": "No Images",
    "posts.store_details": "Store Details",
    "posts.store_type": "Store Type",
    "posts.retail_store": "Retail Store",
    "posts.store_owner": "Store Owner",
    "posts.member_since": "Member Since",
    "posts.rental_information": "Rental Information",
    "posts.renter_name": "Renter Name",
    "posts.rental_start_date": "Rental Start Date",
    "posts.rental_end_date": "Rental End Date",
    "posts.rental_duration": "Rental Duration",
    "posts.view_store": "View Store",
    "posts.back_to_store_details": "Back to Store Details",
    "posts.available": "Available",
    "posts.rented": "Rented",
    "posts.shelf": "Shelf",
    "posts.renter_details": "Renter Details",
    "posts.merchant_name": "Merchant Name",
    "posts.rental_amount": "Rental Amount",
    "posts.rental_date": "Rental Date",
    "posts.end_date": "End Date",
    "posts.shelf_not_rented": "Shelf is not currently rented",
    "posts.no_renter_details": "No renter details available",
    "posts.approve_post": "Approve Post",
    "posts.reject_post": "Reject Post",
    "posts.delete_post": "Delete Post",
    "posts.small": "Small",
    "posts.large": "Large",
    "posts.per_month": "per month",

    // Payments page  
    "payments.title": "Payments",
    "payments.description": "Manage and track all financial transactions and payments",
    "payments.export_report": "Export Report",
    "payments.total_received": "Total Payments Received",
    "payments.current_month": "Current Month Payments",
    "payments.pending_payments": "Pending Payments",
    "payments.invoices_issued": "Invoices Issued",
    "payments.search_placeholder": "Search transactions...",
    "payments.filter": "Filter",
    "payments.filter_all": "All",
    "payments.filter_paid": "Paid",
    "payments.filter_unpaid": "Unpaid",
    "payments.no_results": "No results found",
    "payments.no_payments": "No payments yet",
    "payments.try_different_filter": "Try a different filter",
    "payments.payments_will_appear_here": "Payments will appear here",
    "payments.all_transactions": "All Transactions",
    "payments.table.invoice_number": "Invoice Number",
    "payments.table.merchant": "Merchant",
    "payments.table.store": "Store",
    "payments.table.date": "Date",
    "payments.table.amount": "Amount",
    "payments.table.percentage": "Percentage",
    "payments.table.method": "Method",
    "payments.table.status": "Status",
    "payments.table.options": "Options",
    "payments.type.shelf_rental": "Shelf Rental",
    "payments.type.brand_payment": "Brand Payment",
    "payments.type.store_settlement": "Store Settlement",
    "payments.type.refund": "Refund",
    "payments.method.card": "Card",
    "payments.method.credit_card": "Credit Card",
    "payments.method.bank_transfer": "Bank Transfer",
    "payments.method.digital_wallet": "Digital Wallet",
    "payments.status.paid": "Paid",
    "payments.status.unpaid": "Unpaid",
    "payments.actions.view_details": "View Details",
    "payments.actions.download_receipt": "Download Receipt",

    // Admin Settings Page
    "admin.settings.title": "System Settings",
    "admin.settings.description": "Manage platform settings and control features",
    "admin.settings.general": "General Settings",
    "admin.settings.users": "Admin Management",
    "admin.settings.general_title": "General Settings",
    "admin.settings.platform_name": "Shibr Name",
    "admin.settings.platform_url": "Shibr URL",
    "admin.settings.platform_description": "Shibr Description",
    "admin.settings.language_region": "Language & Region Settings",
    "admin.settings.default_language": "Default Language",
    "admin.settings.timezone": "Timezone",
    "admin.settings.save_changes": "Save Changes",
    "admin.settings.users_title": "Admin Management",
    "admin.settings.allow_registration": "Allow New Registration",
    "admin.settings.allow_registration_desc": "Allow new users to register",
    "admin.settings.email_verification": "Email Verification Required",
    "admin.settings.email_verification_desc": "Email must be verified before account use",
    "admin.settings.review_stores": "Review New Stores",
    "admin.settings.review_stores_desc": "Review stores before approval",
    "admin.settings.user_limits": "User Limits",
    "admin.settings.max_stores_per_user": "Maximum Stores per User",
    "admin.settings.max_shelves_per_store": "Maximum Shelves per Store",
    "admin.settings.save_user_settings": "Save User Settings",

    // Admin Roles
    "admin.role.super_admin": "Super Admin",
    "admin.role.support": "Support",
    "admin.role.finance": "Finance",
    "admin.role.operations": "Operations",

    // Business Types
    "business_type.registered_company": "Registered Company",
    "business_type.freelancer": "Freelancer",

    // Transfer Status
    "transfer_status.pending": "Pending",
    "transfer_status.processing": "Processing",
    "transfer_status.completed": "Completed",
    "transfer_status.failed": "Failed",

    // Support Ticket Status
    "support_ticket.status.new": "New",
    "support_ticket.status.in_progress": "In Progress",
    "support_ticket.status.resolved": "Resolved",
    "support_ticket.status.closed": "Closed",

    // Contact Form Subjects
    "contact.subject.general": "General Inquiry",
    "contact.subject.support": "Technical Support",
    "contact.subject.business": "Business Partnership",
    "contact.subject.complaint": "Complaint",

    // Contact Page
    "contact.page_title": "Shibr is here to support you 24/7",
    "contact.page_description": "We're here ready for any inquiries, solutions, or suggestions..",
    "contact.info_title": "Contact Information",
    "contact.info_phone": "Phone",
    "contact.info_email": "Email",
    "contact.info_address": "Address",
    "contact.info_working_hours": "Working Hours",
    "contact.address_value": "Riyadh, Kingdom of Saudi Arabia",
    "contact.working_hours_value": "Sunday - Thursday: 9:00 AM - 6:00 PM",
    "contact.follow_us": "Follow Us",
    "contact.send_message_title": "Send Us a Message",
    "contact.full_name": "Full Name",
    "contact.full_name_placeholder": "Enter your full name",
    "contact.email": "Email",
    "contact.phone": "Phone Number",
    "contact.message_type": "Message Type",
    "contact.message": "Message",
    "contact.message_placeholder": "Write your message here...",
    "contact.sending": "Sending...",
    "contact.send_message": "Send Message",
    "contact.name_required": "Name is required",
    "contact.email_required": "Email is required",
    "contact.email_invalid": "Invalid email address",
    "contact.phone_required": "Phone number is required",
    "contact.phone_invalid": "Invalid phone number",
    "contact.message_required": "Message is required",
    "contact.message_too_short": "Message must be at least 10 characters",
    "contact.sent_successfully": "Sent Successfully",
    "contact.sent_success_description": "We'll get back to you as soon as possible",
    "contact.error": "Error",
    "contact.error_description": "An error occurred while sending. Please try again",
    "contact.message_sent_title": "Message Sent Successfully",
    "contact.message_sent_description": "Thank you for contacting us. We'll respond to you as soon as possible.",
    "contact.back_to_home": "Back to Home",
    "contact.send_another": "Send Another Message",

    // Chat
    "chat.conversation_closed": "This conversation is closed and new messages cannot be sent",
    "chat.start_conversation_about": "Start a conversation about",

    // Cities
    "city.riyadh": "Riyadh",
    "city.jeddah": "Jeddah",
    "city.dammam": "Dammam",
    "city.mecca": "Mecca",
    "city.medina": "Medina",
    "city.khobar": "Khobar",
    "city.taif": "Taif",
    "city.tabuk": "Tabuk",
    "city.abha": "Abha",

    // Shelf Names
    "shelf_name.front_display": "Front Display",
    "shelf_name.premium_shelf": "Premium Shelf",
    "shelf_name.corner_unit": "Corner Unit",
    "shelf_name.main_aisle": "Main Aisle",
    "shelf_name.sports_section": "Sports Section",
    "shelf_name.electronics_corner": "Electronics Corner",
    "shelf_name.entrance_display": "Entrance Display",
    "shelf_name.central_aisle": "Central Aisle",

    // Platform Commission Settings
    "admin.settings.commission_settings": "Commission Settings",
    "admin.brand_sales_commission": "Brand Sales Commission",
    "admin.store_rent_commission": "Store Rent Commission",
    "admin.brand_commission_desc": "Percentage charged on brand product sales",
    "admin.store_commission_desc": "Percentage charged on shelf rental fees",
    "admin.commission_percentage_symbol": "%",

    // Settings Page
    "settings.title": "Settings",
    "settings.description": "Manage your store and account settings",
    "settings.brand_description": "Manage your brand and account settings",
    "settings.tabs.general": "General",
    "settings.tabs.store_data": "Store Data",
    "settings.tabs.brand_data": "Brand Data",
    "settings.tabs.payment": "Payment Settings",
    "settings.tabs.security": "Security",
    "settings.tabs.branches": "Branches",
    "settings.tabs.financial": "Financial",
    "settings.tabs.notifications": "Notifications",

    // General Settings
    "settings.general.title": "General Settings",
    "settings.general.description": "Basic information about your store",
    "settings.general.logo_placeholder": "Logo",
    "settings.general.upload_logo": "Upload Store Logo",
    "settings.general.upload_brand_logo": "Upload Brand Logo",
    "settings.general.logo_hint": "PNG, JPG up to 2MB",
    "settings.general.change_photo": "Change Photo",
    "settings.profile_completion_title": "Profile Completion",
    "settings.profile_complete_description": "Your profile is complete and you can now use all features",
    "settings.profile_incomplete_description": "Complete your profile to access all platform features",
    "settings.fields_completed": "fields completed",
    "settings.missing_required_fields": "Missing Required Fields",
    "settings.completed_fields": "Completed Fields",
    "settings.add_now": "Add Now",
    "settings.security.title": "Security Settings",
    "settings.security.description": "Update your email, phone number, and password",
    "settings.security.current_email": "Current Email",
    "settings.security.new_email": "New Email",
    "settings.security.new_email_placeholder": "Enter new email address",
    "settings.security.email_verification_required": "A verification link will be sent to your new email",
    "settings.security.current_phone": "Current Phone Number",
    "settings.security.new_phone": "New Phone Number",
    "settings.security.sms_verification_required": "A verification code will be sent via SMS",
    "settings.security.change_password": "Change Password",
    "settings.security.current_password": "Current Password",
    "settings.security.new_password": "New Password",
    "settings.security.confirm_password": "Confirm Password",
    "settings.security.password_requirements": "Must be at least 8 characters, with one uppercase, one number, and one special character",
    "settings.security.save_changes": "Save Changes",
    "settings.security.verification_required": "Verification Required",
    "settings.security.verification_required_desc": "A verification code will be sent to confirm your changes",
    "settings.general.basic_info": "Basic Information",
    "settings.general.store_name": "Store Name",
    "settings.general.store_name_placeholder": "Enter your store name",
    "settings.general.commercial_register": "Commercial Register",
    "settings.general.commercial_register_placeholder": "Commercial register number",
    "settings.general.store_type": "Store Type",
    "settings.general.select_store_type": "Select store type",
    "settings.general.types.supermarket": "Supermarket",
    "settings.general.types.pharmacy": "Pharmacy",
    "settings.general.types.restaurant": "Restaurant",
    "settings.general.types.cafe": "Cafe",
    "settings.general.types.clothing": "Clothing",
    "settings.general.types.electronics": "Electronics",
    "settings.general.types.other": "Other",
    "settings.general.establishment_date": "Establishment Date",
    "settings.general.contact_info": "Contact Information",
    "settings.general.owner_name": "Owner Name",
    "settings.general.cannot_change": "Cannot be changed",
    "settings.general.phone_number": "Phone Number",
    "settings.general.email": "Email",
    "settings.general.password": "Password",
    "settings.general.website": "Website",
    "settings.general.location_info": "Location Information",
    "settings.general.country": "Country",
    "settings.general.select_country": "Select country",
    "settings.general.saudi_arabia": "Saudi Arabia",
    "settings.general.city": "City",
    "settings.general.select_city": "Select city",
    "settings.general.cities.riyadh": "Riyadh",
    "settings.general.cities.jeddah": "Jeddah",
    "settings.general.cities.mecca": "Mecca",
    "settings.general.cities.medina": "Medina",
    "settings.general.cities.dammam": "Dammam",
    "settings.general.cities.khobar": "Khobar",
    "cities.riyadh": "Riyadh",
    "cities.jeddah": "Jeddah",
    "cities.dammam": "Dammam",
    "cities.medina": "Medina",
    "cities.mecca": "Mecca",
    "cities.khobar": "Khobar",
    "cities.dhahran": "Dhahran",
    "cities.taif": "Taif",
    "cities.buraidah": "Buraidah",
    "cities.tabuk": "Tabuk",
    "cities.hail": "Hail",
    "cities.hafar_al_batin": "Hafar Al-Batin",
    "cities.jubail": "Jubail",
    "cities.najran": "Najran",
    "cities.abha": "Abha",
    "cities.khamis_mushait": "Khamis Mushait",
    "cities.jazan": "Jazan",
    "cities.yanbu": "Yanbu",
    "cities.al_qatif": "Al-Qatif",
    "cities.unaizah": "Unaizah",
    "cities.arar": "Arar",
    "cities.sakaka": "Sakaka",
    "cities.al_kharj": "Al-Kharj",
    "cities.al_ahsa": "Al-Ahsa",
    "currency.sar": "SAR",
    "months.may": "May",
    "months.june": "June",
    "months.july": "July",
    "status.active": "Active",
    "status.pending_activation": "Pending Activation",
    "status.ended": "Ended",
    "settings.general.full_address": "Full Address",
    "settings.general.address_placeholder": "Street, District, Building number",
    "settings.general.store_description": "Store Description",
    "settings.general.store_description_label": "Description",
    "settings.general.description_placeholder": "Write a detailed description about your store and the services you provide",
    "settings.general.operating_hours": "Operating Hours",
    "settings.general.opening_time": "Opening Time",
    "settings.general.closing_time": "Closing Time",
    "settings.general.open_24_hours": "Open 24 Hours",
    "settings.general.save_changes": "Save Changes",

    // Store Data Settings
    "settings.store_data.store_name": "Store Name",
    "settings.store_data.store_name_placeholder": "Enter store name",
    "settings.store_data.store_type": "Business Category",
    "settings.store_data.store_type_placeholder": "Select business category",
    "settings.store_data.website": "Website",
    "settings.store_data.website_placeholder": "https://example.com",
    "settings.store_data.commercial_reg": "Commercial Registration Number",
    "settings.store_data.commercial_reg_placeholder": "Enter commercial registration number",
    "settings.store_data.no_commercial_reg": "No commercial registration (Freelance)",
    "settings.store_data.upload_logo": "Document Image",
    "settings.store_data.upload_hint": "File size up to 10MB\nJPG, PNG or PDF",
    "settings.store_data.commercial_register_document": "Commercial Register Document",
    "settings.store_data.document_uploaded": "Document Uploaded",
    "settings.store_data.document_ready": "Document ready for review",
    "settings.store_data.remove_document": "Remove Document",
    "settings.store_data.upload_commercial_register": "Upload Commercial Register",
    "settings.store_data.accepted_formats": "PDF, JPG, PNG, DOC, DOCX - Max 10MB",
    "settings.store_data.file_too_large": "File too large. Maximum size is 10MB",
    "settings.store_data.document_uploaded_success": "Commercial register document uploaded successfully",
    "settings.store_data.document_upload_error": "Failed to upload document. Please try again",
    "settings.store_data.document_ready_to_save": "Document selected. Click Save Changes to upload",
    "settings.store_data.preview_document": "Preview Document",
    "settings.store_data.choose_file": "Choose File",
    "settings.store_data.save_changes": "Save Changes",

    // Payment Settings
    "settings.payment.payment_methods_title": "Payment and Collection Settings",
    "settings.payment.brand_name": "Brand Name",
    "settings.payment.brand_name_placeholder": "Enter brand name",
    "settings.payment.business_type": "Business Type",
    "settings.payment.business_type_placeholder": "Select business type",
    "settings.payment.website": "Website",
    "settings.payment.website_placeholder": "https://example.com",
    "settings.payment.commercial_reg": "Commercial Registration Number",
    "settings.payment.commercial_reg_placeholder": "Enter commercial registration number",
    "settings.payment.no_commercial_reg": "No commercial registration (Freelance)",
    "settings.payment.upload_document": "Document Image",
    "settings.payment.upload_hint": "File size up to 10MB\nJPG, PNG or PDF",
    "settings.payment.choose_file": "Choose File",
    "settings.payment.save_changes": "Save Changes",
    "settings.payment.payment_records_title": "Payment and Collection Settings",
    "settings.payment.add_payment_method": "Add Payment Method",
    "settings.payment.table.date": "Date",
    "settings.payment.table.type": "Type",
    "settings.payment.table.status": "Status",
    "settings.payment.table.details": "Details",
    "settings.payment.table.method": "Payment Method",
    "settings.payment.table.actions": "Actions",
    "settings.payment.table.completed": "Completed",
    "settings.payment.table.active": "Active",
    "settings.payment.table.new_completion": "Bank Transfer",
    "settings.payment.table.pending_confirmation": "Pending Confirmation",
    "settings.payment.payment_records_summary": "Payment and Collection Records",
    "settings.payment.summary.date": "Date",
    "settings.payment.summary.history": "History",
    "settings.payment.summary.type": "Type",
    "settings.payment.summary.payment_method": "Payment Method",
    "settings.payment.summary.status": "Status",
    "settings.payment.summary.actions": "Actions",
    "settings.payment.summary.download_invoice": "Download Invoice",
    "settings.payment.summary.schedule_invoice": "Pay Invoice",
    "settings.payment.summary.completed": "Completed",
    "settings.payment.summary.pending_confirmation": "Pending Confirmation",
    "settings.payment.dialog.title": "Add Payment Method",
    "settings.payment.dialog.select_bank": "Select Bank",
    "settings.payment.dialog.bank_placeholder": "Select a bank from the list",
    "settings.payment.dialog.account_name": "Account Holder Name",
    "settings.payment.dialog.account_name_placeholder": "Mohammed Ahmed Adel",
    "settings.payment.dialog.account_number": "Bank Card/Account Number",
    "settings.payment.dialog.account_number_placeholder": "Please enter account number",
    "settings.payment.dialog.iban": "IBAN",
    "settings.payment.dialog.iban_placeholder": "SA00 0000 0000 0000 0000 0000",
    "settings.payment.dialog.detected_bank": "Detected Bank",
    "settings.payment.dialog.iban_certificate": "IBAN Certificate",
    "settings.payment.dialog.certificate_uploaded": "Certificate Uploaded",
    "settings.payment.dialog.certificate_ready": "Certificate Ready",
    "settings.payment.dialog.upload_certificate": "Upload IBAN Certificate",
    "settings.payment.dialog.certificate_formats": "PDF, JPG, PNG (max 5MB)",
    "settings.payment.dialog.choose_file": "Choose File",
    "settings.payment.dialog.certificate_hint": "You can obtain an IBAN certificate from your bank or through online banking services",
    "settings.payment.dialog.file_too_large": "File size must not exceed 5MB",
    "settings.payment.dialog.virtual": "Virtual",
    "settings.payment.dialog.cancel": "Cancel",
    "settings.payment.dialog.save": "Save Changes",
    "settings.payment.active": "Active",
    "settings.payment.inactive": "Inactive",
    "settings.payment.virtual": "Virtual",
    "settings.payment.physical": "Physical",
    "settings.payment.no_payment_methods": "No payment methods",
    "settings.payment.deleted": "Deleted",
    "settings.payment.deleted_message": "Payment method deleted successfully",
    "settings.payment.error": "Error",
    "settings.payment.error_message": "An error occurred, please try again",
    "settings.payment.success": "Success",
    "settings.payment.added_message": "Payment method added successfully",
    "settings.payment.validation_error": "Validation Error",
    "settings.payment.fill_all_fields": "Please fill all required fields",
    "settings.payment.invalid_iban": "Invalid IBAN number",
    "settings.payment.certificate_required": "IBAN certificate is required",
    "settings.payment.banks.alrajhi": "Al-Rajhi Bank",
    "settings.payment.banks.ncb": "National Commercial Bank",
    "settings.payment.banks.sabb": "SABB",
    "settings.payment.banks.riyad": "Riyad Bank",
    "settings.payment.banks.alinma": "Alinma Bank",
    "settings.payment.june_1": "June 1",
    "settings.payment.june_1_new": "June 1 (New)",
    "settings.payment.bank_transfer": "Bank Transfer",
    "settings.payment.payment_from_riyadh_shelf": "Payment from Riyadh shelf",
    "settings.payment.payment_from_shelf_rental": "Payment from shelf rental",
    "settings.payment.shelf_rental_payment": "Shelf rental payment",
    "settings.payment.shelf_renewal_fees": "Shelf renewal fees",
    "settings.payment.completed": "Completed",
    "settings.payment.pending": "Pending",
    "settings.payment.failed": "Failed",
    "settings.payment.pending_confirmation": "Pending Confirmation",
    "settings.payment.download_invoice": "Download Invoice",
    "settings.payment.view_invoice": "View Invoice",
    "settings.payment.pay_invoice": "Pay Invoice",
    "settings.payment.no_payment_records": "No payment records",
    "settings.payment.brand_payment": "Brand Payment",
    "settings.payment.store_settlement": "Store Settlement",
    "settings.payment.refund": "Refund",
    "settings.payment.platform_fee": "Shibr Fee",
    "add_shelf.default_address": "Riyadh, Saudi Arabia",
    "settings.general.success": "Success",
    "settings.general.success_message": "General settings saved successfully",
    "settings.general.error": "Error",
    "settings.general.info": "Information",
    "settings.general.error_message": "Error saving settings",
    "settings.general.saving": "Saving...",
    "settings.general.uploading": "Uploading...",
    "settings.general.image_updated": "Image updated successfully",
    "settings.general.invalid_image_type": "Please select a valid image file",
    "settings.general.image_too_large": "Image size must be less than 5MB",
    "settings.general.image_upload_error": "Error uploading image",
    "image_cropper.title": "Crop Image",
    "image_cropper.save": "Save Image",

    // Shelf Details
    "shelf_details.not_found": "Shelf Not Found",
    "shelf_details.not_found_description": "We couldn't find the requested shelf",
    "shelf_details.back_to_shelves": "Back to Shelves",
    "shelf_details.discount": "discount",
    "shelf_details.available": "Available",
    "shelf_details.rented": "Rented",
    "shelf_details.cannot_edit_rented": "Cannot edit rented shelf",
    "shelf_details.edit_shelf": "Edit Shelf",
    "shelf_details.location": "Location",
    "shelf_details.seller_details": "Renter Details",
    "shelf_details.renter_name": "Renter Name",
    "shelf_details.communication_method": "Communication Method",
    "shelf_details.rental_date": "Rental Date",
    "shelf_details.renter_rating": "Renter Rating",
    "shelf_details.download_commercial_register": "Download Commercial Register",
    "shelf_details.sold_products": "Displayed Products",
    "shelf_details.search_product": "Search by product name or code...",
    "shelf_details.image": "Image",
    "shelf_details.product_name": "Product Name",
    "shelf_details.code": "Code",
    "shelf_details.price": "Price",
    "shelf_details.quantity": "Quantity",
    "shelf_details.sales_count": "Sales Count",
    "shelf_details.commission_revenue": "Commission Revenue",
    "shelf_details.payment_records": "Payment Records",
    "shelf_details.payment_date": "Collection Date",
    "shelf_details.status": "Status",
    "shelf_details.amount": "Amount",
    "shelf_details.month": "Month",
    "shelf_details.collected": "Collected",
    "shelf_details.pending": "Pending",
    "shelf_details.previous_renters": "Previous Information",
    "shelf_details.industry_type": "Industry Type",
    "shelf_details.rating": "Rating",
    "shelf_details.shelf_info": "Shelf Information",
    "shelf_details.shelf_name": "Shelf Name",
    "shelf_details.city": "City",
    "shelf_details.branch": "Branch",
    "shelf_details.dimensions": "Dimensions",
    "shelf_details.monthly_price": "Monthly Price",
    "shelf_details.discount_percentage": "Discount Percentage",
    "shelf_details.store_commission": "Store Commission",
    "shelf_details.available_from": "Available From",
    "shelf_details.product_types": "Product Types",
    "shelf_details.address": "Address",
    "shelf_details.previous_information": "Previous Information",
    "shelf_details.view_renter": "Contact Renter",
    "shelf_details.no_renter": "No renter currently",
    "shelf_details.activity_type": "Activity Type",
    "shelf_details.rental_start_date": "Rental Start Date",
    "shelf_details.rental_end_date": "Rental End Date",
    "shelf_details.activity": "Activity",
    "shelf_details.commercial_register": "Commercial Register",
    "shelf_details.activity_care": "Skin Care",
    "shelf_details.download_commercial": "Download Register",
    "shelf_details.location_info": "Location Information",
    "shelf_details.pricing_details": "Pricing & Details",
    "shelf_details.sample_product": "Sample Product",
    "shelf_details.no_previous_renters": "No Previous Renters",
    "shelf_details.excellent": "Excellent",
    "shelf_details.pricing_and_commission": "Pricing & Commission",
    "shelf_details.pricing": "Pricing",
    "shelf_details.commission": "Commission",
    "shelf_details.renter_details": "Renter Details",
    "shelf_details.displayed_products": "Displayed Products",
    "shelf_details.merchant_name": "Merchant Name",
    "shelf_details.end_date": "End Date",
    "shelf_details.rental_method": "Rental Method",
    "shelf_details.collection_date": "Collection Date",
    "shelf_details.value": "Value",
    "shelf_details.revenue": "Revenue",
    "shelf_details.renter_will_appear_here": "Renter will appear here when rented",
    "shelf_details.no_products_sold": "No products displayed",
    "shelf_details.products_will_appear_here": "Products will appear here when added",
    "shelf_details.no_payment_records": "No payment records",
    "shelf_details.payments_will_appear_here": "Payments will appear here when collected",
    "shelf_details.rental_history_will_appear_here": "Rental history will appear here",
    "shelf_details.download": "Download",
    "shelf_details.monthly_rental": "Monthly Rental",
    "shelf_details.shelf_information": "Shelf Information",
    "shelf_details.products": "Products",
    "shelf_details.payments": "Payments",
    "shelf_details.rental_history": "Rental History",
    "shelf_details.total_revenue": "Total Revenue",
    "shelf_details.products_sold": "Products Sold",
    "shelf_details.total_renters": "Total Renters",
    "shelf_details.actions": "Actions",
    "shelf_details.duration": "Duration",
    "shelf_details.end_rental": "End Rental",
    "shelf_details.delete_shelf": "Delete Shelf",
    "shelf_details.delete_shelf_title": "Delete Shelf",
    "shelf_details.delete_shelf_description": "Are you sure you want to delete this shelf? This action cannot be undone.",
    "settings.store_data.success": "Success",
    "settings.store_data.success_message": "Store data saved successfully",
    "settings.store_data.locked_title": "Store Data Protected",
    "settings.store_data.locked_description": "Store data cannot be modified after initial registration for security and legal reasons. If you need to update this information, please contact support.",
    "settings.store_data.document_locked": "Document is protected and cannot be changed",
    "settings.store_data.error": "Error",
    "settings.store_data.error_message": "Error saving store data",
    "settings.store_data.saving": "Saving...",
    "settings.store_data.validation_error": "Validation Error",
    "settings.store_data.fill_required_fields": "Please fill all required fields",
    "settings.store_data.basic_info_required": "Please complete basic information (Name, Email, Phone Number)",
    "settings.store_data.document_required": "Please upload your Commercial Registration document",
    "settings.store_data.logo_uploaded": "Logo uploaded successfully",

    // Brand Data Settings
    "settings.brand_data.brand_name": "Brand Name",
    "settings.brand_data.brand_name_placeholder": "Enter your brand name",
    "settings.brand_data.brand_type": "Brand Type",
    "settings.brand_data.brand_type_placeholder": "e.g., Clothing, Electronics, Cosmetics",
    "settings.brand_data.business_category": "Business Category",
    "settings.brand_data.business_category_placeholder": "e.g., Clothing, Electronics, Cosmetics",
    "settings.brand_data.product_categories": "Product Categories",
    "settings.brand_data.product_categories_placeholder": "e.g., Women's Clothing, Electronics, Perfumes",
    "settings.brand_data.website": "Website",
    "settings.brand_data.website_placeholder": "https://example.com",
    "settings.brand_data.commercial_reg": "Commercial Registration Number",
    "settings.brand_data.commercial_reg_placeholder": "Enter commercial registration number",
    "settings.brand_data.freelance_document_number": "Freelance Document Number",
    "settings.brand_data.freelance_document_placeholder": "Enter freelance document number",
    "settings.brand_data.no_commercial_reg": "No commercial registration (Freelance)",
    "settings.brand_data.brand_description": "Brand Description",
    "settings.brand_data.brand_description_placeholder": "Write a brief description about your brand and products",
    "settings.brand_data.upload_hint": "File size up to 5MB\nJPG, PNG",
    "settings.brand_data.choose_file": "Choose File",
    "settings.brand_data.upload_commercial_registration": "Upload Commercial Registration Document",
    "settings.brand_data.upload_freelance_document": "Upload Freelance Document",
    "settings.brand_data.commercial_register_document": "Commercial Registration Document",
    "settings.brand_data.freelance_document": "Freelance Document",
    "settings.brand_data.document_upload_hint": "PDF, PNG, JPG, JPEG (Max 10MB)",
    "settings.brand_data.choose_document": "Choose Document",
    "settings.brand_data.invalid_document_type": "Please upload an image or PDF file only",
    "settings.brand_data.document_too_large": "File size is too large. Maximum is 10MB",
    "settings.brand_data.commercial_registration_uploaded": "Commercial registration uploaded successfully",
    "settings.brand_data.freelance_document_uploaded": "Freelance document uploaded successfully",
    "settings.brand_data.document_upload_error": "Error uploading document",
    "settings.brand_data.validation_error": "Validation Error",
    "settings.brand_data.fill_required_fields": "Please fill all required fields",
    "settings.brand_data.document_required": "Please upload your Commercial Registration or Freelance Document",
    "settings.brand_data.success": "Saved Successfully",
    "settings.brand_data.success_message": "Brand data saved successfully",
    "settings.brand_data.error": "Error",
    "settings.brand_data.error_message": "Error saving data",
    "settings.brand_data.saving": "Saving...",
    "settings.brand_data.save_changes": "Save Changes",
    "settings.brand_data.logo_uploaded": "Logo uploaded successfully",
    "settings.brand_data.document_uploaded": "Document Uploaded",
    "settings.brand_data.document_ready": "Document ready for review",
    "settings.brand_data.document_uploaded_success": "Document uploaded successfully",
    "settings.brand_data.file_too_large": "File too large. Maximum size is 10MB",
    "settings.brand_data.document_ready_to_save": "Document selected. Click Save Changes to upload",
    "settings.brand_data.preview_document": "Preview Document",
    "settings.brand_data.remove_document": "Remove Document",
    "settings.brand_data.accepted_formats": "PDF, JPG, PNG, DOC, DOCX - Max 10MB",

    // Branches Settings
    "settings.branches.title": "Branches Management",
    "settings.branches.description": "Manage your store branches",
    "settings.branches.coming_soon": "Coming Soon - Branches management will be added",
    "settings.branches.empty_title": "No branches yet",
    "settings.branches.empty_description": "Add branches to your store to expand your business and manage multiple locations",
    "settings.branches.add_branch": "Add Branch",

    // Financial Settings
    "settings.financial.title": "Financial Settings",
    "settings.financial.description": "Manage bank accounts and payments",
    "settings.financial.coming_soon": "Coming Soon - Financial settings will be added",

    // Notifications Settings
    "settings.notifications.title": "Notification Settings",
    "settings.notifications.description": "Control the notifications you receive",
    "settings.notifications.new_rentals": "New Rental Requests",
    "settings.notifications.new_rentals_desc": "Get notified when a new rental request arrives",
    "settings.notifications.sales_updates": "Sales Updates",
    "settings.notifications.sales_updates_desc": "Notifications about daily sales and revenue",
    "settings.notifications.customer_messages": "Customer Messages",
    "settings.notifications.customer_messages_desc": "Notifications when messages arrive from customers",
    "settings.notifications.weekly_reports": "Weekly Reports",
    "settings.notifications.weekly_reports_desc": "Receive a weekly report about your store performance",
    "settings.notifications.save_changes": "Save Notification Settings",

    // Password Settings
    "settings.password.title": "Security & Password",
    "settings.password.description": "Manage your account security",
    "settings.password.current_password": "Current Password",
    "settings.password.new_password": "New Password",
    "settings.password.confirm_password": "Confirm New Password",
    "settings.password.two_factor": "Two-Factor Authentication",
    "settings.password.enable_two_factor": "Enable Two-Factor Authentication",
    "settings.password.two_factor_desc": "Add an extra layer of protection to your account",
    "settings.password.save_changes": "Save Security Settings",

    // Shelves Page
    "shelves.title": "Shelf Management",
    "shelves.description": "Confirm spaces displayed in your branches",
    "shelves.statistics_title": "Your Statistics",
    "shelves.statistics_description": "Track the status of each shelf in your branches, and start renting available spaces to easily increase your income",
    "shelves.available": "Available Shelves",
    "shelves.rented": "Rented Shelves",
    "shelves.maintenance": "Maintenance",

    // Rental Management
    "rental.renew_rental": "Renew Rental",
    "rental.renew_description": "Extend your rental period",
    "rental.current_end_date": "Current End Date",
    "rental.additional_months": "Additional Months",
    "rental.new_end_date": "New End Date",
    "rental.monthly_price": "Monthly Price",
    "rental.duration": "Duration",
    "rental.total_price": "Total Price",
    "rental.request_renewal": "Request Renewal",
    "rental.renewal_requested": "Renewal Requested",
    "rental.renewal_requested_desc": "The store owner will be notified of your renewal request",
    "rental.renewal_failed": "Failed to request renewal",
    "rental.ending_soon": "Rental Ending Soon",
    "rental.days_remaining": "{days} days remaining",
    "rental.completed": "Rental Completed",
    "rental.rate_experience": "Rate Your Experience",

    // Review System
    "review.rate_experience": "Rate Your Experience",
    "review.rate_experience_with": "Rate your experience with",
    "review.rating": "Rating",
    "review.excellent": "Excellent",
    "review.good": "Good",
    "review.average": "Average",
    "review.poor": "Poor",
    "review.terrible": "Terrible",
    "review.submit": "Submit Review",
    "review.submitted": "Review Submitted",
    "review.thank_you": "Thank you for your review",
    "review.select_rating": "Select a rating",
    "review.rating_required": "Please select a rating before submitting",
    "review.submit_failed": "Failed to submit review",
    "review.already_reviewed": "You have already reviewed this rental",

    // Landing Page
    "hero.title": "Shibr connects",
    "hero.highlight": "points of sale with brands",
    "hero.description":
      "We help you expand, reach customers, and increase profits for your online store or physical shop simply with less effort and cost, by displaying your products in available spaces at Shibr partners without opening any branch.",
    "hero.start_now": "Start Your Experience",
    "hero.go_to_dashboard": "Go to Dashboard",
    "hero.verify_email_now": "Verify Your Email Now",
    "hero.learn_more": "Learn More",

    // Features
    "features.title": "Our Features",
    "features.subtitle": "Discover how Shibr helps you achieve your business goals",
    "features.clear_rights.title": "Clear Rights",
    "features.clear_rights.description": "Each product is linked to a unique QR code, ensuring accurate tracking of every purchase and giving each party their rightful commission or revenue.",
    "features.empty_spaces.title": "Profitable Returns",
    "features.empty_spaces.description": "If you have an available shelf, wall, or corner, we help you invest it and make profit from it easily",
    "features.real_reach.title": "Guaranteed Reach",
    "features.real_reach.description": "For online store owners, you can place your products in different neighborhoods and cities without opening a branch or hiring anyone.",
    "features.flexible_rental.title": "Flexible Understanding",
    "features.flexible_rental.description": "Discuss any partnership terms through instant chat.",

    // FAQ
    "faq.title": "Your Important Questions",
    "faq.subtitle": "Answers to the most common questions about Shibr platform",
    "faq.q1": "How does the Shibr platform work?",
    "faq.a1": "Shibr is a digital platform that connects points of sale with brands to display their products. The point of sale shares space, and the brand invests in it.",
    "faq.q2": "Can I invest in more than one space at the same time?",
    "faq.a2": "Definitely! You can invest in multiple points of sale and in more than one area to expand your presence and increase your profit.",
    "faq.q3": "Can I change the terms?",
    "faq.a3": "Yes, you can modify details or prices in the conversation between parties, before the other party confirms the request.",
    "faq.q4": "Can I rent more than one shelf at the same time?",
    "faq.a4": "Definitely! You can rent multiple shelves in more than one store to expand your presence and increase your sales.",
    "faq.q5": "Does the platform provide customer service?",
    "faq.a5": "Yes, the Shibr team is always available to support you and answer any inquiries through official channels.",

    // Footer
    "footer.contact": "Contact Us",
    "footer.phone": "+966 53 641 2311",
    "footer.email": "info@shibr.io",
    "footer.address": "Riyadh, Saudi Arabia",
    "footer.rights": "All rights reserved",

    // شبر Section
    "shibr.title": "Between expansion and increasing profits…",
    "shibr.highlight": "Shibr",
    "shibr.subtitle": "",
    "shibr.description": "Share space in your store or display your products in different points of sale through easy... fast... and profitable steps",
    "shibr.service_stores": "Store Owner",
    "shibr.commercial_centers": "Brand Owner",
    "shibr.smart_service": "Step One",
    "shibr.smart_service_desc": "Create your account and add your available shelves or corners",
    "shibr.fast_service": "Step Two",
    "shibr.fast_service_desc": "Set rental method: fixed monthly, percentage of sales, or mixed",
    "shibr.integrated_service": "Step Three",
    "shibr.integrated_service_desc": "Receive orders and start earning",

    // Commercial Centers
    "shibr.centers.premium_locations": "Step One",
    "shibr.centers.premium_locations_desc": "Browse stores and shelves by city and location",
    "shibr.centers.high_traffic": "Step Two",
    "shibr.centers.high_traffic_desc": "Book the space that suits you",
    "shibr.centers.targeted_audience": "Step Three",
    "shibr.centers.targeted_audience_desc": "Link your products with QR code and track your orders",

    // Video Section
    "video.title": "For Brand Owners Check available spaces…",
    "video.highlight": "and book your place and point of sale that suits you",
    "video.description":
      "Because details matter, know every detail about your next project space, determine the right place for your products and ensure real presence and tangible existence.",
    "video.start_journey": "Browse Available Spaces",
    "video.jeddah_stores": "Jeddah - Available store locations",
    "video.riyadh_stores": "Riyadh - Available store locations",

    // Stores Section
    "stores.title": "For Store Owners Benefit from every space you have... Share its details with us and expand your income",
    "stores.description": "Because every inch is an opportunity, invest your available space and share it as points of sale, tell us about your place and provide us with its information and earn additional profit with ease.",

    // Why Choose Section
    "why_choose.title": "Why choose Shibr?",
    "why_choose.subtitle": "Every inch you expand makes a difference..",
    "why_choose.description": "A platform that brings together points of sale and brands.. Whether you're a store owner looking to increase your income, or an online store wanting to expand your reach, Shibr platform is designed for you, providing you with a smooth.. flexible.. experience that preserves your rights from the first inch to the first sale.",

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
    "faq.highlight": "and our answers to them",
    "faq.description":
      "Questions that come to mind, and you want to know the answers… Here we support you with comprehensive answers… And if you want more.. you can contact us directly.",

    // Footer
    "footer.company": "Important Links",
    "footer.dashboard": "Dashboard",
    "footer.available_stores": "Available Stores",
    "footer.customer_service": "Discover",
    "footer.home": "Home",
    "footer.contact_us": "Contact Us",
    "footer.why_us": "Why Us",
    "footer.follow_us": "Follow Us",
    "footer.description":
      "Shibr is a technology platform that connects online stores and physical retail shops through displaying and renting dedicated shelf spaces inside stores, aiming to transform unused spaces into instant sales points.",
    "footer.social.twitter": "Twitter",
    "footer.social.linkedin": "LinkedIn",

    // Auth
    "auth.signin": "Sign In",
    "auth.signup": "Create New Account",
    "auth.welcome":
      "Welcome! Sign in to access your dashboard and manage your activity easily, whether you are a store owner or an online store.",
    "auth.welcome_back": "Sign In",
    "auth.signin_description": "Welcome! Sign in to access your dashboard and manage your activity easily, whether you're a store owner or an online shop",
    "auth.dont_have_account": "Don't have an account?",
    "auth.mobile": "Mobile Number",
    "auth.password": "Password",
    "auth.password_placeholder": "Please enter your password",
    "auth.remember_me": "Remember me",
    "auth.forgot_password": "Forgot password?",
    "auth.recover_here": "Recover here",
    "auth.ready_to_join": "Ready to join us?",
    "auth.already_have_account": "Already have an account?",
    "auth.back_to_home": "Back to Home",
    "auth.create_account": "Create Account",
    "auth.signup_description":
      "Choose your account type, register your basic information, and start exploring profit or expansion opportunities through a platform that connects reality with e-commerce.",
    "auth.account_type": "Choose Account Type",
    "auth.brand_owner": "Online Store Owner",
    "auth.store_owner": "Store Owner",
    "auth.im_store_owner": "Store Owner",
    "auth.im_brand_owner": "Brand Owner",
    "auth.store_owner_description": "I own a physical store and want to share available space",
    "auth.brand_owner_description": "I own an online store and want to invest my products in local space",
    "auth.select_account_type": "Share Space or Invest in It",
    "auth.select_account_type_description": "Tell us more about your project... so we know how to serve you, do you have a point of sale? Or a brand?",
    "auth.i_have_store": "Point of Sale",
    "auth.i_am_merchant": "Brand",
    "auth.store_benefit_1": "Benefit from spaces by displaying distinctive products",
    "auth.store_benefit_2": "Generate profits from available spaces",
    "auth.store_benefit_3": "Clear and easy management of all operations",
    "auth.brand_benefit_1": "Display your products in physical stores",
    "auth.brand_benefit_2": "Reach new customers in different areas",
    "auth.brand_benefit_3": "Track your products performance in all spaces",
    "auth.continue": "Continue",
    "auth.continue_as_store_owner": "Continue as Physical Store",
    "auth.continue_as_brand_owner": "Continue as Brand",
    "auth.registering_as": "You are registering as",
    "auth.change_account_type": "Change account type",
    "auth.full_name": "Full Name",
    "auth.full_name_placeholder": "Enter your full name",
    "auth.phone_number": "Phone Number",
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
    "auth.agree_to": "I agree to the",
    "auth.terms_and_conditions": "Terms and Conditions",
    "auth.privacy": "Privacy Policy",
    "auth.platform_terms": "of Shibr platform",
    "auth.error": "Error",
    "auth.email_required": "Email is required",
    "auth.password_required": "Password is required",
    "auth.fill_required_fields": "Please fill in all required fields",
    "auth.success": "Success",
    "auth.must_agree_terms": "You must agree to the terms and conditions",
    "auth.account_created_successfully": "Account created successfully",
    "auth.account_created": "Account created successfully",
    "auth.signup_failed": "Failed to create account. Please try again",
    "auth.email_otp_failed": "Failed to send email verification code",
    "auth.phone_otp_failed": "Failed to send WhatsApp verification code",
    "auth.signin_success": "Signed in successfully",
    "auth.invalid_credentials": "Invalid email or password",
    "auth.account_already_exists": "Account already exists. Please sign in",
    "auth.email_already_exists": "This email is already in use",
    "auth.phone_already_exists": "This phone number is already in use",
    "auth.email_not_found": "Email not registered",
    "auth.incorrect_password": "Incorrect password",
    "auth.invalid_email": "Invalid email address",
    "auth.weak_password": "Password is too weak",
    "auth.signup_timeout": "Account creation timed out. Please try again",
    "auth.profile_creation_timeout": "Profile creation timed out",
    "auth.user_not_found": "User not found",
    "auth.invalid_password": "Invalid password",
    "auth.network_error": "Network error. Please check your connection",
    "auth.email_not_verified": "Please verify your email",
    "auth.rate_limit_exceeded": "Too many attempts. Please try again later",
    "auth.not_authenticated": "Please sign in to continue",
    "auth.session_expired": "Your session has expired. Please sign in again",
    "auth.profile_already_exists": "Profile already exists",
    "auth.profile_not_found": "Profile not found",
    "auth.unknown_error": "An unexpected error occurred",
    "auth.creating_account": "Creating Account",
    "auth.please_wait": "Please wait",

    // Password Reset
    "auth.forgot_password_description": "Enter your email and we'll send you a password reset link",
    "auth.send_reset_link": "Send Reset Link",
    "auth.back_to_signin": "Back to Sign In",
    "auth.check_your_email": "Check Your Email",
    "auth.password_reset_link_sent": "A password reset link has been sent to your email",
    "auth.password_reset_email_sent": "If the email is registered, you'll receive a reset link within minutes",
    "auth.didnt_receive_email": "Didn't receive the email?",
    "auth.try_another_email": "Try Another Email",
    "auth.email_sent": "Email Sent",
    "auth.something_went_wrong": "Something went wrong. Please try again",
    "auth.reset_password": "Reset Password",
    "auth.reset_password_description": "Enter your new password for your account",
    "auth.enter_code_and_new_password": "Enter verification code and new password",
    "auth.code_sent_to": "Code sent to",
    "auth.verification_code": "Verification Code",
    "auth.enter_6_digit_code": "Enter 6-digit verification code",
    "auth.code_required": "Verification code is required",
    "auth.new_password": "New Password",
    "auth.new_password_placeholder": "Enter your new password",
    "auth.confirm_password": "Confirm Password",
    "auth.confirm_password_placeholder": "Re-enter your new password",
    "auth.password_reset_success": "Password reset successfully",
    "auth.password_reset_success_description": "You can now sign in with your new password",
    "auth.password_reset_failed": "Password reset failed. Please try again",
    "auth.redirecting_to_signin": "Redirecting to sign in",
    "auth.redirecting_to_dashboard": "Redirecting to dashboard",
    "auth.invalid_verification_code": "Invalid verification code",
    "auth.code_expired": "Verification code expired",
    "auth.invalid_reset_link": "Invalid reset link",
    "auth.invalid_or_expired_token": "Invalid or expired reset link",
    "auth.verifying_token": "Verifying link...",

    // Email Verification
    "verification.title": "Email Verification",
    "verification.verify_email": "Verify Email",
    "verification.email_verified": "Email Verified",
    "verification.enter_code": "Enter the 6-digit verification code sent to your email",
    "verification.invalid_code": "Invalid verification code",
    "verification.code_expired": "Verification code has expired",
    "verification.user_not_found": "User not found",
    "verification.success": "Email verified successfully",
    "verification.error": "An error occurred during verification",
    "verification.verifying": "Verifying...",
    "verification.verify": "Verify",
    "verification.didnt_receive": "Didn't receive the code?",
    "verification.sending": "Sending...",
    "verification.resend_in": "Resend in",
    "verification.resend_code": "Resend Code",
    "verification.wait_before_resend": "Please wait before requesting a new code",
    "verification.code_sent": "Verification code sent",
    "verification.codes_sent": "Verification codes sent to email and WhatsApp",
    "verification.verify_account": "Verify Account",
    "verification.enter_both_codes": "Enter the verification codes sent to your email and WhatsApp",
    "verification.email_code": "Email Code",
    "verification.whatsapp_code": "WhatsApp Code",
    "verification.resend_email_code": "Resend Email Code",
    "verification.resend_whatsapp_code": "Resend WhatsApp Code",
    "verification.secure_message": "We protect your account with double verification",
    "verification.both_verified": "Email and phone number verified",
    "verification.email_code_sent": "Verification code sent to your email",
    "verification.resend_error": "Failed to resend code",
    "verification.redirecting": "Redirecting to dashboard...",
    "verification.session_expired": "Session expired. Please try again",
    "verification.invalid_session": "Invalid session. Please try again",
    // Phone Verification
    "verification.verify_phone": "Verify Phone Number",
    "verification.phone_verified": "Phone Number Verified",
    "verification.whatsapp_sent_to": "Verification code sent via WhatsApp to",
    "verification.whatsapp_code_sent": "Verification code sent via WhatsApp",
    "verification.enter_phone_code": "Enter the 6-digit verification code",
    "verification.verify_and_continue": "Verify & Continue",
    "verification.phone_secure_message": "We're verifying your phone number to ensure your account security",
    "verification.sending_whatsapp_code": "Sending verification code via WhatsApp...",
    "verification.send_error": "Failed to send verification code",

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
    "orders.completed": "Completed",
    "orders.expired": "Expired",
    "orders.in_transit": "In Transit",
    "orders.received": "Received",
    "orders.store": "Store",
    "orders.branch": "Branch",
    "orders.request_date": "Request Date",
    "orders.status": "Status",
    "orders.rental_duration": "Rental Duration",
    "orders.price": "Price",
    "orders.total_commission": "Total Commission",
    "orders.platform": "Platform",
    "orders.store_notes": "Store Notes",
    "orders.rating": "Rating",
    "orders.options": "Options",
    "orders.view_offer": "View",
    "orders.reject": "Reject",
    "orders.accept": "Accept",
    "orders.offer_details": "View Details",
    "orders.month": "month",
    "orders.months": "months",
    "orders.under_review_badge": "Under Review",
    "orders.rejected_badge": "Rejected",
    "orders.request_details": "Request Details",
    "orders.request_number": "Request Number",
    "orders.city": "City",
    "orders.activity_type": "Activity Type",
    "orders.business_category": "Business Category",
    "orders.renter_name": "Renter Name",
    "orders.mobile_number": "Mobile Number",
    "orders.commercial_register_number": "Commercial Register Number",
    "orders.commercial_register": "Commercial Register",
    "orders.website": "Website",
    "orders.email": "Email",
    "orders.brand_details": "Brand Details",
    "orders.request_details_title": "Request Details",
    "orders.activity": "Activity",
    "orders.rental_type": "Rental Type",
    "orders.rental_date": "Rental Date",
    "orders.notes": "Notes",
    "orders.cafe": "Cafe",
    "orders.new_shelf": "New Shelf",
    "orders.monthly": "Monthly",
    "orders.want_to_rent": "I want to rent",
    "orders.agreement_confirmation": "Please confirm the rental agreement before approval to ensure compliance with all terms",
    "orders.reject_request": "Reject Request",
    "orders.accept_request": "Accept Request",
    "orders.requester": "Requester",
    "orders.thank_you_message": "Thank you for offering the rental request",
    "orders.view_details": "View Details",
    "orders.communication": "Communication",
    "orders.message_brand_description": "Contact the brand owner to discuss request details and agree on terms",
    "orders.start_conversation": "Start Conversation",
    "orders.message_brand_owner": "Message Brand Owner",
    "orders.start_conversation_description": "Start a conversation to discuss request details",
    "orders.conversation_will_be_created": "A new conversation will be created when you send the first message",
    "orders.rate_brand": "Rate Brand",
    "orders.rate_store": "Rate Store",
    "orders.owner_name": "Owner Name",
    "orders.social_media": "Social Media",
    "orders.brand_information": "Brand Information",
    "orders.conversation_closed": "Conversation closed",
    "orders.type_message": "Type a message...",
    "orders.selected_products": "Selected Products",
    "orders.requested_quantity": "Requested Quantity",

    // Table Headers
    "table.store": "Store",
    "table.branch": "Branch",
    "table.rental_duration": "Rental Duration",
    "table.status": "Status",
    "table.order_date": "Order Date",
    "table.value": "Value",
    "table.options": "Options",
    "table.operations_count": "Operations Count",
    "table.rental_price": "Rental Price",
    "table.city": "City",
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
    "brand.dashboard.complete_profile_to_enable": "Please complete your profile data to enable this feature",
    "brand.dashboard.welcome_to_shelfy": "Welcome to Shibr",
    "brand.dashboard.monitor_description": "Monitor your sales, rented shelves, products, and product performance easily from one place",
    "brand.dashboard.rent_new_shelf": "Rent New Shelf",
    "brand.dashboard.displayed_products_count": "Displayed Products Count",
    "brand.dashboard.total_sales": "Total Sales",
    "brand.dashboard.rented_shelves_count": "Current Shelves Count",
    "brand.dashboard.pending_requests": "Total Sales",
    "brand.dashboard.total_requests": "Displayed Products Count",
    "brand.dashboard.increase_from_last_month": "+20.1% from last month",
    "brand.dashboard.from_last_month": "+20.1% from last month",
    "brand.dashboard.sales": "Sales",
    "brand.dashboard.no_sales_data": "No sales data",
    "brand.dashboard.sales_will_appear_here": "Sales will appear here when they occur",
    "brand.dashboard.add_products_first": "Add products first to start selling",
    "brand.dashboard.see_more": "See More",
    "brand.dashboard.no_sales_yet": "You have no sales yet",
    "brand.dashboard.your_rented_shelves": "Your Rented Shelves",
    "brand.dashboard.rented_shelves_tab": "Rented Shelves",
    "brand.dashboard.rented_shelves_description": "Quick overview of stores displaying your products and order counts per shelf",
    "brand.dashboard.no_shelves_currently": "You have no shelves at the moment",
    "brand.dashboard.add_new_shelf": "Add New Shelf",
    "brand.dashboard.latest_sales_operations": "Your Latest Sales Operations",
    "brand.dashboard.sales_operations_tab": "Sales Operations",
    "brand.dashboard.products_tab": "Products",
    "brand.dashboard.sales_operations_description": "Track the latest orders for your products directly from display shelves and monitor your activity in real-time",
    "brand.dashboard.no_sales_operations": "You have no sales operations",
    "brand.dashboard.manage_your_shelves": "Manage your shelves in stores",
    "brand.dashboard.no_shelves_yet": "No shelves yet",
    "brand.dashboard.start_renting_shelves_description": "Start renting shelves in physical stores to display your products and reach new customers",
    "brand.dashboard.rent_your_first_shelf": "Rent your first shelf",
    "brand.dashboard.products_management": "Products Management",
    "brand.dashboard.your_products_on_shelves": "Your products displayed on store shelves",
    "brand.dashboard.manage_products_description": "Manage your products and track their performance on shelves",
    "brand.dashboard.confirm_delete_product": "Are you sure you want to delete this product?",
    "brand.dashboard.import_products_excel": "Import Products from Excel",
    "brand.dashboard.add_new_product": "Add New Product",
    "brand.dashboard.sold_products_count": "Sold Products Count",
    "brand.dashboard.total_products": "Products on Display",
    "brand.dashboard.total_products_count": "Total Products Count",
    "brand.dashboard.orders_count": "Orders Count",
    "brand.dashboard.high_orders": "High Orders",
    "brand.dashboard.medium_orders": "Medium Orders",
    "brand.dashboard.low_orders": "Low Orders",
    "brand.dashboard.all_cities": "All Cities",
    "brand.dashboard.search_products": "Search by product name or city...",
    "brand.dashboard.table.options": "Options",
    "brand.dashboard.table.image": "Image",
    "brand.dashboard.table.product_name": "Product Name",
    "brand.dashboard.table.code": "Code",
    "brand.dashboard.table.price": "Price",
    "brand.dashboard.table.quantity": "Quantity",
    "brand.dashboard.table.sales_count": "Sales Count",
    "brand.dashboard.table.stores_count": "Stores Count",
    "brand.dashboard.table.actions": "Actions",
    "brand.dashboard.manage_shelves_inside_stores": "Manage your shelves inside stores",
    "brand.shelves.stats_overview": "Manage your shelves inside stores",
    "brand.shelves.stats_description": "Track all the spaces you've reserved in physical stores",
    "brand.shelves.total_sales": "Total Sales",
    "brand.shelves.qr_scans": "Total QR Code Scans",
    "brand.shelves.rented_count": "Currently Rented Shelves",
    "brand.dashboard.table.store_name": "Store Name",
    "brand.dashboard.table.city": "City",
    "brand.dashboard.table.operations_count": "Operations Count",
    "brand.dashboard.table.rental_date": "Rental Date",
    "brand.dashboard.table.end_date": "End Date",
    "brand.dashboard.table.rental_status": "Rental Status",
    "brand.dashboard.operation": "operation",
    "brand.dashboard.al_afaq_center": "Al Afaq Center",
    "brand.dashboard.qatr_basket": "Qatr Basket",
    "brand.dashboard.style_box": "Style Box",
    "brand.dashboard.beautify_launch": "Beautify & Launch",
    "brand.dashboard.search_by_store_or_city": "Search by store name or city...",
    "brand.dashboard.operations_count": "Operations Count",
    "brand.dashboard.products_page_description": "Manage your products, track sales performance, and monitor inventory across all store shelves",
    "brand.dashboard.products_statistics_description": "Track your product performance metrics and sales trends",
    "brand.dashboard.products_table_description": "View and manage all your products displayed on store shelves",
    "brand.dashboard.your_products": "Your Products",
    "brand.dashboard.product_image": "Image",
    "brand.dashboard.product_name": "Product Name",
    "brand.dashboard.product_code": "Code",
    "brand.dashboard.price": "Price",
    "brand.dashboard.quantity": "Quantity",
    "brand.dashboard.sales_count": "Sales",
    "brand.dashboard.stores_count": "Stores",
    "brand.dashboard.actions": "Actions",

    // Product Dialog
    "brand.products.add_new_product": "Add New Product",
    "brand.products.edit_product": "Edit Product",
    "brand.products.product_image": "Product Image",
    "brand.products.product_name": "Product Name",
    "brand.products.product_name_placeholder": "e.g., White T-Shirt",
    "brand.products.product_code": "Product Code",
    "brand.products.product_sku": "SKU",
    "brand.products.category": "Category",
    "brand.products.select_category": "Select Category",
    "brand.products.price": "Price",
    "brand.products.cost": "Cost",
    "brand.products.quantity": "Quantity",
    "brand.products.description": "Description (Optional)",
    "brand.products.description_placeholder": "Add a brief and clear description",
    "brand.products.save_product": "Save Product",
    "brand.products.image_hint": "Clear image in JPG or PNG format",
    "brand.no_matching_products": "No matching products",
    "brand.no_products_yet": "No products yet",
    "brand.start_adding_products_description": "Start adding products to display in stores",
    "brand.add_first_product": "Add your first product",

    // Marketplace
    "marketplace.title": "Marketplace",
    "marketplace.description": "Discover and rent shelves in the best physical stores to display your products",
    "marketplace.search_placeholder": "Search for stores or locations...",
    "marketplace.filter_city": "Select City",
    "marketplace.filter_category": "Select Category",
    "marketplace.all_categories": "All Categories",
    "marketplace.all_cities": "All Cities",
    "marketplace.all_types": "All Types",
    "marketplace.category_general": "General Store",
    "marketplace.category_grocery": "Grocery",
    "marketplace.category_fashion": "Fashion",
    "marketplace.category_beauty": "Beauty",
    "marketplace.category_electronics": "Electronics",
    "marketplace.category_sports": "Sports",
    "marketplace.category_home": "Home",
    "marketplace.category_toys": "Toys",
    "marketplace.category_books": "Books",
    "marketplace.category_home_living": "Home & Living",
    "marketplace.category_food_beverages": "Food & Beverages",
    "marketplace.category_kids_baby": "Kids & Baby",
    "marketplace.more_filters": "More Filters",
    "marketplace.showing_results": "Showing {{count}} results",
    "marketplace.sort_by": "Sort by",
    "marketplace.sort_recommended": "Recommended",
    "marketplace.sort_price_low": "Price: Low to High",
    "marketplace.sort_price_high": "Price: High to Low",
    "marketplace.sort_rating": "Rating",
    "marketplace.category": "Category",
    "marketplace.available_shelves": "Available Shelves",
    "marketplace.price_per_month": "Price per Month",
    "marketplace.price_and_commission": "Price & Commission",
    "marketplace.view_on_map": "View on Map",
    "marketplace.your_location": "Your Location",
    "marketplace.location_prompt": "Allow location access to see stores near you and get directions",
    "marketplace.location_permission_denied": "Location permission denied. Please allow location access to see stores near you",
    "marketplace.location_unavailable": "Location information unavailable",
    "marketplace.location_timeout": "Location request timed out",
    "marketplace.location_error": "An error occurred getting your location",
    "marketplace.geolocation_not_supported": "Geolocation is not supported by your browser",
    "marketplace.store_description": "Store Description",
    "marketplace.view_details": "View Details",
    "marketplace.no_results_title": "No stores found",
    "marketplace.no_results_description": "Try changing your search criteria or filters",
    "marketplace.no_stores_found": "No stores found",
    "marketplace.branch_not_found": "Branch not found",
    "marketplace.no_shelves_available": "No shelves available",
    "marketplace.back_to_branches": "Back to Branches",
    "marketplace.available": "Available",
    "marketplace.clear_filters": "Clear Filters",
    "marketplace.available_from": "Available from",
    "marketplace.stores_available": "stores available",
    "marketplace.owner": "Owner",
    "marketplace.store_commission": "Store Commission",
    "marketplace.monthly_rent": "Monthly Rent",
    "marketplace.sales_commission": "Sales Commission",
    "marketplace.shelf_details": "Shelf Details",
    "marketplace.shelf_images": "Shelf Images",
    "marketplace.shelf_size": "Shelf Size",
    "marketplace.shelf_name": "Shelf Name",
    "marketplace.full_address": "Full Address",
    "marketplace.branch": "Branch",
    "marketplace.store_owner": "Store Owner",
    "marketplace.shelf_image": "Shelf Image",
    "marketplace.exterior_image": "Exterior View",
    "marketplace.interior_image": "Interior View",
    "marketplace.map_error": "Error loading map",
    "marketplace.shelf_type": "Shelf Type",
    "marketplace.dimensions": "Dimensions",
    "marketplace.rented_until": "Rented until",
    "marketplace.available": "Available",
    "marketplace.general": "General",
    "marketplace.month": "Month",
    "marketplace.verified": "Verified",
    "marketplace.save": "Save",
    "marketplace.type": "Type",
    "marketplace.area": "Area",
    "marketplace.all_areas": "All Areas",
    "marketplace.north": "North",
    "marketplace.south": "South",
    "marketplace.east": "East",
    "marketplace.west": "West",
    "marketplace.center": "Center",
    "marketplace.price_range": "Price Range",
    "marketplace.min": "Min",
    "marketplace.max": "Max",
    "marketplace.search_stores": "Search Stores",
    "marketplace.select_month": "April",
    "marketplace.all_months": "All Months",
    "marketplace.january": "January",
    "marketplace.february": "February",
    "marketplace.march": "March",
    "marketplace.april": "April",
    "marketplace.may": "May",
    "marketplace.june": "June",
    "marketplace.july": "July",
    "marketplace.august": "August",
    "marketplace.september": "September",
    "marketplace.october": "October",
    "marketplace.november": "November",
    "marketplace.december": "December",
    "marketplace.view_map": "View Map",
    "marketplace.location": "Location",
    "marketplace.use_current_location": "Use current location",
    "marketplace.branches": "Branches",
    "marketplace.branch": "Branch",
    "marketplace.stores": "Stores",
    "marketplace.total_branches": "Total Branches",
    "marketplace.cities_covered": "Cities Covered",
    "marketplace.locations": "Locations",
    "marketplace.view_branches": "View Branches",
    "marketplace.back_to_stores": "Back to Stores",
    "marketplace.back_to_branches": "Back to Branches",
    "marketplace.store_not_found": "Store not found",
    "marketplace.no_branches_found": "No branches found",
    "marketplace.available_shelves": "Available Shelves",
    "marketplace.shelves_count": "{count} shelves available",
    "marketplace.price_from": "From",
    "marketplace.view_shelves": "View Shelves",
    "marketplace.branch_details": "Branch Details",
    "marketplace.all_shelves": "All Shelves",
    "marketplace.product_types": "Product Types",

    // Marketplace Details Page
    "marketplace.details.send_request_title": "Send your rental request",
    "marketplace.details.send_request_description": "Enter your details and specify the booking duration. The request will be sent to the store owner for review and approval within a short time.",
    "marketplace.details.booking_duration": "Required booking duration",
    "marketplace.details.pick_dates": "Pick dates",
    "marketplace.details.product_type": "Product Type",
    "marketplace.details.select_product_type": "Select product type",
    "marketplace.details.product_description": "Description of products you intend to display",
    "marketplace.details.product_description_placeholder": "Example: Natural skincare products - Kids' stationery tools",
    "marketplace.details.product_count": "Approximate number of product pieces",
    "marketplace.details.additional_notes": "Additional notes (optional)",
    "marketplace.details.additional_notes_placeholder": "Example: I need a shelf at clear visibility level",
    "marketplace.details.approval_notice": "Approval is made by the store owner within 48 hours maximum. No amounts are charged until officially activated.",
    "marketplace.details.submit_request": "Submit request for review",
    "marketplace.details.online_status": "online",
    "marketplace.details.type_message": "Type your message",
    "marketplace.details.sample_message1": "Hello, I would like more details about the available shelf. Thank you very much",
    "marketplace.details.sample_message2": "Hello and welcome! 😊 I will send you all available information and additional photos",
    "marketplace.details.sample_message3": "Thank you, I will submit a rental request and wait for its approval",
    "marketplace.details.select_products": "Select Products",
    "marketplace.details.select_products_description": "Choose the products you want to display on this shelf",
    "marketplace.details.choose_products": "Choose Products",
    "marketplace.details.additional_product_details": "Additional Product Details",
    "marketplace.details.selected_products_summary": "Selected Products Summary",
    "marketplace.details.products_selected": "Products Selected",
    "marketplace.details.total_value": "Total Value",
    "marketplace.details.total_items": "Total Items",
    "marketplace.details.communication_title": "Communication",
    "marketplace.details.communication_description": "Communicate with the store owner about the rental request",
    "marketplace.details.price_summary": "Price Summary",
    "marketplace.details.monthly_price": "Monthly Price",
    "marketplace.details.duration": "Duration",
    "marketplace.details.total": "Total",
    "marketplace.details.product_quantity": "Product Quantity",
    "marketplace.details.product_quantity_placeholder": "Enter product quantity",
    "marketplace.details.product_preview": "Product Preview",
    "marketplace.details.type": "Type",
    "marketplace.details.quantity": "Quantity",
    "marketplace.details.description": "Description",

    // Products
    "products.stock": "Stock",
    "products.add_product": "Add Product",
    "product.categories.clothing": "Clothing",
    "product.categories.accessories": "Accessories",
    "product.categories.cosmetics": "Cosmetics",
    "product.categories.electronics": "Electronics",
    "product.categories.food": "Food",
    "product.categories.other": "Other",
    "product.categories.multiple": "Multiple",

    // Brand Shelves Page
    "brand.shelves.page_description": "Track all the spaces you have reserved inside physical stores",
    "brand.shelves.total_qr_scans": "Total QR Scans",
    "brand.shelves.current_shelves_count": "Currently Rented Shelves",
    "brand.shelves.from_last_month": "from last month",
    "brand.shelves.manage_shelves_inside_stores": "Manage Your Shelves Inside Stores",
    "brand.shelves.shelves_management_description": "Track all the spaces you have reserved inside physical stores, add your products, achieve QR codes, and ensure your display is efficient",
    "brand.shelves.add_new_shelf": "Rent New Shelf",
    "brand.shelves.store_name": "Store Name",
    "brand.shelves.city": "City",
    "brand.shelves.operations_count": "Operations Count",
    "brand.shelves.rental_date": "Rental Date",
    "brand.shelves.end_date": "End Date",
    "brand.shelves.rental_status": "Rental Status",
    "brand.shelves.operation": "operation",
    "brand.shelves.increase_from_last_month": "+20.1% from last month",
    "brand.shelves.rented_shelf": "Rented Shelves",
    "brand.shelves.available_shelf": "Available Shelves",
    "brand.shelves.action": "Action",
    "brand.shelves.get_details": "Upcoming Details",
    "brand.shelves.price": "Price",
    "brand.shelves.supplier": "Renter",
    "brand.shelves.status": "Status",
    "brand.shelves.shelf_name": "Shelf Name",
    "brand.shelves.details_modify": "Modify Details",
    "brand.shelves.available_for_rent": "Available for Rent",
    "brand.shelves.rented": "Rented",
    "brand.shelves.shipping_requests": "Shipping Requests",
    "brand.shelves.shipping_requests_description": "Track your shipment details to the store",
    "brand.shelves.cancel_notice": "Orders will be cancelled after 48 hours if not approved",
    "brand.shelves.under_review": "Under Review",
    "brand.shelves.on_the_way": "On The Way",
    "brand.shelves.delivered": "Delivered",
    "brand.shelves.accepted": "Accepted",
    "brand.shelves.rejected": "Rejected",
    "brand.shelves.self_delivery": "Self Delivery",
    "brand.shelves.flight": "Flight",
    "brand.shelves.search_placeholder": "Search by store name or city or...",
    "brand.shelves.options": "Options",
    "brand.shelves.shipping_method": "Shipping Method",
    "brand.shelves.request_date": "Request Date",
    "brand.shelves.quantity_requested": "Quantity Requested",
    "brand.shelves.branch": "Branch",
    "brand.shelves.store": "Store",

    // Notifications
    "notifications.title": "Notifications",
    "notifications.mark_all_read": "Mark all read",
    "notifications.no_notifications": "No notifications",
    "notifications.new_notifications": "new notifications",
    "notifications.notifications": "Notifications",
    "notifications.no_new": "No new",

    // Status/State Values - Additional
    "status.pending": "Pending",
    "status.payment_pending": "Payment Required",
    "status.payment_processing": "Verifying Payment",
    "status.completed": "Completed",
    "status.cancelled": "Cancelled",
    "status.expired": "Expired",
    "status.rejected": "Rejected",
    "status.online": "Online",

    // Common Actions
    "actions.accept_rental_request": "Accept Rental Request",
    "actions.reject_rental_request": "Reject Rental Request",

    // Action Buttons
    "action.pay_now": "Pay Now",
    "action.verifying": "Verifying",
    "action.view": "View",
    "action.view_details": "View Details",
    "action.manage": "Manage",
    "action.waiting": "Waiting",

    // Payment Dialog
    "payment.bank_transfer_title": "Bank Transfer",
    "payment.transfer_instructions": "Please transfer the amount to the bank account below",
    "payment.store_name": "Store Name",
    "payment.shelf_name": "Shelf Name",
    "payment.amount_due": "Amount Due",
    "payment.transfer_to": "Transfer To",
    "payment.bank_name": "Bank Name",
    "payment.account_name": "Account Name",
    "payment.iban": "IBAN",
    "payment.iban_copied": "IBAN copied to clipboard",
    "payment.copy_failed": "Failed to copy IBAN",
    "payment.transfer_notice": "Please keep your transfer receipt. The shelf will be activated within 24 hours after payment verification.",
    "payment.confirm_transfer_completed": "Confirm Transfer Completed",
    "payment.confirmation_success_title": "Transfer Confirmed",
    "payment.confirmation_success_description": "Your payment will be verified and the shelf will be activated within 24 hours",
    "payment.confirmation_failed": "Failed to confirm transfer. Please try again.",

    // Time Periods
    "period.daily": "Daily",
    "period.weekly": "Weekly",
    "period.monthly": "Monthly",
    "period.yearly": "Yearly",

    // Time References
    "time.yesterday": "yesterday",
    "time.last_day": "yesterday",
    "time.last_week": "last week",
    "time.last_month": "last month",
    "time.last_year": "last year",
    "time.from": "from",
    "time.daily": "Daily",
    "time.weekly": "Weekly",
    "time.monthly": "Monthly",
    "time.yearly": "Yearly",

    // Chat
    "chat.conversations": "Conversations",
    "chat.chat": "Chat",
    "chat.no_conversations": "No conversations yet",
    "chat.no_messages_yet": "No messages yet",
    "chat.type_message_placeholder": "Type your message...",
    "chat.status.new": "New",
    "chat.request_accepted_message": "Welcome! Your request has been accepted...",
    "chat.shelf_unavailable_message": "Sorry, the shelf is not available...",

    // Brand Dashboard
    "brand.current_shelves_count": "Current Shelves Count",
    "brand.active_shelves": "Active shelves",
    "brand.pending_requests": "Pending Requests",
    "brand.awaiting_approval": "Awaiting approval",
    "brand.total_requests": "Total Requests",
    "brand.all_requests": "All requests",
    "brand.current_shelves": "Manage Your In-Store Shelves",
    "brand.no_matching_shelves": "No matching shelves",
    "brand.no_shelves_yet": "No shelves yet",
    "brand.rent_first_shelf": "Rent your first shelf",
    "brand.current_shelves_description": "Track all your booked spaces in physical stores, add your products, download QR codes, and ensure your on-ground display is running efficiently.",
    "brand.no_search_results": "No search results",
    "brand.try_different_search": "Try searching with different keywords",
    "brand.start_renting_shelves_description": "Start renting shelves to display your products",
    "brand.rent_your_first_shelf": "Rent Your First Shelf",

    // Additional Table Headers
    "table.store_name": "Store Name",
    "table.sales_count": "Sales Count",
    "table.order_number": "Order Number",
    "table.product_name": "Product Name",
    "table.date": "Date",
    "table.rental_start_date": "Rental Start Date",
    "table.rental_end_date": "Rental End Date",
    "table.product_count": "Product Count",
    "table.rental_date": "Rental Date",
    "table.end_date": "End Date",
    "table.shelf_size": "Shelf Size",
    "table.count": "Count",
    "table.start": "Start",
    "table.end": "End",
    "table.action": "Action",
    "table.actions": "Actions",
    "table.request_date": "Request Date",
    "table.rating": "Rating",
    "table.image": "Image",
    "table.sku": "SKU",
    "table.quantity": "Quantity",

    // Store Dashboard
    "store.your_statistics": "Your Statistics",
    "store.view_details": "View Details",
    "store.incoming_requests": "Incoming Requests from Online Stores",
    "store.no_matching_requests": "No matching requests",
    "store.no_requests_yet": "No rental requests yet",
    "store.requests_will_appear_here": "Requests will appear here when available",
    "store.try_different_search": "Try a different search",
    "store.incoming_requests_description": "Track shelf rental requests from online stores, review each request details, and choose to approve or reject based on the displayed information.",
    "store.cancellation_notice": "Requests will be cancelled after 48 hours if not approved",

    // Common UI
    "ui.add_shelf": "Add Shelf",
    "ui.rent_new_shelf": "Rent New Shelf",
    "ui.add": "Add",
    "ui.complete_data_first": "Please complete your data first",
    "ui.search_placeholder": "Search...",

    // Duration
    "duration.month_singular": "month",
    "duration.months_plural": "months",

    // Pagination
    "pagination.previous": "Previous",
    "pagination.next": "Next",
    "pagination.showing": "Showing {start}-{end} of {total} requests",

    // Forms & Validation
    "form.fill_required_fields": "Please fill all required fields",
    "form.login_first": "Please login first",
    "form.request_updated_success": "Your request has been updated successfully!",
    "form.request_submitted_success": "Your request has been submitted successfully!",
    "form.submit_error": "Failed to submit request",
    "form.chat_unavailable": "Chat Unavailable",
    "form.description_optional": "Description (Optional)",
    "form.description_example": "Example: Next to the door - Right side when entering",
    "form.address": "Address",
    "form.click_map_select_location": "Click on the map to select location",
    "form.add_customer_message": "You can add a message for the customer (optional)",

    // Auth
    "auth.and": "and",

    // Validation messages
    "validation.full_name_required": "Full name is required",
    "validation.full_name_min_length": "Full name must be at least 2 characters",
    "validation.email_required": "Email is required",
    "validation.email_invalid": "Invalid email address",
    "validation.phone_required": "Phone number is required",
    "validation.phone_invalid": "Invalid Saudi phone number",
    "validation.password_required": "Password is required",
    "validation.password_min_8": "Password must be at least 8 characters",
    "validation.terms_required": "You must agree to the terms and conditions",
    "validation.store_name_required": "Store name is required for store owners",
    "validation.brand_name_required": "Brand name is required for brand owners",

    // Orders
    "orders.login_to_view": "Please login to view orders",

    // Search/Filter
    "search.store_or_city_placeholder": "Search by store name or shelf city...",
  },
}

export function LanguageProvider({
  children,
  initialLanguage
}: {
  children: ReactNode
  initialLanguage?: Language
}) {
  const getInitialLanguage = (): Language => {
    if (initialLanguage) return initialLanguage
    if (typeof window !== 'undefined') {
      const htmlLang = document.documentElement.lang
      return (htmlLang === 'en' || htmlLang === 'ar') ? htmlLang as Language : 'ar'
    }
    return 'ar'
  }

  const [language, setLanguageState] = useState<Language>(getInitialLanguage)
  const direction: Direction = language === "ar" ? "rtl" : "ltr"

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem("language", lang)
      document.cookie = `language=${lang};path=/;max-age=31536000;SameSite=Lax`
    }
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }


  useEffect(() => {
    // Only sync if we're on the client and haven't received initialLanguage from server
    if (typeof window === 'undefined') return

    const savedLang = localStorage.getItem('language') as Language

    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      if (savedLang !== language) {
        // Only update if there's a real mismatch (shouldn't happen with proper cookie sync)
        setLanguageState(savedLang)
        document.cookie = `language=${savedLang};path=/;max-age=31536000;SameSite=Lax`
      }
    } else if (!savedLang) {
      // First time - save current language
      localStorage.setItem('language', language)
      document.cookie = `language=${language};path=/;max-age=31536000;SameSite=Lax`
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction

    document.body.classList.remove("font-cairo", "font-inter")
    const fontClass = direction === "rtl" ? "font-cairo" : "font-inter"
    document.body.classList.add(fontClass)

    document.body.classList.remove("dir-rtl", "dir-ltr")
    document.body.classList.add(`dir-${direction}`)

    // Mark as hydrated after first render to enable transitions
    requestAnimationFrame(() => {
      document.documentElement.classList.add('hydrated')
    })
  }, [language, direction])

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
