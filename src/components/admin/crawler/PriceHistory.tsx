'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PricePoint {
  timestamp: string;
  price: number;
  source: string;
}

interface Product {
  id: string;
  name: string;
  priceHistory: PricePoint[];
}

export default function PriceHistory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('7d');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchPriceHistory();
    }
  }, [selectedProduct, timeRange]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
      if (data.length > 0) {
        setSelectedProduct(data[0].id);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const fetchPriceHistory = async () => {
    try {
      const response = await fetch(
        `/api/admin/products/${selectedProduct}/price-history?range=${timeRange}`
      );
      if (!response.ok) throw new Error('Failed to fetch price history');
      const data = await response.json();
      
      // Update the selected product's price history
      setProducts(products.map(p => 
        p.id === selectedProduct
          ? { ...p, priceHistory: data }
          : p
      ));
    } catch (error) {
      toast.error('Failed to fetch price history');
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Price History</h2>
          <div className="flex gap-4">
            <Select
              value={selectedProduct}
              onValueChange={setSelectedProduct}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="1y">1 Year</option>
            </Select>
          </div>
        </div>

        {selectedProductData?.priceHistory && (
          <div className="mt-4">
            <LineChart
              width={800}
              height={400}
              data={selectedProductData.priceHistory}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(timestamp) => format(new Date(timestamp), 'MMM d, yyyy')}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Price"
              />
            </LineChart>
          </div>
        )}

        {selectedProductData?.priceHistory && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Price Changes</h3>
            <div className="space-y-2">
              {selectedProductData.priceHistory.map((point, index) => (
                <div
                  key={point.timestamp}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span>{format(new Date(point.timestamp), 'MMM d, yyyy')}</span>
                  <span className="font-medium">${point.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500 capitalize">{point.source}</span>
                  {index > 0 && (
                    <span className={`text-sm ${
                      point.price > selectedProductData.priceHistory[index - 1].price
                        ? 'text-red-500'
                        : point.price < selectedProductData.priceHistory[index - 1].price
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}>
                      {point.price !== selectedProductData.priceHistory[index - 1].price
                        ? `${(((point.price - selectedProductData.priceHistory[index - 1].price) / selectedProductData.priceHistory[index - 1].price) * 100).toFixed(1)}%`
                        : 'No change'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 