import { TableWithSession, TableSessionWithStats } from '../../domain/entities/Table';
import { OrderRepository } from '../database/repositories/OrderRepository';

function sessionStartedMs(startedAt: unknown): number {
  if (!startedAt) return Date.now();
  if (startedAt instanceof Date) return startedAt.getTime();
  if (typeof startedAt === 'object' && startedAt !== null && '_seconds' in (startedAt as object)) {
    return (startedAt as { _seconds: number })._seconds * 1000;
  }
  return new Date(startedAt as string).getTime();
}

export async function enrichTablesWithSessionStats(
  tables: TableWithSession[]
): Promise<TableWithSession[]> {
  const orderRepo = new OrderRepository();

  return Promise.all(
    tables.map(async (table) => {
      const session = table.current_session;
      if (!session?.is_active) return table;

      const [unpaidTotal, pendingKitchen] = await Promise.all([
        orderRepo.getSessionUnpaidTotal(session.id),
        orderRepo.countSessionPendingKitchenItems(session.id),
      ]);

      const minutesUsed = Math.max(
        0,
        Math.floor((Date.now() - sessionStartedMs(session.started_at)) / 60_000)
      );

      const enrichedSession: TableSessionWithStats = {
        ...session,
        session_stats: {
          minutes_used: minutesUsed,
          unpaid_total: unpaidTotal,
          pending_kitchen_items: pendingKitchen,
        },
      };

      return { ...table, current_session: enrichedSession };
    })
  );
}
