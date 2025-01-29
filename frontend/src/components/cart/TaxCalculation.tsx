import { useState, useEffect } from 'react';
import { TaxCalculationResult } from '@/lib/tax';

interface TaxCalculationProps {
  subtotal: number;
  shippingState: string;
  isExempt?: boolean;
  exemptionNumber?: string;
  onTaxCalculated?: (result: TaxCalculationResult) => void;
}

export function TaxCalculation({
  subtotal,
  shippingState,
  isExempt = false,
  exemptionNumber,
  onTaxCalculated
}: TaxCalculationProps) {
  const [taxInfo, setTaxInfo] = useState<TaxCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateTax = async () => {
      if (!subtotal || !shippingState) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tax/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subtotal,
            stateCode: shippingState,
            isExempt,
            exemptionNumber,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate tax');
        }

        const result = await response.json();
        setTaxInfo(result);
        onTaxCalculated?.(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate tax');
      } finally {
        setLoading(false);
      }
    };

    calculateTax();
  }, [subtotal, shippingState, isExempt, exemptionNumber]);

  if (loading) {
    return <div className="text-gray-500">Calculating tax...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!taxInfo) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Subtotal:</span>
        <span>${taxInfo.subtotal.toFixed(2)}</span>
      </div>
      
      {taxInfo.taxRate > 0 && (
        <div className="flex justify-between text-sm">
          <span>
            Tax ({(taxInfo.taxRate * 100).toFixed(2)}%
            {isExempt && ' - Tax Exempt'}):
          </span>
          <span>${taxInfo.taxAmount.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between font-semibold">
        <span>Total:</span>
        <span>${taxInfo.total.toFixed(2)}</span>
      </div>

      {isExempt && exemptionNumber && (
        <div className="text-xs text-gray-500">
          Tax Exemption Number: {exemptionNumber}
        </div>
      )}
    </div>
  );
} 