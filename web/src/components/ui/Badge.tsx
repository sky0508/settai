type BadgeType = 'OK' | '注意' | 'NG';

const STYLES: Record<BadgeType, string> = {
  'OK':   'bg-ok text-white',
  '注意': 'bg-caution text-white',
  'NG':   'bg-ng text-white',
};

export function Badge({ type }: { type: BadgeType }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${STYLES[type]}`}>
      {type}
    </span>
  );
}
