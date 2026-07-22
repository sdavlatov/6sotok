/**
 * Теги кеша Next. Вынесены в отдельный модуль без зависимостей: их импортируют
 * и коллекции Payload, и lib/api.ts — общий модуль разрывает цикл
 * api.ts → payload.config → collections/Listings.ts → api.ts.
 */
export const LISTINGS_TAG = 'listings'
