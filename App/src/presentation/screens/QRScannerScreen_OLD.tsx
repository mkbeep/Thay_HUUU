import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTable } from '../context/TableContext';
import { TableRepository } from '../../data/repositories/TableRepository';

interface QRScannerScreenProps {
  onSuccess: (tableNumber: string | number) => void;
  onCancel: () => void;
}

export default function QRScannerScreen({ onSuccess, onCancel }: QRScannerScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false); // Prevent multiple scans
  const { setTableInfo } = useTable();
  const tableRepository = new TableRepository();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Prevent multiple scans
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);

    try {
      console.log('QR Code scanned:', data);
      
      let tableNumber: string;
      let tableId: string | undefined;
      
      // Try to parse as JSON first (new format)
      try {
        const qrData = JSON.parse(data);
        
        if (qrData.type === 'table' && qrData.tableNumber) {
          tableNumber = qrData.tableNumber; // G01, T01, V01, etc.
          tableId = qrData.tableId; // Firebase document ID
          console.log('Parsed JSON QR:', { tableNumber, tableId });
        } else {
          throw new Error('Invalid QR data structure');
        }
      } catch (jsonError) {
        // Fallback to old formats
        if (data.startsWith('restaurant://table/')) {
          // Format: restaurant://table/T01 or restaurant://table/1
          tableNumber = data.replace('restaurant://table/', '');
        } else if (data.startsWith('http')) {
          // Handle URL format: https://restaurant.com/table/T01
          const url = new URL(data);
          const parts = url.pathname.split('/');
          tableNumber = parts[parts.length - 1] || '';
        } else {
          // Assume it's just the table number
          tableNumber = data;
        }
        
        console.log('Parsed simple format:', tableNumber);
      }

      if (!tableNumber) {
        throw new Error('Không thể đọc mã QR. Vui lòng thử lại.');
      }

      // Fetch table info from backend using table number (string)
      const table = await tableRepository.getTableByNumber(tableNumber);
      
      if (!table) {
        throw new Error(`Không tìm thấy bàn ${tableNumber}`);
      }

      console.log('Table found:', table);

      // Save table info to context
      await setTableInfo(table.number, table.id);

      // Success - navigate immediately without alert
      setProcessing(false);
      onSuccess(table.number);
      
    } catch (error) {
      console.error('Error scanning QR code:', error);
      setProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Không thể quét mã QR. Vui lòng thử lại.';
      
      Alert.alert(
        'Lỗi',
        errorMessage,
        [
          {
            text: 'Thử lại',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
          {
            text: 'Hủy',
            onPress: onCancel,
            style: 'cancel',
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Đang yêu cầu quyền truy cập camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Không có quyền truy cập camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Cấp quyền</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
          <Text style={styles.buttonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.instruction}>
            Đưa mã QR vào khung để quét
          </Text>

          {scanned && (
            <View style={styles.processingContainer}>
              <Text style={styles.processingText}>Đang xử lý...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 30,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  processingContainer: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#AD2C00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
