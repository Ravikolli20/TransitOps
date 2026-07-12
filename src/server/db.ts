import fs from "fs";
import path from "path";
import { 
  User, UserRole, Vehicle, VehicleStatus, Driver, DriverStatus, 
  Trip, TripStatus, MaintenanceLog, MaintenanceStatus, FuelLog, 
  Expense, ExpenseType, SystemNotification 
} from "../types.js";

const DB_FILE = path.join(process.cwd(), "database.json");

interface DatabaseSchema {
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  notifications: SystemNotification[];
}

const DEFAULT_USERS: User[] = [
  { id: "u1", email: "admin@transitops.com", name: "Sarah Jenkins", role: UserRole.ADMIN, createdAt: new Date("2026-01-10").toISOString() },
  { id: "u2", email: "manager@transitops.com", name: "Marcus Brody", role: UserRole.FLEET_MANAGER, createdAt: new Date("2026-01-15").toISOString() },
  { id: "u3", email: "dispatcher@transitops.com", name: "Elena Rostova", role: UserRole.DISPATCHER, createdAt: new Date("2026-01-20").toISOString() },
  { id: "u4", email: "safety@transitops.com", name: "David Miller", role: UserRole.SAFETY_OFFICER, createdAt: new Date("2026-01-22").toISOString() },
  { id: "u5", email: "analyst@transitops.com", name: "Karen Vance", role: UserRole.FINANCIAL_ANALYST, createdAt: new Date("2026-01-25").toISOString() }
];

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    registrationNumber: "TX-9988-FL",
    vehicleName: "Freightliner Cascadia",
    model: "Cascadia 126",
    vehicleType: "Semi-Truck",
    maxLoadCapacity: 36000,
    odometer: 142350,
    acquisitionCost: 145000,
    purchaseDate: "2025-03-15",
    status: VehicleStatus.AVAILABLE,
    insuranceExpiry: "2026-09-15",
    registrationExpiry: "2026-11-20",
    documents: [
      { id: "doc1", fileName: "TX_Registration_2026.pdf", fileType: "PDF", fileUrl: "/docs/tx_reg.pdf", uploadedAt: "2025-11-18T10:00:00Z" },
      { id: "doc2", fileName: "Commercial_Insurance_Cascadia.pdf", fileType: "PDF", fileUrl: "/docs/ins_cascadia.pdf", uploadedAt: "2025-09-10T14:30:00Z" }
    ],
    createdAt: "2025-03-15T12:00:00Z"
  },
  {
    id: "v2",
    registrationNumber: "CA-4421-OP",
    vehicleName: "Volvo VNL 860",
    model: "VNL 860 Sleeper",
    vehicleType: "Semi-Truck",
    maxLoadCapacity: 38000,
    odometer: 89400,
    acquisitionCost: 160000,
    purchaseDate: "2025-06-20",
    status: VehicleStatus.ON_TRIP,
    insuranceExpiry: "2026-06-20",
    registrationExpiry: "2026-07-20", // near expiry
    documents: [
      { id: "doc3", fileName: "CA_Permit_2026.pdf", fileType: "PDF", fileUrl: "/docs/ca_permit.pdf", uploadedAt: "2025-06-21T09:00:00Z" }
    ],
    createdAt: "2025-06-20T14:00:00Z"
  },
  {
    id: "v3",
    registrationNumber: "NY-7732-FT",
    vehicleName: "Hino 268 Box Truck",
    model: "268A Medium Duty",
    vehicleType: "Box Truck",
    maxLoadCapacity: 11000,
    odometer: 62410,
    acquisitionCost: 85000,
    purchaseDate: "2024-11-10",
    status: VehicleStatus.IN_SHOP,
    insuranceExpiry: "2026-05-10", // expired
    registrationExpiry: "2026-11-10",
    documents: [],
    createdAt: "2024-11-10T08:00:00Z"
  },
  {
    id: "v4",
    registrationNumber: "FL-1212-MS",
    vehicleName: "Ford Transit Cargo",
    model: "T-350 High Roof",
    vehicleType: "Delivery Van",
    maxLoadCapacity: 2100,
    odometer: 43100,
    acquisitionCost: 48000,
    purchaseDate: "2024-05-01",
    status: VehicleStatus.AVAILABLE,
    insuranceExpiry: "2027-05-01",
    registrationExpiry: "2027-05-01",
    documents: [],
    createdAt: "2024-05-01T10:00:00Z"
  },
  {
    id: "v5",
    registrationNumber: "IL-8899-RT",
    vehicleName: "Kenworth T680",
    model: "T680 Next Gen",
    vehicleType: "Semi-Truck",
    maxLoadCapacity: 40000,
    odometer: 285000,
    acquisitionCost: 155000,
    purchaseDate: "2022-04-10",
    status: VehicleStatus.RETIRED,
    insuranceExpiry: "2025-04-10",
    registrationExpiry: "2025-04-10",
    documents: [],
    createdAt: "2022-04-10T12:00:00Z"
  }
];

const DEFAULT_DRIVERS: Driver[] = [
  {
    id: "d1",
    name: "James 'Logan' Carter",
    licenseNumber: "CDL-TX-88712",
    licenseCategory: "Class A CDL",
    licenseExpiryDate: "2027-12-14",
    contactNumber: "+1 (555) 321-9876",
    emergencyContact: "Martha Carter (Wife) - +1 (555) 321-9877",
    safetyScore: 96,
    status: DriverStatus.AVAILABLE,
    createdAt: "2024-01-15T08:00:00Z"
  },
  {
    id: "d2",
    name: "Ramirez 'Ramon' Delgado",
    licenseNumber: "CDL-CA-44312",
    licenseCategory: "Class A CDL",
    licenseExpiryDate: "2026-08-10", // near expiry
    contactNumber: "+1 (555) 765-4321",
    emergencyContact: "Sofia Delgado (Sister) - +1 (555) 765-4322",
    safetyScore: 92,
    status: DriverStatus.ON_TRIP,
    createdAt: "2024-06-10T09:00:00Z"
  },
  {
    id: "d3",
    name: "Aisha Taylor",
    licenseNumber: "CDL-NY-11092",
    licenseCategory: "Class B CDL",
    licenseExpiryDate: "2026-04-01", // expired license
    contactNumber: "+1 (555) 234-5678",
    emergencyContact: "Robert Taylor (Father) - +1 (555) 234-5679",
    safetyScore: 88,
    status: DriverStatus.AVAILABLE,
    createdAt: "2025-01-05T10:00:00Z"
  },
  {
    id: "d4",
    name: "Benjamin Vance",
    licenseNumber: "CDL-FL-88911",
    licenseCategory: "Class C CDL",
    licenseExpiryDate: "2028-02-28",
    contactNumber: "+1 (555) 890-1234",
    emergencyContact: "Helen Vance (Mother) - +1 (555) 890-5678",
    safetyScore: 65, // low safety score
    status: DriverStatus.OFF_DUTY,
    createdAt: "2025-03-20T11:00:00Z"
  },
  {
    id: "d5",
    name: "Devon 'Diesel' Cobb",
    licenseNumber: "CDL-IL-99881",
    licenseCategory: "Class A CDL",
    licenseExpiryDate: "2026-10-30",
    contactNumber: "+1 (555) 456-7890",
    emergencyContact: "Gail Cobb (Wife) - +1 (555) 456-7891",
    safetyScore: 45,
    status: DriverStatus.SUSPENDED, // suspended
    createdAt: "2023-08-12T09:00:00Z"
  }
];

const DEFAULT_TRIPS: Trip[] = [
  {
    id: "t1",
    source: "Houston, TX",
    destination: "Dallas, TX",
    vehicleId: "v1",
    driverId: "d1",
    cargoWeight: 18500,
    plannedDistance: 390,
    actualDistance: 395,
    fuelConsumed: 118,
    revenueGenerated: 2400,
    status: TripStatus.COMPLETED,
    createdAt: "2026-06-15T08:00:00Z",
    dispatchedAt: "2026-06-15T09:00:00Z",
    completedAt: "2026-06-15T15:30:00Z"
  },
  {
    id: "t2",
    source: "Los Angeles, CA",
    destination: "Phoenix, AZ",
    vehicleId: "v2",
    driverId: "d2",
    cargoWeight: 24000,
    plannedDistance: 590,
    revenueGenerated: 4200,
    status: TripStatus.DISPATCHED,
    createdAt: "2026-07-11T06:00:00Z",
    dispatchedAt: "2026-07-11T07:30:00Z"
  },
  {
    id: "t3",
    source: "New York, NY",
    destination: "Boston, MA",
    vehicleId: "v3",
    driverId: "d3",
    cargoWeight: 8000,
    plannedDistance: 350,
    revenueGenerated: 1800,
    status: TripStatus.DRAFT,
    createdAt: "2026-07-11T14:00:00Z"
  }
];

const DEFAULT_MAINTENANCE: MaintenanceLog[] = [
  {
    id: "m1",
    vehicleId: "v3",
    issue: "Engine manifold replacement and brake pads rotation",
    maintenanceType: "Repair",
    cost: 2450,
    startDate: "2026-07-09",
    status: MaintenanceStatus.IN_PROGRESS,
    createdAt: "2026-07-09T08:00:00Z"
  },
  {
    id: "m2",
    vehicleId: "v1",
    issue: "Standard 150k km engine service and fluid flush",
    maintenanceType: "Routine",
    cost: 650,
    startDate: "2026-05-12",
    endDate: "2026-05-13",
    status: MaintenanceStatus.COMPLETED,
    createdAt: "2026-05-12T09:00:00Z"
  },
  {
    id: "m3",
    vehicleId: "v2",
    issue: "Pre-trip alignment check",
    maintenanceType: "Inspection",
    cost: 150,
    startDate: "2026-07-01",
    endDate: "2026-07-01",
    status: MaintenanceStatus.COMPLETED,
    createdAt: "2026-07-01T10:00:00Z"
  }
];

const DEFAULT_FUEL_LOGS: FuelLog[] = [
  { id: "f1", vehicleId: "v1", liters: 120, cost: 480, fuelType: "Diesel", date: "2026-06-15", odometerReading: 142010, createdAt: "2026-06-15T09:30:00Z" },
  { id: "f2", vehicleId: "v1", liters: 110, cost: 440, fuelType: "Diesel", date: "2026-06-15", odometerReading: 142350, createdAt: "2026-06-15T15:45:00Z" },
  { id: "f3", vehicleId: "v2", liters: 250, cost: 1050, fuelType: "Diesel", date: "2026-07-11", odometerReading: 89400, createdAt: "2026-07-11T08:00:00Z" }
];

const DEFAULT_EXPENSES: Expense[] = [
  { id: "e1", tripId: "t1", type: ExpenseType.TOLL, amount: 85, description: "I-45 Express Toll Tags", date: "2026-06-15", createdAt: "2026-06-15T10:00:00Z" },
  { id: "e2", tripId: "t1", type: ExpenseType.FUEL, amount: 920, description: "Full tank top-up at Pilot Star", date: "2026-06-15", createdAt: "2026-06-15T15:50:00Z" },
  { id: "e3", type: ExpenseType.MAINTENANCE, amount: 2450, description: "Kenworth Engine block replacement logs", date: "2026-07-09", createdAt: "2026-07-09T08:15:00Z" },
  { id: "e4", type: ExpenseType.PARKING, amount: 45, description: "Overnight secure compound parking NY", date: "2026-07-02", createdAt: "2026-07-02T22:00:00Z" }
];

const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  { id: "n1", title: "License Expiring Soon", message: "Driver Ramirez Delgado's license CDL-CA-44312 expires in under 30 days (2026-08-10).", type: "warning", read: false, createdAt: "2026-07-11T10:00:00Z" },
  { id: "n2", title: "Expired Driver License", message: "Driver Aisha Taylor cannot be dispatched. CDL-NY-11092 expired on 2026-04-01.", type: "error", read: false, createdAt: "2026-07-10T09:00:00Z" },
  { id: "n3", title: "Vehicle Registration Warning", message: "Vehicle Volvo VNL 860 (CA-4421-OP) registration expires on 2026-07-20.", type: "warning", read: true, createdAt: "2026-07-08T12:00:00Z" }
];

export class Database {
  private static load(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const db: DatabaseSchema = {
        users: DEFAULT_USERS,
        vehicles: DEFAULT_VEHICLES,
        drivers: DEFAULT_DRIVERS,
        trips: DEFAULT_TRIPS,
        maintenanceLogs: DEFAULT_MAINTENANCE,
        fuelLogs: DEFAULT_FUEL_LOGS,
        expenses: DEFAULT_EXPENSES,
        notifications: DEFAULT_NOTIFICATIONS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      return db;
    }
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse database, resetting to default", e);
      const db: DatabaseSchema = {
        users: DEFAULT_USERS,
        vehicles: DEFAULT_VEHICLES,
        drivers: DEFAULT_DRIVERS,
        trips: DEFAULT_TRIPS,
        maintenanceLogs: DEFAULT_MAINTENANCE,
        fuelLogs: DEFAULT_FUEL_LOGS,
        expenses: DEFAULT_EXPENSES,
        notifications: DEFAULT_NOTIFICATIONS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      return db;
    }
  }

  private static save(db: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  // General Reset
  public static reset() {
    const db: DatabaseSchema = {
      users: DEFAULT_USERS,
      vehicles: DEFAULT_VEHICLES,
      drivers: DEFAULT_DRIVERS,
      trips: DEFAULT_TRIPS,
      maintenanceLogs: DEFAULT_MAINTENANCE,
      fuelLogs: DEFAULT_FUEL_LOGS,
      expenses: DEFAULT_EXPENSES,
      notifications: DEFAULT_NOTIFICATIONS
    };
    this.save(db);
    return db;
  }

  // Users
  public static getUsers(): User[] {
    return this.load().users;
  }
  public static getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  public static createUser(name: string, email: string, role: UserRole): User {
    const db = this.load();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error("Email already registered");
    const user: User = {
      id: "u_" + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    this.save(db);
    return user;
  }

  // Vehicles
  public static getVehicles(): Vehicle[] {
    return this.load().vehicles;
  }
  public static saveVehicle(vehicleData: Omit<Vehicle, "id" | "createdAt" | "documents"> & { id?: string }): Vehicle {
    const db = this.load();
    
    // Validate uniqueness of registrationNumber
    const existingReg = db.vehicles.find(
      v => v.registrationNumber.toUpperCase() === vehicleData.registrationNumber.toUpperCase() && v.id !== vehicleData.id
    );
    if (existingReg) {
      throw new Error(`Vehicle registration number '${vehicleData.registrationNumber}' is already registered.`);
    }

    if (vehicleData.id) {
      // Edit mode
      const index = db.vehicles.findIndex(v => v.id === vehicleData.id);
      if (index === -1) throw new Error("Vehicle not found");
      const updated: Vehicle = {
        ...db.vehicles[index],
        ...vehicleData,
        registrationNumber: vehicleData.registrationNumber.toUpperCase(),
        odometer: Number(vehicleData.odometer),
        maxLoadCapacity: Number(vehicleData.maxLoadCapacity),
        acquisitionCost: Number(vehicleData.acquisitionCost)
      };
      db.vehicles[index] = updated;
      this.save(db);
      return updated;
    } else {
      // Add mode
      const newVehicle: Vehicle = {
        ...vehicleData,
        id: "v_" + Math.random().toString(36).substr(2, 9),
        registrationNumber: vehicleData.registrationNumber.toUpperCase(),
        odometer: Number(vehicleData.odometer),
        maxLoadCapacity: Number(vehicleData.maxLoadCapacity),
        acquisitionCost: Number(vehicleData.acquisitionCost),
        documents: [],
        createdAt: new Date().toISOString()
      };
      db.vehicles.push(newVehicle);
      this.save(db);
      return newVehicle;
    }
  }
  public static deleteVehicle(id: string) {
    const db = this.load();
    db.vehicles = db.vehicles.filter(v => v.id !== id);
    this.save(db);
  }

  // Drivers
  public static getDrivers(): Driver[] {
    return this.load().drivers;
  }
  public static saveDriver(driverData: Omit<Driver, "id" | "createdAt"> & { id?: string }): Driver {
    const db = this.load();
    if (driverData.id) {
      const index = db.drivers.findIndex(d => d.id === driverData.id);
      if (index === -1) throw new Error("Driver not found");
      const updated: Driver = {
        ...db.drivers[index],
        ...driverData,
        safetyScore: Number(driverData.safetyScore)
      };
      db.drivers[index] = updated;
      this.save(db);
      return updated;
    } else {
      const newDriver: Driver = {
        ...driverData,
        id: "d_" + Math.random().toString(36).substr(2, 9),
        safetyScore: Number(driverData.safetyScore),
        createdAt: new Date().toISOString()
      };
      db.drivers.push(newDriver);
      this.save(db);
      return newDriver;
    }
  }
  public static deleteDriver(id: string) {
    const db = this.load();
    db.drivers = db.drivers.filter(d => d.id !== id);
    this.save(db);
  }

  // Trips & Validations
  public static getTrips(): Trip[] {
    return this.load().trips;
  }
  public static saveTrip(tripData: Omit<Trip, "id" | "createdAt"> & { id?: string }): Trip {
    const db = this.load();
    const vehicle = db.vehicles.find(v => v.id === tripData.vehicleId);
    const driver = db.drivers.find(d => d.id === tripData.driverId);

    if (!vehicle) throw new Error("Assigned vehicle not found.");
    if (!driver) throw new Error("Assigned driver not found.");

    // Perform validation rules if dispatching or creating a trip
    if (tripData.status === TripStatus.DISPATCHED) {
      // 1. Vehicle must be available
      if (vehicle.status !== VehicleStatus.AVAILABLE && vehicle.status !== VehicleStatus.ON_TRIP) {
        // (VNL 860 v2 starts in ON_TRIP, but we can bypass for edits that don't change vehicle, or if it is already assigned to THIS trip)
        const isAlreadyOnThisTrip = db.trips.some(t => t.id === tripData.id && t.vehicleId === tripData.vehicleId && t.status === TripStatus.DISPATCHED);
        if (!isAlreadyOnThisTrip) {
          throw new Error(`Vehicle '${vehicle.vehicleName}' is currently not available (Status: ${vehicle.status}).`);
        }
      }

      // 2. Driver must be available
      if (driver.status !== DriverStatus.AVAILABLE) {
        const isAlreadyOnThisTrip = db.trips.some(t => t.id === tripData.id && t.driverId === tripData.driverId && t.status === TripStatus.DISPATCHED);
        if (!isAlreadyOnThisTrip) {
          throw new Error(`Driver '${driver.name}' is currently not available (Status: ${driver.status}).`);
        }
      }

      // 3. Driver license must not be expired
      const isExpired = new Date(driver.licenseExpiryDate) < new Date();
      if (isExpired) {
        throw new Error(`Driver '${driver.name}' has an expired driver's license (${driver.licenseExpiryDate}). Cannot dispatch.`);
      }

      // 4. Suspended drivers cannot be assigned
      if (driver.status === DriverStatus.SUSPENDED) {
        throw new Error(`Driver '${driver.name}' is currently suspended.`);
      }

      // 5. Cargo weight cannot exceed vehicle capacity
      if (Number(tripData.cargoWeight) > vehicle.maxLoadCapacity) {
        throw new Error(`Cargo weight (${tripData.cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg).`);
      }

      // 6. Retired or Maintenance vehicles cannot be assigned
      if (vehicle.status === VehicleStatus.RETIRED) {
        throw new Error(`Vehicle '${vehicle.vehicleName}' is retired and cannot be assigned.`);
      }
      if (vehicle.status === VehicleStatus.IN_SHOP) {
        throw new Error(`Vehicle '${vehicle.vehicleName}' is currently in maintenance shop.`);
      }
    }

    let tripResult: Trip;

    if (tripData.id) {
      // Edit
      const index = db.trips.findIndex(t => t.id === tripData.id);
      if (index === -1) throw new Error("Trip not found");
      const oldTrip = db.trips[index];
      
      const updated: Trip = {
        ...oldTrip,
        ...tripData,
        cargoWeight: Number(tripData.cargoWeight),
        plannedDistance: Number(tripData.plannedDistance),
        actualDistance: tripData.actualDistance ? Number(tripData.actualDistance) : undefined,
        fuelConsumed: tripData.fuelConsumed ? Number(tripData.fuelConsumed) : undefined,
        revenueGenerated: Number(tripData.revenueGenerated)
      };

      // State transitions
      this.handleTripStateTransition(db, oldTrip, updated);
      
      db.trips[index] = updated;
      tripResult = updated;
    } else {
      // Create
      const newTrip: Trip = {
        ...tripData,
        id: "t_" + Math.random().toString(36).substr(2, 9),
        cargoWeight: Number(tripData.cargoWeight),
        plannedDistance: Number(tripData.plannedDistance),
        actualDistance: tripData.actualDistance ? Number(tripData.actualDistance) : undefined,
        fuelConsumed: tripData.fuelConsumed ? Number(tripData.fuelConsumed) : undefined,
        revenueGenerated: Number(tripData.revenueGenerated),
        createdAt: new Date().toISOString()
      };

      this.handleTripStateTransition(db, null, newTrip);
      db.trips.push(newTrip);
      tripResult = newTrip;
    }

    this.save(db);
    return tripResult;
  }

  private static handleTripStateTransition(db: DatabaseSchema, oldTrip: Trip | null, newTrip: Trip) {
    const vehicle = db.vehicles.find(v => v.id === newTrip.vehicleId);
    const driver = db.drivers.find(d => d.id === newTrip.driverId);

    // If there was an old trip and its status is different, we might need to restore old assets first
    if (oldTrip && oldTrip.status !== newTrip.status) {
      const oldVehicle = db.vehicles.find(v => v.id === oldTrip.vehicleId);
      const oldDriver = db.drivers.find(d => d.id === oldTrip.driverId);

      // Restore old vehicle/driver status if transitioning away from dispatched
      if (oldTrip.status === TripStatus.DISPATCHED) {
        if (oldVehicle) oldVehicle.status = VehicleStatus.AVAILABLE;
        if (oldDriver) oldDriver.status = DriverStatus.AVAILABLE;
      }
    }

    // Apply new statuses
    if (newTrip.status === TripStatus.DISPATCHED) {
      if (vehicle) vehicle.status = VehicleStatus.ON_TRIP;
      if (driver) driver.status = DriverStatus.ON_TRIP;
      newTrip.dispatchedAt = new Date().toISOString();
    } else if (newTrip.status === TripStatus.COMPLETED) {
      if (vehicle) {
        vehicle.status = VehicleStatus.AVAILABLE;
        // Increase vehicle odometer with actual distance
        if (newTrip.actualDistance) {
          vehicle.odometer += Number(newTrip.actualDistance);
        } else {
          vehicle.odometer += Number(newTrip.plannedDistance);
        }
      }
      if (driver) driver.status = DriverStatus.AVAILABLE;
      newTrip.completedAt = new Date().toISOString();

      // Log a fuel log if fuel consumed was provided
      if (newTrip.fuelConsumed) {
        const fuelCost = Math.round(Number(newTrip.fuelConsumed) * 3.8); // standard diesel pricing
        const fLog: FuelLog = {
          id: "f_" + Math.random().toString(36).substr(2, 9),
          vehicleId: newTrip.vehicleId,
          liters: Number(newTrip.fuelConsumed),
          cost: fuelCost,
          fuelType: "Diesel",
          date: new Date().toISOString().split("T")[0],
          odometerReading: vehicle ? vehicle.odometer : 150000,
          createdAt: new Date().toISOString()
        };
        db.fuelLogs.push(fLog);

        // Also add an expense log
        db.expenses.push({
          id: "e_" + Math.random().toString(36).substr(2, 9),
          tripId: newTrip.id,
          type: ExpenseType.FUEL,
          amount: fuelCost,
          description: `Fuel for Trip: ${newTrip.source} -> ${newTrip.destination}`,
          date: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString()
        });
      }
    } else if (newTrip.status === TripStatus.CANCELLED) {
      if (vehicle) vehicle.status = VehicleStatus.AVAILABLE;
      if (driver) driver.status = DriverStatus.AVAILABLE;
    }
  }

  public static deleteTrip(id: string) {
    const db = this.load();
    const trip = db.trips.find(t => t.id === id);
    if (trip && trip.status === TripStatus.DISPATCHED) {
      const vehicle = db.vehicles.find(v => v.id === trip.vehicleId);
      const driver = db.drivers.find(d => d.id === trip.driverId);
      if (vehicle) vehicle.status = VehicleStatus.AVAILABLE;
      if (driver) driver.status = DriverStatus.AVAILABLE;
    }
    db.trips = db.trips.filter(t => t.id !== id);
    this.save(db);
  }

  // MaintenanceLogs
  public static getMaintenanceLogs(): MaintenanceLog[] {
    return this.load().maintenanceLogs;
  }
  public static saveMaintenanceLog(logData: Omit<MaintenanceLog, "id" | "createdAt"> & { id?: string }): MaintenanceLog {
    const db = this.load();
    const vehicle = db.vehicles.find(v => v.id === logData.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found.");

    let logResult: MaintenanceLog;

    if (logData.id) {
      const index = db.maintenanceLogs.findIndex(m => m.id === logData.id);
      if (index === -1) throw new Error("Maintenance record not found");
      const oldLog = db.maintenanceLogs[index];

      const updated: MaintenanceLog = {
        ...oldLog,
        ...logData,
        cost: Number(logData.cost)
      };

      // State transitions
      this.handleMaintenanceStateTransition(db, oldLog, updated);

      db.maintenanceLogs[index] = updated;
      logResult = updated;
    } else {
      const newLog: MaintenanceLog = {
        ...logData,
        id: "m_" + Math.random().toString(36).substr(2, 9),
        cost: Number(logData.cost),
        createdAt: new Date().toISOString()
      };

      this.handleMaintenanceStateTransition(db, null, newLog);
      db.maintenanceLogs.push(newLog);
      logResult = newLog;
    }

    this.save(db);
    return logResult;
  }

  private static handleMaintenanceStateTransition(db: DatabaseSchema, oldLog: MaintenanceLog | null, newLog: MaintenanceLog) {
    const vehicle = db.vehicles.find(v => v.id === newLog.vehicleId);
    if (!vehicle) return;

    // Transition rules:
    // If active maintenance starts: Vehicle -> IN_SHOP
    // If maintenance is closed/completed: Vehicle -> AVAILABLE
    if (newLog.status === MaintenanceStatus.IN_PROGRESS) {
      vehicle.status = VehicleStatus.IN_SHOP;
    } else if (newLog.status === MaintenanceStatus.COMPLETED) {
      vehicle.status = VehicleStatus.AVAILABLE;
      
      // Also write an expense record for closed maintenance logs
      const expenseExists = db.expenses.some(e => e.description.includes(newLog.id));
      if (!expenseExists) {
        db.expenses.push({
          id: "e_" + Math.random().toString(36).substr(2, 9),
          type: ExpenseType.MAINTENANCE,
          amount: Number(newLog.cost),
          description: `Vehicle maintenance log: ${newLog.id} (${vehicle.vehicleName})`,
          date: newLog.endDate || new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  public static deleteMaintenanceLog(id: string) {
    const db = this.load();
    const log = db.maintenanceLogs.find(m => m.id === id);
    if (log && log.status === MaintenanceStatus.IN_PROGRESS) {
      const vehicle = db.vehicles.find(v => v.id === log.vehicleId);
      if (vehicle) vehicle.status = VehicleStatus.AVAILABLE;
    }
    db.maintenanceLogs = db.maintenanceLogs.filter(m => m.id !== id);
    this.save(db);
  }

  // Fuel Logs
  public static getFuelLogs(): FuelLog[] {
    return this.load().fuelLogs;
  }
  public static saveFuelLog(logData: Omit<FuelLog, "id" | "createdAt"> & { id?: string }): FuelLog {
    const db = this.load();
    const vehicle = db.vehicles.find(v => v.id === logData.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found.");

    const newLog: FuelLog = {
      ...logData,
      id: "f_" + Math.random().toString(36).substr(2, 9),
      liters: Number(logData.liters),
      cost: Number(logData.cost),
      odometerReading: Number(logData.odometerReading),
      createdAt: new Date().toISOString()
    };

    // Update vehicle odometer if reading is higher
    if (newLog.odometerReading > vehicle.odometer) {
      vehicle.odometer = newLog.odometerReading;
    }

    db.fuelLogs.push(newLog);

    // Record as Fuel Expense
    db.expenses.push({
      id: "e_" + Math.random().toString(36).substr(2, 9),
      type: ExpenseType.FUEL,
      amount: Number(logData.cost),
      description: `Fuel purchase for ${vehicle.vehicleName} (${logData.liters}L)`,
      date: logData.date,
      createdAt: new Date().toISOString()
    });

    this.save(db);
    return newLog;
  }

  // Expenses
  public static getExpenses(): Expense[] {
    return this.load().expenses;
  }
  public static saveExpense(expenseData: Omit<Expense, "id" | "createdAt"> & { id?: string }): Expense {
    const db = this.load();
    if (expenseData.id) {
      const index = db.expenses.findIndex(e => e.id === expenseData.id);
      if (index === -1) throw new Error("Expense not found");
      const updated: Expense = {
        ...db.expenses[index],
        ...expenseData,
        amount: Number(expenseData.amount)
      };
      db.expenses[index] = updated;
      this.save(db);
      return updated;
    } else {
      const newExpense: Expense = {
        ...expenseData,
        id: "e_" + Math.random().toString(36).substr(2, 9),
        amount: Number(expenseData.amount),
        createdAt: new Date().toISOString()
      };
      db.expenses.push(newExpense);
      this.save(db);
      return newExpense;
    }
  }
  public static deleteExpense(id: string) {
    const db = this.load();
    db.expenses = db.expenses.filter(e => e.id !== id);
    this.save(db);
  }

  // Notifications
  public static getNotifications(): SystemNotification[] {
    return this.load().notifications;
  }
  public static markNotificationRead(id: string) {
    const db = this.load();
    const index = db.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      db.notifications[index].read = true;
      this.save(db);
    }
  }
}
