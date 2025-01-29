interface OrderTaxSummaryProps {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  isExempt: boolean;
  exemptionNumber?: string | null;
  state: string;
}

export function OrderTaxSummary({
  subtotal,
  taxAmount,
  taxRate,
  isExempt,
  exemptionNumber,
  state,
}: OrderTaxSummaryProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-lg">Tax Summary</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="flex items-center">
            {isExempt ? (
              <span className="flex items-center">
                Tax (Exempt)
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  Tax Exempt
                </span>
              </span>
            ) : (
              `Tax (${(taxRate * 100).toFixed(2)}% - ${state})`
            )}
          </span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>

        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total:</span>
          <span>${(subtotal + taxAmount).toFixed(2)}</span>
        </div>

        {isExempt && exemptionNumber && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium">Exemption Number:</span> {exemptionNumber}
          </div>
        )}

        <div className="mt-2 text-xs text-gray-500">
          Tax calculated based on shipping address in {state}
        </div>
      </div>
    </div>
  );
} 