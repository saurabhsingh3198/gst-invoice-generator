import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface UpiQrCodeProps {
  upiId?: string;
  payeeName?: string;
  customQrUrl?: string;
  size?: number;
}

export const UpiQrCode: React.FC<UpiQrCodeProps> = ({
  upiId,
  payeeName,
  customQrUrl,
  size = 62,
}) => {
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  useEffect(() => {
    if (customQrUrl && customQrUrl.trim()) {
      return;
    }

    if (!upiId || !upiId.trim()) {
      setGeneratedUrl('');
      return;
    }

    let isMounted = true;
    const cleanUpi = upiId.trim();
    const cleanName = encodeURIComponent(payeeName?.trim() || 'Payee');
    const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR`;

    QRCode.toDataURL(upiUri, {
      width: Math.max(140, size * 2),
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setGeneratedUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiId, payeeName, customQrUrl, size]);

  const activeUrl = customQrUrl && customQrUrl.trim() ? customQrUrl : generatedUrl;

  if (!activeUrl) return null;

  return (
    <div
      style={{
        display: 'inline-block',
        textAlign: 'center',
        padding: '1px',
      }}
    >
      <img
        src={activeUrl}
        alt="QR Code"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'block',
          margin: '0 auto',
          imageRendering: 'pixelated',
        }}
      />
      <div
        style={{
          fontSize: '7px',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          marginTop: '3px',
          marginBottom: '2px',
          color: '#000000',
          textAlign: 'center',
          lineHeight: '9px',
          fontFamily: 'Arial, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        SCAN TO PAY
      </div>
    </div>
  );
};
