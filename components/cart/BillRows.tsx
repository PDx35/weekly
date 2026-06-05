import { Icon } from '@/components/ui/Icon';
import { rupee } from '@/components/ui/Price';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/bill';
import type { OrderTotals } from '@/lib/types';

interface BillRowsProps {
  bill: OrderTotals;
  /** Show the "add ₹X for free delivery" nudge when a fee applies. */
  freeNote?: boolean;
}

/** Itemised bill summary. Ported from the prototype `BillRows`. */
export function BillRows({ bill, freeNote }: BillRowsProps) {
  return (
    <div className="bill">
      <div className="bill-row">
        <span>Item total</span>
        <b>{rupee(bill.items)}</b>
      </div>
      <div className="bill-row">
        <span>Delivery fee</span>
        {bill.delivery === 0 ? <b className="free">FREE</b> : <b>{rupee(bill.delivery)}</b>}
      </div>
      <div className="bill-row">
        <span>Handling charge</span>
        <b>{rupee(bill.handling)}</b>
      </div>
      {bill.discount > 0 && (
        <div className="bill-row">
          <span>Discount</span>
          <b className="free">– {rupee(bill.discount)}</b>
        </div>
      )}
      <div className="bill-row bill-total">
        <span>To pay</span>
        <b>{rupee(bill.grand)}</b>
      </div>
      {freeNote && bill.delivery > 0 && (
        <p className="bill-note">
          <Icon name="truck" size={14} /> Add {rupee(FREE_DELIVERY_THRESHOLD - bill.items)} more for
          FREE delivery
        </p>
      )}
    </div>
  );
}
