/**
 * TransitOps Type Declarations
 * Shared domain models and TypeScript interfaces for full-stack type safety.
 */

export enum UserRole {
  ADMIN = "ADMIN",
  FLEET_MANAGER = "FLEET_MANAGER",
  DISPATCHER = "DISPATCHER",
  SAFETY_OFFICER = "SAFETY_OFFICER",
  FINANCIAL_ANALYST = "FINANCIAL_ANALYST"
}

export enum VehicleStatus {
  AVAILABLE = "AVAILABLE",
  ON_TRIP = "ON_TRIP",
  IN_SHOP = "IN_SHOP",
  RETIRED = "RETIRED"
}

export enum DriverStatus {
  AVAILABLE = "AVAILABLE",
  ON_TRIP = "ON_TRIP",
  OFF_DUTY = "OFF_DUTY",
  SUSPENDED = "SUSPENDED"
}

export enum TripStatus {
  DRAFT = "DRAFT",
  DISPATCHED = "DISPATCHED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}

export enum ExpenseType {
  TOLL = "TOLL",
  MAINTENANCE = "MAINTENANCE",
  REPAIRS = "REPAIRS",
  PARKING = "PARKING",
  FUEL = "FUEL",
  MISCELLANEOUS = "MISCELLANEOUS"
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string; // Unique
  vehicleName: string;
  model: string;
  vehicleType: string; // e.g., Semi-Truck, Box Truck, Delivery Van
  maxLoadCapacity: number; // in kg
  odometer: number; // in km
  acquisitionCost: number; // in USD
  purchaseDate: string;
  status: VehicleStatus;
  insuranceExpiry: string;
  registrationExpiry: string;
  documents: DocumentAttachment[];
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string; // e.g., Class A CDL
  licenseExpiryDate: string;
  contactNumber: string;
  emergencyContact: string;
  safetyScore: number; // 0-100
  status: DriverStatus;
  createdAt: string;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  actualDistance?: number; // in km
  fuelConsumed?: number; // in liters
  revenueGenerated: number; // in USD
  status: TripStatus;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  issue: string;
  maintenanceType: string; // e.g., Routine, Repair, Inspection
  cost: number;
  startDate: string;
  endDate?: string;
  status: MaintenanceStatus;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  fuelType: string;
  date: string;
  odometerReading: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId?: string; // Optional if linked to a specific trip
  type: ExpenseType;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface DocumentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success" | "error";
  read: boolean;
  createdAt: string;
}

export interface FleetStats {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
  fuelCost: number;
  maintenanceCost: number;
  revenue: number;
  profitMargin: number;
}
