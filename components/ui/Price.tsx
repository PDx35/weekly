/** Format a number as Indian rupees, e.g. `1234` → `₹1,234`. */
export const rupee = (n: number): string => '₹' + Number(n).toLocaleString('en-IN');

interface PriceProps {
  value: number;
  /** Strike-through MRP; the percent-off badge shows when `mrp > value`. */
  mrp?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

/** Price with optional MRP strike-through and a percent-off badge. */
export function Price({ value, mrp, size = 'md' }: PriceProps) {
  return (
    <span className={`price price-${size}`}>
      <b>{rupee(value)}</b>
      {mrp && mrp > value && (
        <>
          <s>{rupee(mrp)}</s>
          {/* <span className="price-off">{Math.round((1 - value / mrp) * 100)}% off</span> */}
        </>
      )}
    </span>
  );
}
