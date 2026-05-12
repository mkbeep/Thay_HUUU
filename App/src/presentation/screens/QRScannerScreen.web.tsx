/**
 * Web: không dùng màn quét trong trình duyệt — khách quét QR in trên bàn bằng Camera hệ thống
 * (URL có /table/…?tid=…). Stub này chỉ đóng nếu còn nhánh cũ gọi tới.
 */
import { useEffect } from 'react';
import { View } from 'react-native';

interface QRScannerScreenProps {
  onCancel: () => void;
}

export default function QRScannerScreen({ onCancel }: QRScannerScreenProps) {
  useEffect(() => {
    onCancel();
  }, [onCancel]);

  return <View style={{ flex: 1 }} />;
}
