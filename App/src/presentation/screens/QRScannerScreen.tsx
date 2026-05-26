import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTable } from '../context/TableContext';
import { TableRepository } from '../../data/repositories/TableRepository';
import { buildCustomerTableWebUrl } from '../../utils/customerWebUrl';
import { parseCustomerTableUrl } from '../../utils/parseCustomerTableUrl';

interface QRScannerScreenProps {
  onCancel: () => void;
}

/** QR in cho khách mở bản web (Expo Web) trong trình duyệt — không ép vào Expo Go. */
function isTableMenuWebUrl(data: string): boolean {
  if (!/^https?:\/\//i.test(data)) return false;
  try {
    const url = new URL(data);
    const segs = url.pathname.split('/').filter(Boolean);
    const idx = segs.findIndex((p) => ['table', 't', 'ban'].includes(p.toLowerCase()));
    return idx >= 0 && !!segs[idx + 1];
  } catch {
    return false;
  }
}

/** Nhận số bàn từ URL web thực đơn (QR in trên bàn). */
function parseTableNumberFromUrl(data: string): string | null {
  if (!/^https?:\/\//i.test(data)) return null;
  try {
    const url = new URL(data);
    const fromQuery =
      url.searchParams.get('table') ||
      url.searchParams.get('tableNumber') ||
      url.searchParams.get('n');
    if (fromQuery) {
      return decodeURIComponent(fromQuery.trim()) || null;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => ['table', 't', 'ban'].includes(p.toLowerCase()));
    if (idx >= 0 && parts[idx + 1]) {
      return decodeURIComponent(parts[idx + 1]);
    }
    const last = parts.length ? decodeURIComponent(parts[parts.length - 1]) : '';
    return last && !last.includes('.') ? last : null;
  } catch {
    return null;
  }
}

export default function QRScannerScreen({ onCancel }: QRScannerScreenProps) {
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
      // Only log once at the start
      console.log('🔍 QR Code scanned, processing...');

      if (isTableMenuWebUrl(data)) {
        try {
          const parsed = parseCustomerTableUrl(data);
          let table =
            parsed.tableId != null && parsed.tableId.length > 0
              ? await tableRepository.getTableById(parsed.tableId)
              : undefined;
          if (!table && parsed.tableNumber) {
            table = await tableRepository.getTableByNumber(parsed.tableNumber);
          }
          if (!table) {
            setProcessing(false);
            Alert.alert(
              'Không tìm thấy bàn',
              'Liên kết trên mã QR không khớp với bàn trong hệ thống. Vui lòng quét mã trên bàn hoặc liên hệ nhân viên.',
              [
                { text: 'Thử lại', onPress: () => { setScanned(false); setProcessing(false); } },
                { text: 'Hủy', onPress: onCancel, style: 'cancel' },
              ]
            );
            return;
          }
          await setTableInfo(table.number, table.id, undefined, parsed.qrToken);
          await Linking.openURL(data);
          setProcessing(false);
          onCancel();
        } catch {
          setProcessing(false);
          Alert.alert('Không mở được liên kết', 'Hãy quét lại hoặc mở liên kết bằng camera điện thoại.', [
            { text: 'Thử lại', onPress: () => { setScanned(false); setProcessing(false); } },
            { text: 'Hủy', onPress: onCancel, style: 'cancel' },
          ]);
        }
        return;
      }
      
      let tableNumber: string = '';
      let tableId: string | undefined;
      let isValidQR = false;
      
      // Try to parse as JSON first (new format)
      try {
        const qrData = JSON.parse(data);
        
        if (qrData.type === 'table' && qrData.tableNumber) {
          tableNumber = qrData.tableNumber; // G01, T01, V01, etc.
          tableId = qrData.tableId; // Firebase document ID
          isValidQR = true;
          console.log('✅ Valid table QR (JSON) → mở bản web:', { tableNumber, tableId });
        } else {
          throw new Error('QR code không đúng định dạng');
        }
      } catch (jsonError) {
        // Fallback to old formats
        if (data.startsWith('restaurant://table/')) {
          // Format: restaurant://table/T01 or restaurant://table/1
          tableNumber = data.replace('restaurant://table/', '');
          isValidQR = true;
        } else if (data.startsWith('http')) {
          const parsed = parseCustomerTableUrl(data);
          if (parsed.tableId) {
            const t = await tableRepository.getTableById(parsed.tableId);
            if (t) {
              tableNumber = String(t.number);
              tableId = t.id;
              isValidQR = true;
            }
          }
          if (!isValidQR && parsed.tableNumber) {
            tableNumber = parsed.tableNumber;
            isValidQR = true;
          }
          if (!isValidQR) {
            const fromWeb = parseTableNumberFromUrl(data);
            if (fromWeb) {
              tableNumber = fromWeb;
              isValidQR = true;
            } else {
              isValidQR = false;
            }
          }
        } else {
          // Check if it looks like a table number
          if (/^[A-Z]\d{2}$/.test(data) || /^\d+$/.test(data)) {
            tableNumber = data;
            isValidQR = true;
          } else {
            isValidQR = false;
          }
        }
        
        if (isValidQR && tableNumber) {
          console.log('✅ Valid simple format:', tableNumber);
        }
      }

      if (!isValidQR || !tableNumber) {
        setProcessing(false);
        Alert.alert(
          '❌ QR Code Không Hợp Lệ',
          'Mã QR này không phải của nhà hàng chúng tôi.\n\nVui lòng quét mã QR trên bàn của bạn.',
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
        return;
      }

      let table =
        tableId != null && tableId.length > 0
          ? await tableRepository.getTableById(tableId)
          : undefined;
      if (!table) {
        table = await tableRepository.getTableByNumber(tableNumber);
      }

      if (!table) {
        setProcessing(false);
        Alert.alert(
          '❌ Không Tìm Thấy Bàn',
          `Bàn "${tableNumber}" không tồn tại trong hệ thống.\n\nVui lòng kiểm tra lại hoặc liên hệ nhân viên.`,
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
        return;
      }

      console.log('🎯 Table found:', table.number, '→ mở bản web');

      const parsedForToken = data.startsWith('http') ? parseCustomerTableUrl(data) : null;
      await setTableInfo(table.number, table.id, undefined, parsedForToken?.qrToken || null);

      try {
        await Linking.openURL(buildCustomerTableWebUrl(table.number, table.id, parsedForToken?.qrToken || null));
      } catch {
        setProcessing(false);
        Alert.alert('Không mở được liên kết', 'Hãy quét lại hoặc mở liên kết bằng camera điện thoại.', [
          { text: 'Thử lại', onPress: () => { setScanned(false); setProcessing(false); } },
          { text: 'Hủy', onPress: onCancel, style: 'cancel' },
        ]);
        return;
      }

      setProcessing(false);
      onCancel();
      
    } catch (error) {
      console.error('Error scanning QR code:', error);
      setProcessing(false);
      
      let errorTitle = '❌ Lỗi Quét Mã';
      let errorMessage = 'Không thể quét mã QR. Vui lòng thử lại.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorTitle = '📡 Lỗi Kết Nối';
          errorMessage = 'Không thể kết nối đến máy chủ.\n\nVui lòng kiểm tra kết nối internet và thử lại.';
        } else if (error.message.includes('timeout')) {
          errorTitle = '⏱️ Hết Thời Gian';
          errorMessage = 'Yêu cầu mất quá nhiều thời gian.\n\nVui lòng thử lại.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        errorTitle,
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
      />
      
      {/* Overlay rendered outside CameraView to avoid warning */}
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none', // Allow camera to receive touch events
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
