'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const VEHICLE_TYPES = ['Truck', 'Van', 'Trailer', 'Pickup'];
const STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [vehicleType, setVehicleType] = useState(searchParams.get('vehicleType') ?? '');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [region, setRegion] = useState(searchParams.get('region') ?? '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') ?? '');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (vehicleType) params.set('vehicleType', vehicleType);
    if (status) params.set('status', status);
    if (region) params.set('region', region);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setVehicleType('');
    setStatus('');
    setRegion('');
    setDateFrom('');
    setDateTo('');
    router.push(pathname);
  };

  const selectClass =
    'rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Vehicle type</label>
        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={selectClass}>
          <option value="">All</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Region</label>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="e.g. Northeast"
          className={selectClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">From</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">To</label>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
      </div>

      <div className="flex gap-2">
        <button onClick={applyFilters} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          Apply
        </button>
        <button onClick={clearFilters} className="rounded-md border border-border px-3 py-1.5 text-sm font-medium">
          Clear
        </button>
      </div>
    </div>
  );
}
