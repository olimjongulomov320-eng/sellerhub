import type {
  OrderStatus,
  OrderSource,
  ProductStatus,
  ListingStatus,
  IntegrationStatus,
  MembershipRole,
  AlertSeverity,
  SyncJobStatus,
  AutomationStatus,
} from '@prisma/client'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтверждён',
  PROCESSING: 'В обработке',
  READY: 'Готов',
  SHIPPED: 'Отправлен',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
  RETURNED: 'Возвращён',
}

export const ORDER_SOURCE_LABEL: Record<OrderSource, string> = {
  OLX: 'OLX',
  MANUAL: 'Вручную',
  WEBSITE: 'Сайт',
  TELEGRAM: 'Telegram',
  OTHER: 'Другое',
}

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: 'Активен',
  DRAFT: 'Черновик',
  ARCHIVED: 'В архиве',
}

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  DRAFT: 'Черновик',
  ACTIVE: 'Активно',
  PAUSED: 'Приостановлено',
  SOLD: 'Продано',
  EXPIRED: 'Истекло',
  ERROR: 'Ошибка',
}

export const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  NOT_CONNECTED: 'Не подключено',
  CONNECTED: 'Подключено',
  ERROR: 'Ошибка',
  DISCONNECTED: 'Отключено',
}

export const MEMBERSHIP_ROLE_LABEL: Record<MembershipRole, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  STAFF: 'Сотрудник',
  VIEWER: 'Наблюдатель',
}

export const ALERT_SEVERITY_LABEL: Record<AlertSeverity, string> = {
  INFO: 'Инфо',
  WARNING: 'Предупреждение',
  CRITICAL: 'Критично',
}

export const SYNC_JOB_STATUS_LABEL: Record<SyncJobStatus, string> = {
  PENDING: 'Ожидание',
  RUNNING: 'Выполняется',
  COMPLETED: 'Завершено',
  PARTIAL: 'Частично',
  FAILED: 'Ошибка',
}

export const AUTOMATION_STATUS_LABEL: Record<AutomationStatus, string> = {
  ACTIVE: 'Активна',
  PAUSED: 'Приостановлена',
  DISABLED: 'Отключена',
}

export const AUTOMATION_TRIGGER_LABEL: Record<string, string> = {
  stock_zero: 'Запас достиг нуля',
  stock_below_minimum: 'Запас ниже минимума',
  listing_not_connected: 'У товара нет объявления на маркетплейсе',
  listing_price_mismatch: 'Цена в объявлении отличается от цены товара',
  sync_failed: 'Синхронизация с маркетплейсом не удалась',
}

export const AUTOMATION_ACTION_LABEL: Record<string, string> = {
  create_alert: 'Создать оповещение',
}
