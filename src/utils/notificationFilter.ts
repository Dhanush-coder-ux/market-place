import { NotificationItem } from '@/services/api/notification';

/**
 * Detect whether the current environment is production.
 * Checks:
 * 1. localStorage 'override_environment' or 'environment' (allows runtime verification/toggling)
 * 2. Vite environment variables (VITE_APP_ENV, VITE_ENVIRONMENT, VITE_SUBSCRIPTION_ENVIRONMENT)
 * 3. Vite MODE and PROD flags
 */
export const isProductionEnvironment = (): boolean => {
  try {
    const override = localStorage.getItem('override_environment') || localStorage.getItem('environment');
    if (override) {
      const lower = override.trim().toLowerCase();
      if (lower === 'production' || lower === 'prod') return true;
      if (lower === 'development' || lower === 'dev') return false;
    }
  } catch {
    // Ignore storage errors in restrictive environments
  }

  const envVal = (
    import.meta.env.VITE_APP_ENV ||
    import.meta.env.VITE_ENVIRONMENT ||
    import.meta.env.VITE_SUBSCRIPTION_ENVIRONMENT ||
    import.meta.env.MODE ||
    ''
  ).toString().trim().toLowerCase();

  if (envVal === 'production' || envVal === 'prod') {
    return true;
  }

  if (import.meta.env.PROD) {
    return true;
  }

  return false;
};

export const getEnvironmentName = (): 'production' | 'development' => {
  return isProductionEnvironment() ? 'production' : 'development';
};

/**
 * Determines whether a notification is related to the Digital Store.
 * Allowed in production:
 * - Online orders (origin === 'ONLINE', category === 'digital_store', 'online order' in title/message)
 * - Digital store catalog/settings/profile/announcements
 * - Store reviews and digital presence
 */
export const isDigitalStoreNotification = (notif: NotificationItem): boolean => {
  if (!notif) return false;

  // 1. Check additional_metadata fields
  const meta = notif.additional_metadata || {};
  const category = String(meta.category || '').toLowerCase();
  const origin = String(meta.origin || meta.order_origin || '').toUpperCase();
  const channel = String(meta.channel || '').toLowerCase();
  const source = String(meta.source || '').toLowerCase();
  const moduleName = String(meta.module || meta.service || '').toLowerCase();

  if (
    category === 'digital_store' ||
    category === 'digitalstore' ||
    category === 'online_orders' ||
    category === 'online_order' ||
    category === 'online'
  ) {
    return true;
  }

  if (
    origin === 'ONLINE' ||
    origin === 'DIGITAL_STORE' ||
    origin === 'DIGITALSTORE'
  ) {
    return true;
  }

  if (meta.is_online === true || meta.digital_store === true) {
    return true;
  }

  if (
    channel === 'online' ||
    channel === 'digital_store' ||
    channel === 'web'
  ) {
    return true;
  }

  if (
    source === 'digital_store' ||
    source === 'digitalstore' ||
    source === 'online_store'
  ) {
    return true;
  }

  if (
    moduleName === 'digital_store' ||
    moduleName === 'digitalstore' ||
    moduleName === 'online_orders'
  ) {
    return true;
  }

  // 2. Check type and target_type
  const type = String(notif.type || '').toLowerCase();
  const targetType = String(notif.target_type || '').toLowerCase();
  if (
    type.includes('digital_store') ||
    type.includes('digitalstore') ||
    type.includes('online_order')
  ) {
    return true;
  }
  if (
    targetType.includes('digital_store') ||
    targetType.includes('digitalstore')
  ) {
    return true;
  }

  // 3. Check title and message text (case-insensitive)
  const title = String(notif.title || '').toLowerCase();
  const msg = String(notif.message || '').toLowerCase();
  const text = `${title} ${msg}`;

  const digitalKeywords = [
    'digital store',
    'digitalstore',
    'online order',
    'online store',
    'web store',
    'storefront',
    'store profile',
    'store domain',
    'store setting',
    'store visibility',
    'store hours',
    'store vacation',
    'store announcement',
    'customer review',
    'store review',
  ];

  if (digitalKeywords.some((keyword) => text.includes(keyword))) {
    return true;
  }

  return false;
};

/**
 * Filters notifications according to the active environment:
 * - Production: ONLY digital store notifications are allowed.
 * - Development: ALL notifications are allowed.
 */
export const filterNotificationsByEnvironment = (
  notifications: NotificationItem[],
  isProd?: boolean
): NotificationItem[] => {
  const prod = isProd ?? isProductionEnvironment();
  if (!prod) {
    return notifications;
  }
  return notifications.filter(isDigitalStoreNotification);
};
