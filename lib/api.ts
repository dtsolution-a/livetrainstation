const BASE_URL = 'https://squid-app-plx4l.ondigitalocean.app/api';

export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: 30 }, // Cache for 30s for server components
    headers: { 'Accept': 'application/json' },
  });

  const body = await res.json().catch(() => {
    throw new ApiError('Unexpected response from server.', res.status);
  });

  if (!res.ok || body.success !== true) {
    const msg = body.error?.toString() ?? body.message?.toString() ?? 'Request failed.';
    throw new ApiError(msg, res.status);
  }

  return body.data as T;
}

// --- Types (mirrors Flutter models) ---

export interface PnrPassengerLeg {
  status: string;
  coach?: string;
  berthNo?: number;
  berthCode?: string;
  details: string;
}

export interface PnrPassenger {
  serialNumber: string;
  booking: PnrPassengerLeg;
  current: PnrPassengerLeg;
}

export interface PnrStatus {
  pnr: string;
  trainNumber: string;
  trainName: string;
  journey: {
    dateOfJourney: string;
    travelClass: string;
    quota: string;
    source: { code: string; name: string };
    destination: { code: string; name: string };
    boardingPoint: { code: string; name: string };
    distance: number;
    arrivalDate: string;
  };
  chartStatus: string;
  booking: { fare: number; ticketFare: number; bookingDate: string };
  passengers: PnrPassenger[];
}

export interface RouteStation {
  sequence: number;
  stationCode: string;
  stationName: string;
  isHalt: boolean;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayArrival?: number;
  delayDeparture?: number;
  status: string;
  distance: number;
  platform?: string;
}

export interface LiveStatus {
  trainNumber: string;
  trainName: string;
  date: string;
  lastUpdate: string;
  statusNote: string;
  currentLocation: {
    stationCode: string;
    sequence: number;
    status: string;
    isHalt: boolean;
    segmentProgress: number;
  };
  route: RouteStation[];
}

export interface TrainSearchResult {
  trainNumber: string;
  trainName: string;
  fromStationCode: string;
  fromStationName: string;
  toStationCode: string;
  toStationName: string;
  fromTime: string;
  toTime: string;
  travelTime: string;
  runningDays: string;
  distance: string;
  halts: number;
}

export interface TrainInfo {
  trainNumber: string;
  trainName: string;
  type?: string;
  runningDays?: string[];
  route?: RouteStation[];
  source?: { code: string; name: string };
  destination?: { code: string; name: string };
}

// --- API Functions ---

export async function checkPNR(pnr: string): Promise<PnrStatus> {
  const raw = await get<Record<string, unknown>>(`/pnr/${pnr}`);
  return parsePnrStatus(raw);
}

export async function trackTrain(trainNo: string, date: string): Promise<LiveStatus> {
  const path = `/train/${trainNo}/track${date ? `?date=${date}` : ''}`;
  const raw = await get<Record<string, unknown>>(path);
  return parseLiveStatus(raw);
}

export async function searchTrains(from: string, to: string): Promise<TrainSearchResult[]> {
  const raw = await get<unknown>(`/search?from=${from}&to=${to}`);
  const list: unknown[] = Array.isArray(raw) ? raw : (raw as Record<string, unknown[]>)?.trains ?? [];
  return list.map(parseTrainSearchResult);
}

function parseTrainInfo(raw: any): TrainInfo {
  return {
    trainNumber: raw.trainNo || raw.trainNumber || '',
    trainName: raw.name || raw.trainName || '',
    type: raw.type,
    runningDays: raw.runningDays,
    source: raw.source,
    destination: raw.destination,
    route: Array.isArray(raw.route) ? raw.route.map((s: any) => ({
      sequence: s.sequence,
      stationCode: s.station?.code || s.stationCode,
      stationName: s.station?.name || s.stationName,
      isHalt: s.isHalt ?? true,
      scheduledArrival: s.arrival || s.scheduledArrival,
      scheduledDeparture: s.departure || s.scheduledDeparture,
      distance: s.distance,
      platform: s.platform,
    })) : [],
  };
}

export async function getTrainInfo(trainNo: string): Promise<TrainInfo> {
  const raw = await get<any>(`/train/${trainNo}`);
  return parseTrainInfo(raw);
}

export async function getCoachPosition(trainNo: string): Promise<Record<string, unknown>> {
  return await get<Record<string, unknown>>(`/train/${trainNo}/coaches`);
}

export async function getTrainHistory(trainNo: string, date: string): Promise<Record<string, unknown>> {
  // date should be YYYY-MM-DD (matches what <input type="date"> provides)
  return await get<Record<string, unknown>>(`/train/${trainNo}/history?date=${date}`);
}

export async function getAvailability(
  trainNo: string, from: string, to: string,
  date: string, travelClass: string, quota: string
): Promise<Record<string, unknown>> {
  return await get<Record<string, unknown>>(
    `/availability?trainNo=${trainNo}&from=${from}&to=${to}&date=${date}&coach=${travelClass}&quota=${quota}`
  );
}

export async function getFare(
  trainNo: string, from: string, to: string,
  date: string, travelClass: string, quota: string
): Promise<Record<string, unknown>> {
  return await get<Record<string, unknown>>(
    `/fare?trainNo=${trainNo}&from=${from}&to=${to}&date=${date}&class=${travelClass}&quota=${quota}`
  );
}

// --- Parsers (mirrors Flutter fromJson) ---

function parsePnrStatus(json: Record<string, unknown>): PnrStatus {
  const train = (json.train ?? json.trainInfo ?? {}) as Record<string, unknown>;
  const journeyRaw = (json.journey ?? {}) as Record<string, unknown>;
  const bookingRaw = (json.booking ?? {}) as Record<string, unknown>;
  const src = (journeyRaw.source ?? journeyRaw.sourceStation ?? train.source ?? {}) as Record<string, unknown>;
  const dst = (journeyRaw.destination ?? journeyRaw.destinationStation ?? train.destination ?? {}) as Record<string, unknown>;
  const brd = (journeyRaw.boardingPoint ?? journeyRaw.boardingStation ?? src) as Record<string, unknown>;
  const passengerList = (json.passengers ?? json.passengerList ?? []) as Record<string, unknown>[];

  return {
    pnr: String(json.pnrNumber ?? json.pnr ?? ''),
    trainNumber: String(train.number ?? train.train_no ?? json.trainNo ?? ''),
    trainName: String(train.name ?? train.train_name ?? json.trainName ?? ''),
    journey: {
      dateOfJourney: String(journeyRaw.dateOfJourney ?? json.dateOfJourney ?? ''),
      travelClass: String(journeyRaw.class ?? json.journeyClass ?? ''),
      quota: String(journeyRaw.quota ?? json.quota ?? ''),
      source: { code: String(src.code ?? ''), name: String(src.name ?? '') },
      destination: { code: String(dst.code ?? ''), name: String(dst.name ?? '') },
      boardingPoint: { code: String(brd.code ?? ''), name: String(brd.name ?? '') },
      distance: Number(journeyRaw.distance ?? json.distance ?? 0),
      arrivalDate: String(journeyRaw.arrivalDate ?? json.arrivalDate ?? ''),
    },
    chartStatus: String(
      (json.charting as Record<string, unknown>)?.status ?? 
      (json.chart as Record<string, unknown>)?.status ?? 
      json.chartStatus ?? ''
    ),
    booking: {
      fare: Number(bookingRaw.fare ?? bookingRaw.bookingFare ?? json.bookingFare ?? 0),
      ticketFare: Number(bookingRaw.ticketFare ?? bookingRaw.ticketAmount ?? 0),
      bookingDate: String(bookingRaw.bookingDate ?? ''),
    },
    passengers: passengerList.map(parsePnrPassenger),
  };
}

function parsePnrPassenger(p: Record<string, unknown>): PnrPassenger {
  if (p.booking || p.current) {
    const booking = (p.booking ?? {}) as Record<string, unknown>;
    const current = (p.current ?? {}) as Record<string, unknown>;
    return {
      serialNumber: String(p.serialNumber ?? p.passengerSerialNumber ?? ''),
      booking: {
        status: String(booking.status ?? ''),
        coach: booking.coachId ? String(booking.coachId) : booking.coach ? String(booking.coach) : undefined,
        berthNo: booking.berthNo != null ? Number(booking.berthNo) : undefined,
        berthCode: booking.berthCode ? String(booking.berthCode) : undefined,
        details: String(booking.formatted ?? booking.details ?? ''),
      },
      current: {
        status: String(current.status ?? ''),
        coach: current.coachId ? String(current.coachId) : current.coach ? String(current.coach) : undefined,
        berthNo: current.berthNo != null ? Number(current.berthNo) : undefined,
        berthCode: current.berthCode ? String(current.berthCode) : undefined,
        details: String(current.formatted ?? current.details ?? ''),
      },
    };
  }
  // Flat format
  return {
    serialNumber: String(p.passengerSerialNumber ?? p.serialNumber ?? ''),
    booking: {
      status: String(p.bookingStatus ?? ''),
      coach: p.bookingCoach ? String(p.bookingCoach) : undefined,
      berthNo: p.bookingBerthNo != null ? Number(p.bookingBerthNo) : undefined,
      berthCode: p.bookingBerthCode ? String(p.bookingBerthCode) : undefined,
      details: String(p.bookingStatusDetails ?? ''),
    },
    current: {
      status: String(p.currentStatus ?? ''),
      coach: p.currentCoach ? String(p.currentCoach) : undefined,
      berthNo: p.currentBerthNo != null ? Number(p.currentBerthNo) : undefined,
      berthCode: p.currentBerthCode ? String(p.currentBerthCode) : undefined,
      details: String(p.currentStatusDetails ?? ''),
    },
  };
}

function parseLiveStatus(json: Record<string, unknown>): LiveStatus {
  const loc = (json.currentLocation ?? {}) as Record<string, unknown>;
  const route = (json.route ?? []) as Record<string, unknown>[];
  return {
    trainNumber: String(json.trainNumber ?? ''),
    trainName: String(json.trainName ?? ''),
    date: String(json.startDate ?? ''),
    lastUpdate: String(json.lastUpdatedAt ?? ''),
    statusNote: String(json.status ?? ''),
    currentLocation: {
      stationCode: String(loc.stationCode ?? ''),
      sequence: Number(loc.sequence ?? 0),
      status: String(loc.status ?? ''),
      isHalt: loc.isHalt === true,
      segmentProgress: Number(loc.segmentProgress ?? 0),
    },
    route: route.map((r) => ({
      sequence: Number(r.sequence ?? 0),
      stationCode: String(r.stationCode ?? ''),
      stationName: String(r.stationName ?? ''),
      isHalt: r.isHalt === true,
      scheduledArrival: r.scheduledArrival ? String(r.scheduledArrival) : undefined,
      scheduledDeparture: r.scheduledDeparture ? String(r.scheduledDeparture) : undefined,
      actualArrival: r.actualArrival ? String(r.actualArrival) : undefined,
      actualDeparture: r.actualDeparture ? String(r.actualDeparture) : undefined,
      delayArrival: r.delayArrival != null ? Number(r.delayArrival) : undefined,
      delayDeparture: r.delayDeparture != null ? Number(r.delayDeparture) : undefined,
      status: String(r.status ?? ''),
      distance: Number(r.distance ?? 0),
      platform: r.platform ? String(r.platform) : undefined,
    })),
  };
}

function parseTrainSearchResult(raw: unknown): TrainSearchResult {
  const r = raw as Record<string, unknown>;
  const trainObj = r.train as Record<string, unknown> | undefined;
  const fromObj = r.from as Record<string, unknown> | undefined;
  const toObj = r.to as Record<string, unknown> | undefined;

  const travelMinutes = Number(r.duration ?? 0);
  const travelTimeStr = travelMinutes > 0
    ? `${Math.floor(travelMinutes / 60)}h ${travelMinutes % 60}m`
    : String(r.travel_time ?? '');

  const runDays = trainObj?.runDays as string[] | undefined;
  const runningDays = runDays
    ? runDays.map((d) => d.substring(0, 3).toUpperCase()).join(', ')
    : String(r.running_days ?? '');

  return {
    trainNumber: String(trainObj?.number ?? r.train_no ?? ''),
    trainName: String(trainObj?.name ?? r.train_name ?? ''),
    fromStationCode: String(fromObj?.code ?? r.from_stn_code ?? ''),
    fromStationName: String(fromObj?.name ?? r.from_stn_name ?? ''),
    toStationCode: String(toObj?.code ?? r.to_stn_code ?? ''),
    toStationName: String(toObj?.name ?? r.to_stn_name ?? ''),
    fromTime: String(fromObj?.departure ?? r.from_time ?? ''),
    toTime: String(toObj?.arrival ?? r.to_time ?? ''),
    travelTime: travelTimeStr,
    runningDays,
    distance: String(r.distance ?? ''),
    halts: Number((r.totalHaltsBetween ?? r.halts) ?? 0),
  };
}

export function getPassengerStatusColor(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('CNF')) return 'text-confirmed';
  if (s.includes('CAN')) return 'text-cancelled';
  if (s.includes('WL') || s.includes('RAC')) return 'text-waitlist';
  return 'text-[var(--muted)]';
}

export function getDelayColor(delay?: number): string {
  if (!delay || delay === 0) return 'text-confirmed';
  if (delay > 0 && delay <= 15) return 'text-waitlist';
  return 'text-cancelled';
}
