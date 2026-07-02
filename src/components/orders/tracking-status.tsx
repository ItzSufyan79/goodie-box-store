"use client";

import { useEffect, useState } from "react";
import { Package, Truck, CheckCircle, Loader2 } from "lucide-react";
import { trackShipment } from "@/lib/delhivery";
import type { TrackingInfo } from "@/lib/delhivery";

interface TrackingStatusProps {
  awb: string;
}

export function TrackingStatus({ awb }: TrackingStatusProps) {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTracking = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await trackShipment(awb);
        if (!cancelled) {
          setTracking(result);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };
    fetchTracking();
    const interval = setInterval(fetchTracking, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [awb]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading tracking...
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="text-xs text-muted-foreground py-1">
        Tracking unavailable. AWB: {awb}
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Truck className="h-4 w-4 text-primary" />
        <span>{tracking.currentStatus}</span>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {tracking.events.slice(0, 5).map((event, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span>{event.status}</span>
              {event.location && <span> — {event.location}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
