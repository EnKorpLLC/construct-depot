import { useState } from 'react';
import { TaxCalculationService } from '@/lib/tax';

interface TaxExemptionInputProps {
  onExemptionChange: (isExempt: boolean, exemptionNumber: string | null) => void;
  initialExempt?: boolean;
  initialExemptionNumber?: string;
}

export function TaxExemptionInput({
  onExemptionChange,
  initialExempt = false,
  initialExemptionNumber = '',
}: TaxExemptionInputProps) {
  const [isExempt, setIsExempt] = useState(initialExempt);
  const [exemptionNumber, setExemptionNumber] = useState(initialExemptionNumber);
  const [error, setError] = useState<string | null>(null);

  const handleExemptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIsExempt = e.target.checked;
    setIsExempt(newIsExempt);
    if (!newIsExempt) {
      setExemptionNumber('');
      setError(null);
      onExemptionChange(false, null);
    }
  };

  const handleExemptionNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.toUpperCase();
    setExemptionNumber(newNumber);
    setError(null);

    if (newNumber && !TaxCalculationService.validateExemptionNumber(newNumber)) {
      setError('Invalid exemption number format');
      onExemptionChange(isExempt, null);
    } else {
      onExemptionChange(isExempt, newNumber || null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="taxExempt"
          checked={isExempt}
          onChange={handleExemptChange}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="taxExempt" className="text-sm font-medium text-gray-700">
          Tax Exempt Purchase
        </label>
      </div>

      {isExempt && (
        <div className="space-y-2">
          <label htmlFor="exemptionNumber" className="block text-sm font-medium text-gray-700">
            Tax Exemption Number
          </label>
          <input
            type="text"
            id="exemptionNumber"
            value={exemptionNumber}
            onChange={handleExemptionNumberChange}
            placeholder="Enter tax exemption number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <p className="text-xs text-gray-500">
            Please enter a valid tax exemption number. Format: At least 6 alphanumeric characters.
          </p>
        </div>
      )}
    </div>
  );
} 