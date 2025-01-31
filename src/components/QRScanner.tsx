'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (result: string, responseData?: any) => void;  // Modified to accept response data
  onError?: (error: Error) => void;
  qrboxSize?: number;
  fps?: number;
}

interface QrScanError {
  name?: string;
  message: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onError,
  qrboxSize = 250,
  fps = 10,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isScanning = useRef<boolean>(true);
  const isProcessing = useRef<boolean>(false);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (!isScanning.current || isProcessing.current) return;
  
    console.log('Scan detected:', decodedText);
    try {
      isProcessing.current = true;
      isScanning.current = false;
      
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.pause(true);
      }
  
      const response = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: decodedText }),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      console.log('API response:', data);
      // Show browser alert
      window.alert(`Successfully scanned ${data.data.children[0].name}\nStatus: ${data.data.children[0].status}`);
      
      // Pass both the QR code text and the response data to parent
      onScan(decodedText, data);
      
      // Reset scanner immediately after successful processing
      isProcessing.current = false;
      isScanning.current = true;
      
      if (scannerRef.current && !scannerRef.current.isScanning) {
        console.log('Resuming scanner...');
        await scannerRef.current.resume();
      }
  
    } catch (error) {
      console.error('Scan processing failed:', error);
      isProcessing.current = false;
      isScanning.current = true;
      if (scannerRef.current && !scannerRef.current.isScanning) {
        await scannerRef.current.resume();
      }
      alert(error instanceof Error ? error.message : 'Scan failed');
    } finally {
      isProcessing.current = false;
      isScanning.current = true;
      if (scannerRef.current && !scannerRef.current.isScanning) {
        await scannerRef.current.resume();
      }
    }
}, [onScan])

  
  

  const handleScanFailure = useCallback((errorMessage: string | QrScanError) => {
    if (typeof errorMessage === 'object' && errorMessage.name === 'NotFoundException') {
      return;
    }

    console.debug('Scan failed:', errorMessage);

    if (typeof errorMessage === 'object' && errorMessage.name !== 'NotFoundException') {
      onError?.(new Error(errorMessage.message || 'QR scan failed'));
    }
  }, [onError]);

  const initializeScanner = useCallback(() => {
    if (!scannerRef.current && typeof window !== 'undefined') {
      try {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps,
            qrbox: { width: qrboxSize, height: qrboxSize },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            aspectRatio: 1.0,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          false
        );

        scannerRef.current = scanner;
        isScanning.current = true;
        isProcessing.current = false;

        try {
          scanner.render(handleScanSuccess, handleScanFailure);
        } catch (error: unknown) {
          console.error('Failed to render scanner:', error);
          setErrorMessage('Failed to start camera. Please refresh and try again.');
          isScanning.current = false;
        }
      } catch (error: unknown) {
        console.error('Scanner initialization error:', error);
        setErrorMessage('Failed to initialize scanner. Please refresh the page.');
      }
    }
  }, [fps, qrboxSize, handleScanSuccess, handleScanFailure]);

  useEffect(() => {
    const checkAndRequestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      } catch (error: unknown) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
        setErrorMessage(
          error instanceof Error && error.name === 'NotAllowedError'
            ? 'Please grant camera access to scan QR codes.'
            : 'Camera access failed. Please check your device settings.'
        );
      }
    };

    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      checkAndRequestPermission();
    } else {
      setErrorMessage('Your browser doesn\'t support camera access');
    }
  }, []);

  useEffect(() => {
    if (hasPermission === true) {
      initializeScanner();
    }

    return () => {
      isScanning.current = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error: unknown) {
          console.error('Error cleaning up scanner:', error);
        }
        scannerRef.current = null;
      }
    };
  }, [hasPermission, initializeScanner]);

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <div className="text-gray-600">Requesting camera access...</div>
      </div>
    );
  }

  if (hasPermission === false || errorMessage) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {errorMessage || "Camera access denied"}
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div id="qr-reader" className="qr-scanner-container" />
      <style jsx>{`
        .qr-scanner-container {
          width: 100%;
          padding: 10px;
        }
        :global(#qr-reader) {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        :global(#qr-reader video) {
          width: 100% !important;
          border-radius: 8px;
          object-fit: cover;
        }
        :global(#qr-reader__scan_region) {
          background: white;
          border-radius: 8px;
        }
        :global(#qr-reader__dashboard) {
          padding: 10px;
          background: white;
          border-radius: 8px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;