import React from 'react';

export const CostAnalyticsWidget = () => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Cost Analytics</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Total Savings</p>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Average Cost Reduction</p>
          <p className="text-2xl font-bold">0%</p>
        </div>
      </div>
    </div>
  );
};

export default CostAnalyticsWidget; 