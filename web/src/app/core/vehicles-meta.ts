import vehicles from '../data/vehicles.json';
import { VehicleId } from './fare';
export interface VehicleMeta { id: VehicleId; name: string; models: string; seats: number; seatsLabel: string; bags: number; ac: boolean; tag: string; blurb: string }
export const VEHICLES = vehicles as unknown as VehicleMeta[];
export const VEHICLE_META = Object.fromEntries(VEHICLES.map((v) => [v.id, v])) as Record<VehicleId, VehicleMeta>;
