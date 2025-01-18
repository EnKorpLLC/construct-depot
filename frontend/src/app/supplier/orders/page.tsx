import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderList } from '@/components/supplier/OrderList';
import { PooledOrderList } from '@/components/supplier/PooledOrderList';

export default function SupplierOrdersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Order Management</h1>
      
      <Tabs defaultValue="regular" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regular">Regular Orders</TabsTrigger>
          <TabsTrigger value="pooled">Pooled Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regular">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Regular Orders</h2>
            <p className="text-gray-600">
              View and manage individual customer orders.
            </p>
            <OrderList type="regular" />
          </div>
        </TabsContent>
        
        <TabsContent value="pooled">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pooled Orders</h2>
            <p className="text-gray-600">
              Manage orders that are being pooled to meet minimum order quantities.
            </p>
            <PooledOrderList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 