'use client';

import { useState } from 'react';
import { AuthType } from '@/services/crawler/types';

interface CrawlerConfig {
  id: string;
  name: string;
  supplier: {
    id: string;
    name: string;
  };
  authType: AuthType;
  startUrl: string;
  selectors: {
    product: string;
    name: string;
    price: string;
    description: string;
    image: string;
  };
  createdAt: Date;
  lastUsed: Date;
}

export default function CrawlerConfigurationWidget() {
  const [configs, setConfigs] = useState<CrawlerConfig[]>([]);
  const [isNewConfigModalOpen, setIsNewConfigModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<CrawlerConfig | null>(null);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Crawler Configurations
        </h2>
        <button
          onClick={() => setIsNewConfigModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          New Configuration
        </button>
      </div>

      {/* Configuration List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Auth Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {configs.map((config) => (
              <tr key={config.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {config.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {config.supplier.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {config.authType}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {config.lastUsed.toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedConfig(config)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {/* Handle delete */}}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Configuration Modal */}
      {(isNewConfigModalOpen || selectedConfig) && (
        <ConfigurationModal
          config={selectedConfig}
          onClose={() => {
            setIsNewConfigModalOpen(false);
            setSelectedConfig(null);
          }}
          onSave={(config) => {/* Handle save */}}
        />
      )}
    </div>
  );
}

interface ConfigurationModalProps {
  config: CrawlerConfig | null;
  onClose: () => void;
  onSave: (config: Partial<CrawlerConfig>) => void;
}

function ConfigurationModal({
  config,
  onClose,
  onSave
}: ConfigurationModalProps) {
  const [formData, setFormData] = useState<Partial<CrawlerConfig>>(
    config || {
      name: '',
      supplier: { id: '', name: '' },
      authType: AuthType.NONE,
      startUrl: '',
      selectors: {
        product: '',
        name: '',
        price: '',
        description: '',
        image: ''
      }
    }
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {config ? 'Edit Configuration' : 'New Configuration'}
        </h2>
        
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Configuration Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supplier
            </label>
            <select
              value={formData.supplier?.id}
              onChange={(e) => {/* Handle supplier selection */}}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a supplier</option>
              {/* Add supplier options */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Authentication Type
            </label>
            <select
              value={formData.authType}
              onChange={(e) => setFormData({
                ...formData,
                authType: e.target.value as AuthType
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.values(AuthType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start URL
            </label>
            <input
              type="url"
              value={formData.startUrl}
              onChange={(e) => setFormData({
                ...formData,
                startUrl: e.target.value
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              CSS Selectors
            </h3>
            {Object.entries(formData.selectors || {}).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700">
                  {key.charAt(0).toUpperCase() + key.slice(1)} Selector
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setFormData({
                    ...formData,
                    selectors: {
                      ...formData.selectors,
                      [key]: e.target.value
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 