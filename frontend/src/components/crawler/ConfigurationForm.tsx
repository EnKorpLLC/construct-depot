import { useState } from 'react';
import { CrawlerConfig, AuthType, ProductSelectors, CrawlerOptions } from '@/types/crawler';
import ScheduleForm from './ScheduleForm';

interface ConfigurationFormProps {
  onSubmit: (config: Partial<CrawlerConfig>) => Promise<void>;
  initialData?: CrawlerConfig;
}

const DEFAULT_SELECTORS: ProductSelectors = {
  listPage: {
    productContainer: '.product-item',
    nextPage: '.pagination .next',
    pagination: '.pagination',
  },
  productPage: {
    name: '.product-name',
    sku: '.product-sku',
    price: '.product-price',
    description: '.product-description',
    category: '.product-category',
    stock: '.product-stock',
    specifications: '.product-specs',
    images: '.product-image',
  },
};

const DEFAULT_OPTIONS: CrawlerOptions = {
  useHeadlessBrowser: true,
  followPagination: true,
  maxPages: 10,
  timeout: 30000,
  retryAttempts: 3,
  downloadImages: true,
  updateFrequency: 'daily',
};

export default function ConfigurationForm({ onSubmit, initialData }: ConfigurationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    targetUrl: initialData?.targetUrl || '',
    schedule: initialData?.schedule,
    rateLimit: initialData?.rateLimit || 30,
    authType: initialData?.authType || AuthType.NONE,
    selectors: initialData?.selectors || DEFAULT_SELECTORS,
    options: initialData?.options || DEFAULT_OPTIONS,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectorsChange = (field: keyof ProductSelectors['listPage'] | keyof ProductSelectors['productPage'], section: 'listPage' | 'productPage', value: string) => {
    setFormData(prev => ({
      ...prev,
      selectors: {
        ...prev.selectors,
        [section]: {
          ...prev.selectors[section],
          [field]: value,
        },
      },
    }));
  };

  const handleOptionsChange = (field: keyof CrawlerOptions, value: any) => {
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [field]: value,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700">
            Target URL
          </label>
          <input
            type="url"
            id="targetUrl"
            value={formData.targetUrl}
            onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700">
            Rate Limit (requests per minute)
          </label>
          <input
            type="number"
            id="rateLimit"
            value={formData.rateLimit}
            onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="1"
            max="60"
            required
          />
        </div>

        <div>
          <label htmlFor="authType" className="block text-sm font-medium text-gray-700">
            Authentication Type
          </label>
          <select
            id="authType"
            value={formData.authType}
            onChange={(e) => setFormData({ ...formData, authType: e.target.value as AuthType })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {Object.values(AuthType).map(type => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schedule
          </label>
          <div className="bg-gray-50 p-4 rounded-md">
            <ScheduleForm
              value={formData.schedule}
              onChange={(schedule) => setFormData({ ...formData, schedule })}
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          </button>
        </div>

        {showAdvanced && (
          <>
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Selectors</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">List Page</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500">Product Container</label>
                      <input
                        type="text"
                        value={formData.selectors.listPage.productContainer}
                        onChange={(e) => handleSelectorsChange('productContainer', 'listPage', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Next Page Button</label>
                      <input
                        type="text"
                        value={formData.selectors.listPage.nextPage}
                        onChange={(e) => handleSelectorsChange('nextPage', 'listPage', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Product Page</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.selectors.productPage).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm text-gray-500">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleSelectorsChange(key as keyof ProductSelectors['productPage'], 'productPage', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.useHeadlessBrowser}
                      onChange={(e) => handleOptionsChange('useHeadlessBrowser', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Use Headless Browser</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.followPagination}
                      onChange={(e) => handleOptionsChange('followPagination', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Follow Pagination</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-gray-700">Max Pages</label>
                  <input
                    type="number"
                    value={formData.options.maxPages}
                    onChange={(e) => handleOptionsChange('maxPages', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700">Timeout (ms)</label>
                  <input
                    type="number"
                    value={formData.options.timeout}
                    onChange={(e) => handleOptionsChange('timeout', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="1000"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700">Retry Attempts</label>
                  <input
                    type="number"
                    value={formData.options.retryAttempts}
                    onChange={(e) => handleOptionsChange('retryAttempts', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700">Update Frequency</label>
                  <select
                    value={formData.options.updateFrequency}
                    onChange={(e) => handleOptionsChange('updateFrequency', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.options.downloadImages}
                      onChange={(e) => handleOptionsChange('downloadImages', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Download Images</span>
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
} 