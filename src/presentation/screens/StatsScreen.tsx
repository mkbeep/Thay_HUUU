import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { OrderService } from '../../business/services/OrderService';
import { TableService } from '../../business/services/TableService';

const orderService = new OrderService();
const tableService = new TableService();

interface Stats {
  orders: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  tables: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
  };
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [orderStats, tableStats] = await Promise.all([
        orderService.getOrderStats(),
        tableService.getTableStats(),
      ]);

      setStats({
        orders: orderStats,
        tables: tableStats,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Không thể tải thống kê</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê đơn hàng</Text>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng đơn hàng hoàn thành</Text>
          <Text style={styles.statValue}>{stats.orders.totalOrders}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng doanh thu</Text>
          <Text style={[styles.statValue, styles.revenue]}>
            {stats.orders.totalRevenue.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Giá trị đơn hàng trung bình</Text>
          <Text style={[styles.statValue, styles.revenue]}>
            {stats.orders.averageOrderValue.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê bàn ăn</Text>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng số bàn</Text>
          <Text style={styles.statValue}>{stats.tables.total}</Text>
        </View>

        <View style={styles.tableStatsRow}>
          <View style={[styles.tableStatCard, styles.availableCard]}>
            <Text style={styles.tableStatValue}>{stats.tables.available}</Text>
            <Text style={styles.tableStatLabel}>Trống</Text>
          </View>

          <View style={[styles.tableStatCard, styles.occupiedCard]}>
            <Text style={styles.tableStatValue}>{stats.tables.occupied}</Text>
            <Text style={styles.tableStatLabel}>Đang dùng</Text>
          </View>

          <View style={[styles.tableStatCard, styles.reservedCard]}>
            <Text style={styles.tableStatValue}>{stats.tables.reserved}</Text>
            <Text style={styles.tableStatLabel}>Đã đặt</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tỷ lệ sử dụng</Text>
          <Text style={styles.statValue}>
            {((stats.tables.occupied / stats.tables.total) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  revenue: {
    color: '#FF6B35',
  },
  tableStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableStatCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableCard: {
    backgroundColor: '#4CAF50',
  },
  occupiedCard: {
    backgroundColor: '#F44336',
  },
  reservedCard: {
    backgroundColor: '#FFA726',
  },
  tableStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  tableStatLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});
