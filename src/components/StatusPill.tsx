import clsx from 'clsx';

type Status =
  | 'available'
  | 'on_trip'
  | 'in_shop'
  | 'out_of_service'
  | 'draft'
  | 'dispatched'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'on_duty'
  | 'off_duty'
  | 'suspended';

const labels: Record<Status, string> = {
  available: 'Available',
  on_trip: 'On Trip',
  in_shop: 'In Shop',
  out_of_service: 'Out of Service',
  draft: 'Draft',
  dispatched: 'Dispatched',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  on_duty: 'On Duty',
  off_duty: 'Off Duty',
  suspended: 'Suspended',
};

export default function StatusPill({ status }: { status: string }) {
  const s = status as Status;
  return (
    <span
      className={clsx(
        'status-pill',
        s === 'available' && 'status-available',
        s === 'on_trip' && 'status-on-trip',
        s === 'in_shop' && 'status-in-shop',
        s === 'out_of_service' && 'status-out-of-service',
        s === 'draft' && 'status-draft',
        s === 'dispatched' && 'status-dispatched',
        s === 'completed' && 'status-completed',
        s === 'cancelled' && 'status-cancelled',
        s === 'pending' && 'status-pending',
        s === 'on_duty' && 'status-on-duty',
        s === 'off_duty' && 'status-off-duty',
        s === 'suspended' && 'status-suspended',
        !labels[s] && 'bg-slate-500/20 text-slate-400'
      )}
    >
      {labels[s] || status}
    </span>
  );
}
