'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    
    html, body {
      height: 100%;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    body * {
      visibility: hidden;
    }
    
    #printable-content, #printable-content * {
      visibility: visible;
      overflow: visible;
    }
    
    #printable-content {
      position: fixed;
      left: 0;
      top: -40mm;
      width: 100%;
      height: 100vh;
      padding: 0;
      margin: 0;
      display: flex !important;
      align-items: center;
      justify-content: center;
      background: white;
    }

    .print-wrapper {
      width: 100%;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .no-print {
      display: none !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const EditableText: React.FC<EditableTextProps> = ({ value, onChange, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleDoubleClick = () => setIsEditing(true);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(tempValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onChange(tempValue);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`bg-transparent outline-none border-b-2 border-purple-300 px-2 py-1 text-center w-full ${className}`}
        autoFocus
      />
    );
  }

  return (
    <div onDoubleClick={handleDoubleClick} className={`cursor-text ${className}`}>
      {value}
    </div>
  );
};

interface QRGeneratorProps {
  schoolId: string;
  size?: number;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({
  schoolId,
  size = 500
}) => {
  const [qrValue, setQrValue] = useState<string>('');
  const [headerText, setHeaderText] = useState('Welcome to Sunway Kindergarten!');
  const [subtitleText, setSubtitleText] = useState("Let's make learning fun! ✨");
  const [footerText, setFooterText] = useState('Please Scan Me! 📱');
  const [bottomText, setBottomText] = useState('Have a wonderful day! 🌟');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const simpleCode = `${schoolId}-${today}`;
    setQrValue(simpleCode);
  }, [schoolId]);

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div id="printable-content">
            <div className="print-wrapper">
              {/* Header */}
              <div className="text-center mb-6">
                <EditableText
                  value={headerText}
                  onChange={setHeaderText}
                  className="text-4xl font-bold text-purple-600"
                />
                <EditableText
                  value={subtitleText}
                  onChange={setSubtitleText}
                  className="text-xl text-blue-500 mt-2"
                />
              </div>

              {/* QR Code Container */}
              <div className="relative p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-3xl opacity-10" />
                <div className="relative bg-white p-8 rounded-2xl border-8 border-purple-200">
                  <QRCode
                    size={size}
                    value={qrValue}
                    level="H"
                    style={{
                      height: "auto",
                      maxWidth: "100%",
                      width: "100%",
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6">
                <EditableText
                  value={footerText}
                  onChange={setFooterText}
                  className="text-2xl font-bold text-green-500"
                />
                <EditableText
                  value={bottomText}
                  onChange={setBottomText}
                  className="text-lg text-gray-600 mt-2"
                />
              </div>
            </div>
          </div>

          {/* Print button - hidden during printing */}
          <div className="mt-8 text-center no-print">
            <button
              onClick={handlePrint}
              className="bg-purple-600 text-white text-lg font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              🖨️ Print QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;