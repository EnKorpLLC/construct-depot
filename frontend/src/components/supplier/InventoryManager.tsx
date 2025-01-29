import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InventoryLog {
  id: string;
  type: string;
  quantity: number;
  reason?: string;
  createdAt: string;
  reference?: string;
  product: {
    name: string;
    unit: string;
  };
}

interface Product {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  inventoryStatus: string;
}

interface InventoryManagerProps {
  product: Product;
  onInventoryUpdate?: () => void;
}

export function InventoryManager({ product, onInventoryUpdate }: InventoryManagerProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [type, setType] = useState<'RESTOCK' | 'ADJUSTMENT'>('RESTOCK');
  const [reason, setReason] = useState<string>('');
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    lowStockThreshold: product.lowStockThreshold,
    reorderPoint: product.reorderPoint,
    reorderQuantity: product.reorderQuantity,
  });

  useEffect(() => {
    fetchInventoryLogs();
  }, [product.id]);

  const fetchInventoryLogs = async () => {
    try {
      const response = await fetch(`/api/supplier/inventory?type=logs&productId=${product.id}`);
      if (!response.ok) throw new Error('Failed to fetch inventory logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching inventory logs:', error);
      setError('Failed to fetch inventory logs');
    }
  };

  const handleUpdateStock = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/supplier/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: type === 'ADJUSTMENT' ? quantity : Math.abs(quantity),
          type,
          reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to update inventory');

      // Reset form
      setQuantity(0);
      setReason('');
      
      // Refresh logs
      fetchInventoryLogs();
      
      // Notify parent
      if (onInventoryUpdate) {
        onInventoryUpdate();
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      setError('Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/supplier/inventory', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          settings,
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      // Notify parent
      if (onInventoryUpdate) {
        onInventoryUpdate();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Stock Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Status</CardTitle>
          <CardDescription>
            Monitor and manage inventory levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Current Stock</div>
              <div className="text-2xl font-bold">{product.currentStock} {product.unit}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Status</div>
              <div className={`text-lg font-semibold ${
                product.inventoryStatus === 'IN_STOCK' ? 'text-green-600' :
                product.inventoryStatus === 'LOW_STOCK' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {product.inventoryStatus.replace('_', ' ')}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Reorder Point</div>
              <div className="text-2xl font-bold">{product.reorderPoint} {product.unit}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Update Stock</CardTitle>
          <CardDescription>
            Add or adjust inventory levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  value={type}
                  onValueChange={(value: 'RESTOCK' | 'ADJUSTMENT') => setType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESTOCK">Restock</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder={`Quantity (${product.unit})`}
              />
            </div>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for update (optional)"
            />
            <Button
              onClick={handleUpdateStock}
              disabled={loading || quantity === 0}
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Settings</CardTitle>
          <CardDescription>
            Configure inventory thresholds and reorder points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold
                </label>
                <Input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    lowStockThreshold: Number(e.target.value)
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Point
                </label>
                <Input
                  type="number"
                  value={settings.reorderPoint}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    reorderPoint: Number(e.target.value)
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Quantity
                </label>
                <Input
                  type="number"
                  value={settings.reorderQuantity}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    reorderQuantity: Number(e.target.value)
                  }))}
                />
              </div>
            </div>
            <Button
              onClick={handleUpdateSettings}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Logs</CardTitle>
          <CardDescription>
            Recent inventory changes and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{log.type}</TableCell>
                  <TableCell>
                    {log.quantity > 0 ? '+' : ''}{log.quantity} {log.product.unit}
                  </TableCell>
                  <TableCell>{log.reason || '-'}</TableCell>
                  <TableCell>{log.reference || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 