import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Table, TableStatus } from '../../domain/models/Table';
import { TableService } from '../../business/services/TableService';

const tableService = new TableService();

export default function TablesScreen() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const allTables = await tableService.getAllTables();
      setTables(allTables);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTablePress = async (table: Table) => {
    if (table.status === TableStatus.OCCUPIED) {
      await tableService.releaseTable(table.id);
    } else if (table.status === TableStatus.AVAILABLE) {
      await tableService.reserveTable(table.id);
    } else {
      await tableService.releaseTable(table.id);
    }
    loadTables();
  };

  const getStatusColor = (status: TableStatus): string => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return '#4CAF50';
      case TableStatus.OCCUPIED:
        return '#F44336';
      case TableStatus.RESERVED:
        return '#FFA726';
      default:
        return '#9E9E9E';
    }
  };

  const renderTable = ({ item }: { item: Table }) => (
    <TouchableOpacity
      style={[styles.tableCard, { borderColor: getStatusColor(item.status) }]}
      onPress={() => handleTablePress(item)}
    >
      <View style={styles.tableHeader}>
        <Text style={styles.tableNumber}>Bàn {item.number}</Text>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
      </View>
      
      <Text style={styles.tableCapacity}>
        Sức chứa: {item.capacity} người
      </Text>
      
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>

      {item.currentOrderId && (
        <Text style={styles.orderId}>Đơn hàng: #{item.currentOrderId}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tables}
        renderItem={renderTable}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </View>
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
  list: {
    padding: 8,
  },
  tableCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    minHeight: 150,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tableCapacity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  orderId: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 8,
    fontWeight: '600',
  },
});
