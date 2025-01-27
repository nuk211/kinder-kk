import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedPageProps {
  pageName: string;
  children: React.ReactNode;
}

export default function ProtectedPage({ pageName, children }: ProtectedPageProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check initial lock status
    checkLockStatus();
  }, []);

  const checkLockStatus = async () => {
    try {
      const res = await fetch(`/api/admin/protection/status?page=${pageName}`);
      const data = await res.json();
      setIsLocked(data.isLocked);
    } catch (error) {
      console.error('Failed to check lock status:', error);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pageName, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to unlock page');
        return;
      }

      setIsLocked(false);
      setPassword('');
      setError('');
    } catch (error) {
      setError('Failed to unlock page');
    }
  };

  const handleLock = async () => {
    try {
      await fetch('/api/admin/protection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pageName }),
      });
      setIsLocked(true);
    } catch (error) {
      console.error('Failed to lock page:', error);
    }
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Protected Page</h2>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end p-4">
        <button
          onClick={handleLock}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Lock Page
        </button>
      </div>
      {children}
    </div>
  );
}