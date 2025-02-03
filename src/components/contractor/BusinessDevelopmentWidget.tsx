import React from 'react';
import { Card } from '@/components/ui/Card';

export const BusinessDevelopmentWidget = () => {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-grey-darker mb-6">Business Development</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-lighter/10 p-4 rounded-lg">
            <p className="text-sm text-grey-darker mb-1">Active Projects</p>
            <p className="text-2xl font-bold text-blue-darker">0</p>
          </div>
          <div className="bg-osb-light/10 p-4 rounded-lg">
            <p className="text-sm text-grey-darker mb-1">Potential Opportunities</p>
            <p className="text-2xl font-bold text-osb-dark">0</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BusinessDevelopmentWidget; 