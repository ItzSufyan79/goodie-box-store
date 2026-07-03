"use server";

const API_BASE = "https://track.delhivery.com";
const API_KEY = process.env.DELHIVERY_API_KEY ?? "";

const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Token ${API_KEY}`,
};

interface PincodeResponse {
  delivery_codes: Array<
    | { pin_code: number }
    | {
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
      }
  >;
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
    const entry = codes[0];
    if ("postal_code" in entry) {
      const pc = entry.postal_code;
      return {
        serviceable: pc.courier_enabled === "Y",
        codAvailable: pc.cod === "Y",
        estimatedDays: pc.dt || "3-5",
      };
    }
    return { serviceable: true, codAvailable: true, estimatedDays: "3-5" };
  } catch {
    return { serviceable: false, codAvailable: false, estimatedDays: "N/A" };
  }
}

export interface ShippingRate {
  totalCharge: number;
  freightCharge: number;
  chargeWeight: number;
}

export async function calculateShippingRate(req: {
  pincode: string;
  weight: number;
  amount: number;
}): Promise<ShippingRate | null> {
  try {
    const body = {
      md: "S",
      o_pin: "380055",
      d_pin: req.pincode,
      weight: String(req.weight),
      shipment_amount: String(req.amount),
      length: "25",
      width: "20",
      height: "10",
    };
    const url = `${API_BASE}/api/customerdashboard/shipments/chargeableweight`;
    const res = await fetch(url, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    });
    if (!res.ok) throw new Error("API not available");
    const text = await res.text();
    const data = JSON.parse(text);
    const charges = data.data?.[0] ?? data;
    if (charges?.total_charge != null) {
      return {
        totalCharge: Math.round(Number(charges.total_charge)),
        freightCharge: Math.round(Number(charges.freight_charge ?? charges.total_charge)),
        chargeWeight: Number(charges.charge_weight ?? req.weight),
      };
    }
    return null;
  } catch {
    const baseRate = req.weight <= 0.5 ? 59 : 59 + Math.ceil((req.weight - 0.5) / 0.5) * 25;
    return {
      totalCharge: req.amount >= 1499 ? 0 : baseRate,
      freightCharge: baseRate,
      chargeWeight: req.weight,
    };
  }
}

export async function generateWaybill(): Promise<string | null> {
  try {
    const url = `${API_BASE}/waybill/api/bulk/json/?count=1`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const text = await res.text();
    const parsed = JSON.parse(text);
    const awb = typeof parsed === "string" ? parsed : parsed.waybills?.[0] ?? null;
    return awb || null;
  } catch {
    return null;
  }
}

export interface CreateShipmentParams {
  waybill: string;
  name: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  orderNumber: string;
  paymentMode: "COD" | "Prepaid";
  amount: number;
  weight: number;
}

export async function createShipment(params: CreateShipmentParams): Promise<boolean> {
  try {
    const pickupName = process.env.PICKUP_NAME ?? "GoodieBox Store";
    const pickupAdd = process.env.PICKUP_ADDRESS ?? "Narol, Ahmedabad";
    const pickupCity = process.env.PICKUP_CITY ?? "Ahmedabad";
    const pickupState = process.env.PICKUP_STATE ?? "Gujarat";
    const pickupPhone = process.env.PICKUP_PHONE ?? "+919099999999";

    const body = {
      shipments: [
        {
          name: params.name,
          add: params.address,
          add2: params.address2 ?? "",
          city: params.city,
          state: params.state,
          country: "India",
          pin: params.pincode,
          phone: params.phone,
          order: params.orderNumber,
          payment_mode: params.paymentMode,
          total_amount: String(params.amount),
          pickup_name: pickupName,
          pickup_add: pickupAdd,
          pickup_city: pickupCity,
          pickup_state: pickupState,
          pickup_pin: "380055",
          pickup_phone: pickupPhone,
          dimension: "25x20x10",
          weight: String(params.weight),
          waybill: params.waybill,
        },
      ],
      pickup_location: {
        name: pickupName,
        add: pickupAdd,
        city: pickupCity,
        pin_code: "380055",
        phone: pickupPhone,
      },
    };

    const url = `${API_BASE}/api/cmu/create`;
    const res = await fetch(url, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data?.success === true || (Array.isArray(data?.packages) && data.packages.length > 0);
  } catch {
    return false;
  }
}

interface TrackingResponse {
  ShipmentData?: Array<{
    Shipment: {
      AWB: string;
      Status: {
        Status: string;
        StatusCode?: string;
        Location?: string;
        Instructions?: string;
        UpdatedTime?: string;
        UpdatedDate?: string;
      };
      Scans?: Array<{
        sc: string;
        loc: string;
        dc: string;
        date: string;
        time: string;
        status: string;
        instructions?: string;
        updated_time?: string;
      }>;
    };
  }>;
  Success?: boolean;
  Error?: string;
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
    if (data.Success === false || !data.ShipmentData?.length) return null;
    const shipment = data.ShipmentData[0].Shipment;
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
