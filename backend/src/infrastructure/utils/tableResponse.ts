import { buildTableWebUrl } from './tableWebUrl';

/** URL công khai mở bản web khách (Expo Web) theo bàn — luôn gắn vào API để QR không còn dùng JSON. */
export function attachCustomerMenuUrl<T extends { id: string; table_number: string }>(
  table: T
): T & { customer_menu_url: string } {
  return {
    ...table,
    customer_menu_url: buildTableWebUrl({
      tableId: table.id,
      tableNumber: table.table_number,
    }),
  };
}
