/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_analytics from "../admin/analytics.js";
import type * as admin_brands from "../admin/brands.js";
import type * as admin_helpers from "../admin/helpers.js";
import type * as admin_index from "../admin/index.js";
import type * as admin_payments from "../admin/payments.js";
import type * as admin_platform from "../admin/platform.js";
import type * as admin_products from "../admin/products.js";
import type * as admin_rentals from "../admin/rentals.js";
import type * as admin_settings from "../admin/settings.js";
import type * as admin_stores from "../admin/stores.js";
import type * as auth from "../auth.js";
import type * as authPasswordReset from "../authPasswordReset.js";
import type * as bankAccounts from "../bankAccounts.js";
import type * as branches from "../branches.js";
import type * as chats from "../chats.js";
import type * as contactForm from "../contactForm.js";
import type * as crons from "../crons.js";
import type * as customerOrders from "../customerOrders.js";
import type * as debugAdmin from "../debugAdmin.js";
import type * as emailVerification from "../emailVerification.js";
import type * as files from "../files.js";
import type * as forceAdminSeed from "../forceAdminSeed.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as logger from "../logger.js";
import type * as payments from "../payments.js";
import type * as phoneVerification from "../phoneVerification.js";
import type * as platformSettings from "../platformSettings.js";
import type * as products from "../products.js";
import type * as profileHelpers from "../profileHelpers.js";
import type * as rentalManagement from "../rentalManagement.js";
import type * as rentalRequests from "../rentalRequests.js";
import type * as resetDatabase from "../resetDatabase.js";
import type * as reviews from "../reviews.js";
import type * as security_rateLimiter from "../security/rateLimiter.js";
import type * as security_webhookValidator from "../security/webhookValidator.js";
import type * as seed from "../seed.js";
import type * as seedInitialAdmin from "../seedInitialAdmin.js";
import type * as shelves from "../shelves.js";
import type * as stores from "../stores.js";
import type * as tapPayments from "../tapPayments.js";
import type * as tapTransfers from "../tapTransfers.js";
import type * as taxUtils from "../taxUtils.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as whatsappInvoice from "../whatsappInvoice.js";
import type * as whatsappNotifications from "../whatsappNotifications.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "admin/analytics": typeof admin_analytics;
  "admin/brands": typeof admin_brands;
  "admin/helpers": typeof admin_helpers;
  "admin/index": typeof admin_index;
  "admin/payments": typeof admin_payments;
  "admin/platform": typeof admin_platform;
  "admin/products": typeof admin_products;
  "admin/rentals": typeof admin_rentals;
  "admin/settings": typeof admin_settings;
  "admin/stores": typeof admin_stores;
  auth: typeof auth;
  authPasswordReset: typeof authPasswordReset;
  bankAccounts: typeof bankAccounts;
  branches: typeof branches;
  chats: typeof chats;
  contactForm: typeof contactForm;
  crons: typeof crons;
  customerOrders: typeof customerOrders;
  debugAdmin: typeof debugAdmin;
  emailVerification: typeof emailVerification;
  files: typeof files;
  forceAdminSeed: typeof forceAdminSeed;
  helpers: typeof helpers;
  http: typeof http;
  logger: typeof logger;
  payments: typeof payments;
  phoneVerification: typeof phoneVerification;
  platformSettings: typeof platformSettings;
  products: typeof products;
  profileHelpers: typeof profileHelpers;
  rentalManagement: typeof rentalManagement;
  rentalRequests: typeof rentalRequests;
  resetDatabase: typeof resetDatabase;
  reviews: typeof reviews;
  "security/rateLimiter": typeof security_rateLimiter;
  "security/webhookValidator": typeof security_webhookValidator;
  seed: typeof seed;
  seedInitialAdmin: typeof seedInitialAdmin;
  shelves: typeof shelves;
  stores: typeof stores;
  tapPayments: typeof tapPayments;
  tapTransfers: typeof tapTransfers;
  taxUtils: typeof taxUtils;
  users: typeof users;
  utils: typeof utils;
  whatsappInvoice: typeof whatsappInvoice;
  whatsappNotifications: typeof whatsappNotifications;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
