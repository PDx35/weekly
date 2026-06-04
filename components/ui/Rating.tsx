import { Icon } from './Icon';

interface RatingProps {
  value: number;
  /** Optional review count shown in parentheses. */
  reviews?: number;
  size?: number;
}

/** Star rating with value and optional review count. */
export function Rating({ value, reviews, size = 13 }: RatingProps) {
  return (
    <span className="rating">
      <Icon name="star" size={size} stroke={0} className="rating-star" />
      <b>{Number(value).toFixed(1)}</b>
      {reviews != null && <span className="rating-n">({reviews})</span>}
    </span>
  );
}
