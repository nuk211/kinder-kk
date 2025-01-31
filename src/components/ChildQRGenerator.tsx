'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Printer, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const printStyles = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body * {
      visibility: hidden;
    }
    
    #printable-content, #printable-content * {
      visibility: visible;
    }
    
   #printable-content {
  position: fixed;
  left: 0;
  top: 0;
  width: 210mm;
  height: 297mm;
  background: white;
  padding: 5mm; /* Increased padding for better margins */
}

    .print-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 0mm;
      height: 100%;
    }

    .qr-card {
      width: 50mm;
      height: 80mm;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      padding: 0;
    }

    .header {
      width: 100%;
      background-color: #ff6d6d !important;
      color: white;
      padding: 6px 0;
      text-align: center;
      margin-bottom: 15px;
    }

    .header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-grow: 1;
      width: 100%;
    }

    .name {
      font-size: 15px;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .parent-info {
      font-size: 13px;
      color: #666;
      margin-bottom: 15px;
      text-align: center;
    }

    .qr-container {
      margin: 10px 0;
    }
      .qr-container svg {
  width: 100px !important;  /* Reduced QR code size */
  height: 100px !important;
}

    .footer-line {
      width: 100%;
      height: 3px;
      background-color: #ffd666 !important;
      position: absolute;
      bottom: 0;
    }

    .page-break {
      page-break-after: always;
    }
  }
`;

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="w-full">
        <CardHeader>
          <Skeleton className="h-4 w-[150px]" />
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Skeleton className="h-[200px] w-[200px]" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const QRCard = ({ child, language }) => (
    <div className="qr-card">
      <div className="header">
        <h1>Sunway Kindergarten</h1>
      </div>
      
      <div className="content">
        <div className="name">{child.name}</div>
        {child.parent && (
          <div className="parent-info">
            <div style={{ direction: 'rtl' }}>{child.parent.name}</div>
            <div>{child.parent.phoneNumber}</div>
          </div>
        )}
        
        <div className="qr-container">
          <QRCode
            value={child.qrCode}
            size={120}
            level="H"
          />
        </div>
      </div>
  
      <div className="footer-line"></div>
    </div>
  );
  
  
  const ChildQRGenerator = ({ language, translations }) => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [printMode, setPrintMode] = useState(false);
    const [cardsPerPage, setCardsPerPage] = useState(4);

  const fetchChildren = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/children');
      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }
      const data = await response.json();
      setChildren(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

 const handlePrintSelected = () => {
    if (selectedChildren.length === 0) {
      setSelectedChildren(children);
    }
    setPrintMode(true);
    const style = document.createElement('style');
    style.innerHTML = printStyles; // Changed from getGridStyles to printStyles
    document.head.appendChild(style);
    
    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
      setPrintMode(false);
      setSelectedChildren([]);
    }, 100);
  };

  const toggleChildSelection = (child) => {
    setSelectedChildren(prev => {
      const isSelected = prev.some(c => c.id === child.id);
      if (isSelected) {
        return prev.filter(c => c.id !== child.id);
      } else {
        return [...prev, child];
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      PICKUP_REQUESTED: 'bg-yellow-100 text-yellow-800',
      PICKED_UP: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {translations.errorLoadingQRCodes}: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Print view
  if (printMode) {
    const childrenToPrint = selectedChildren.length > 0 ? selectedChildren : children;
    return (
      <div id="printable-content">
        {chunks(childrenToPrint, 4).map((chunk, index) => (
          <div key={index}>
            <div className="print-grid">
              {chunk.map((child) => (
                <QRCard key={child.id} child={child} language={language} />
              ))}
            </div>
            {index < Math.ceil(childrenToPrint.length / 4) - 1 && (
              <div className="page-break" />
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // Main view
  return (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{translations.generateQRCodes}</h2>
        <div className="flex gap-2">
          <Select
            value={cardsPerPage.toString()}
            onValueChange={(value) => setCardsPerPage(Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cards per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 card per page</SelectItem>
              <SelectItem value="2">2 cards per page</SelectItem>
              <SelectItem value="4">4 cards per page</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handlePrintSelected}
            variant="default"
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {selectedChildren.length > 0 
              ? `Print Selected (${selectedChildren.length})`
              : 'Print All'}
          </Button>
          <Button 
            onClick={fetchChildren} 
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {translations.refresh}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <Card 
            key={child.id} 
            className={`w-full cursor-pointer transition-all ${
              selectedChildren.some(c => c.id === child.id)
                ? 'ring-2 ring-purple-500'
                : ''
            }`}
            onClick={() => toggleChildSelection(child)}
          >
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                {child.name}
                <Badge className={getStatusColor(child.status)}>
                  {child.status.replace('_', ' ')}
                </Badge>
              </CardTitle>
              {child.parent && (
                <div className="text-sm text-gray-500">
                  <div>{translations.parent}: {child.parent.name}</div>
                  <div>{translations.contact}: {child.parent.phoneNumber}</div>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative p-4 w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-xl opacity-10" />
                <div className="relative bg-white p-4 rounded-lg border-4 border-purple-200">
                  <QRCode
                    value={child.qrCode}
                    size={200}
                    level="H"
                    style={{
                      height: "auto",
                      maxWidth: "100%",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
              <div className="text-sm text-center text-gray-500">
                QR Code: {child.qrCode}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Utility function to split array into chunks
const chunks = (arr, size) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };
export default ChildQRGenerator;