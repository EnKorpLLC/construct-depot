'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { theme } from '@/lib/theme';

interface InventoryItem {
  productId: string;
  productName: string;
  currentStock: number;
  reorderQuantity: number;
  inventoryStatus: string;
}

export function InventoryOverview() {
  const { data: session } = useSession();
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLowStockItems() {
      try {
        const response = await fetch('/api/inventory/reorder-suggestions');
        if (response.ok) {
          const data = await response.json();
          setLowStockItems(data);
        }
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchLowStockItems();
    }
  }, [session]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Inventory Overview</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Low Stock Alerts</h3>
            {lowStockItems.length > 0 ? (
              <ul className="space-y-3">
                {lowStockItems.map((item) => (
                  <li
                    key={item.productId}
                    className="border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          Current Stock: {item.currentStock}
                        </p>
                      </div>
                      <button
                        className="px-3 py-1 text-sm rounded-md text-white"
                        style={{ backgroundColor: theme.colors.orangeDarker }}
                        onClick={() => {/* Handle reorder */}}
                      >
                        Reorder {item.reorderQuantity} units
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No low stock items at the moment.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-1">Total Products</h4>
              <p className="text-2xl font-bold" style={{ color: theme.colors.blueDarker }}>
                {lowStockItems.length}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-1">Need Attention</h4>
              <p className="text-2xl font-bold" style={{ color: theme.colors.orangeDarker }}>
                {lowStockItems.filter(item => item.currentStock === 0).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 