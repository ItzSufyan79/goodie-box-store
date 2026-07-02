"use server";

const API_BASE = "https://track.delhivery.com";
const API_KEY = process.env.DELHIVERY_API_KEY ?? "";

const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Token ${API_KEY}`,
};

interface PincodeResponse {
  delivery_codes: Array<{
    postal_code: {
      pin: string;
      pre_paid: string;
      cash: string;
      cod: string;
      pickup: string;
      pickup_cod: string;
      door_step: string;
      ndr: string;
      courier_ability: string;
      courier_enabled: string;
      dt: string;
    };
  }>;
}

export interface PincodeServiceability {
  serviceable: boolean;
  codAvailable: boolean;
  estimatedDays: string;
}

export async function checkPincodeServiceability(pincode: string): Promise<PincodeServiceability> {
  try {
    const url = `${API_BASE}/api/pin-codes/json/?filter_codes=${pincode}`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 86400 } });
    if (!res.ok) {
      return { serviceable: false, codAvailable: false, estimatedDays: "N/A" };
    }
    const data: PincodeResponse = await res.json();
    const codes = data.delivery_codes ?? [];
    if (codes.length === 0) {
      return { serviceable: false, codAvailable: false, estimatedDays: "N/A" };
    }
    const pc = codes[0].postal_code;
    return {
      serviceable: pc.courier_enabled === "Y",
      codAvailable: pc.cod === "Y",
      estimatedDays: pc.dt || "N/A",
    };
  } catch {
    return { serviceable: false, codAvailable: false, estimatedDays: "N/A" };
  }
}

interface RateRequest {
  pincode: string;
  weight: number;
  amount: number;
  codAmount?: number;
  length?: number;
  width?: number;
  height?: number;
}

interface RateResponse {
  data: {
    charge_weight: number;
    freight_charge: number;
    cod_charge: number;
    total_charge: number;
    fuel_surcharge: number;
  }[];
}

export interface ShippingRate {
  totalCharge: number;
  freightCharge: number;
  chargeWeight: number;
}

export async function calculateShippingRate(req: RateRequest): Promise<ShippingRate | null> {
  try {
    const body = {
      md: "S",
      o_pin: "110001",
      d_pin: req.pincode,
      o_app_id: "GoodieBox",
      d_app_id: "GoodieBox",
      weight: String(req.weight),
      shipment_amount: String(req.amount),
      cod_amount: String(req.codAmount ?? 0),
      length: String(req.length ?? 30),
      width: String(req.width ?? 20),
      height: String(req.height ?? 10),
    };
    const url = `${API_BASE}/api/customerdashboard/shipments/chargeableweight`;
    const res = await fetch(url, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data: RateResponse = await res.json();
    const charges = data.data?.[0];
    if (!charges) return null;
    return {
      totalCharge: Math.round(charges.total_charge),
      freightCharge: Math.round(charges.freight_charge),
      chargeWeight: charges.charge_weight,
    };
  } catch {
    return null;
  }
}

interface WaybillResponse {
  waybills: string[];
}

export async function generateWaybill(): Promise<string | null> {
  try {
    const url = `${API_BASE}/waybill/api/bulk/json/?count=1`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data: WaybillResponse = await res.json();
    return data.waybills?.[0] ?? null;
  } catch {
    return null;
  }
}

interface TrackingScans {
  sc: string;
  loc: string;
  dc: string;
  date: string;
  time: string;
  status: string;
  instructions?: string;
  updated_time?: string;
}

interface TrackingResponse {
  ShipmentData: Array<{
    Shipment: {
      AWB: string;
      Status: {
        Status: string;
        StatusCode: string;
        Location: string;
        Instructions?: string;
        UpdatedTime?: string;
        UpdatedDate?: string;
      };
      Scans: TrackingScans[];
    };
  }>;
}

export interface TrackingEvent {
  status: string;
  location: string;
  dateTime: string;
}

export interface TrackingInfo {
  awb: string;
  currentStatus: string;
  events: TrackingEvent[];
}

export async function trackShipment(awb: string): Promise<TrackingInfo | null> {
  try {
    const url = `${API_BASE}/api/v1/packages/json/?waybill=${awb}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data: TrackingResponse = await res.json();
    const shipment = data.ShipmentData?.[0]?.Shipment;
    if (!shipment) return null;
    return {
      awb: shipment.AWB,
      currentStatus: shipment.Status.Status,
      events: (shipment.Scans ?? []).map((scan) => ({
        status: scan.status,
        location: scan.loc,
        dateTime: `${scan.date} ${scan.time}`,
      })),
    };
  } catch {
    return null;
  }
}
