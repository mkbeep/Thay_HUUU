# Reports API

`GET /api/v1/reports/analytics?period=today|week|month|custom&from=&to=`

## Assumptions

- **Revenue**: `sum(quantity * unit_price)` on order line items in the filtered period.
- **Valid orders**: `status !== 'cancelled'`.
- **Items**: Embedded `items[]` on `orders` (preferred); otherwise `order_item` subcollection.
- **Timezone**: Server local time for preset ranges (today / week / month).
- **Growth**: Compared to previous day/week/month; omitted for `custom`.
