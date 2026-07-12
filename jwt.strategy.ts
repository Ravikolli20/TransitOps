// ============================================================================
// TransitOps — Prisma Schema
// PostgreSQL | Normalized 3NF | Explicit FKs + Indexes
// ============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ----------------------------------------------------------------------------
// ENUMS
// ----------------------------------------------------------------------------

enum RoleName {
  ADMIN
  FLEET_MANAGER
  DISPATCHER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

enum MaintenanceStatus {
  SCHEDULED
  ACTIVE
  CLOSED
}

enum MaintenanceType {
  PREVENTIVE
  CORRECTIVE
  INSPECTION
  EMERGENCY
}

enum FuelType {
  DIESEL
  PETROL
  CNG
  ELECTRIC
}

enum ExpenseType {
  TOLL
  MAINTENANCE
  REPAIR
  PARKING
  FUEL
  MISCELLANEOUS
}

enum DocumentOwnerType {
  VEHICLE
  DRIVER
}

enum NotificationType {
  LICENSE_EXPIRY
  INSURANCE_EXPIRY
  REGISTRATION_EXPIRY
  MAINTENANCE_DUE
  TRIP_ALERT
  SYSTEM
}

// ----------------------------------------------------------------------------
// AUTH / RBAC
// ----------------------------------------------------------------------------

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String
  firstName         String
  lastName          String
  isActive          Boolean   @default(true)
  roleId            String
  role              Role      @relation(fields: [roleId], references: [id])
  refreshTokenHash  String?
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  trips             Trip[]           @relation("DispatchedByUser")
  notifications     Notification[]

  @@index([roleId])
  @@map("users")
}

model Role {
  id          String       @id @default(uuid())
  name        RoleName     @unique
  description String?
  users       User[]
  permissions RolePermission[]
  createdAt   DateTime     @default(now())

  @@map("roles")
}

model Permission {
  id          String           @id @default(uuid())
  key         String           @unique // e.g. "vehicle:create", "trip:dispatch"
  description String?
  roles       RolePermission[]

  @@map("permissions")
}

// Explicit join table (rather than implicit m2m) so we can audit/extend later
model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

// ----------------------------------------------------------------------------
// VEHICLES
// ----------------------------------------------------------------------------

model Vehicle {
  id                 String        @id @default(uuid())
  registrationNumber String        @unique
  name               String
  model              String
  vehicleType        String
  maxLoadCapacityKg  Decimal       @db.Decimal(10, 2)
  odometerKm         Decimal       @db.Decimal(12, 2) @default(0)
  acquisitionCost    Decimal       @db.Decimal(14, 2)
  purchaseDate       DateTime
  status             VehicleStatus @default(AVAILABLE)
  insuranceExpiry    DateTime
  registrationExpiry DateTime
  region             String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  trips              Trip[]
  maintenanceLogs    MaintenanceLog[]
  fuelLogs           FuelLog[]
  expenses           Expense[]
  documents          Document[]    @relation("VehicleDocuments")

  @@index([status])
  @@index([vehicleType])
  @@index([region])
  @@map("vehicles")
}

// ----------------------------------------------------------------------------
// DRIVERS
// ----------------------------------------------------------------------------

model Driver {
  id                String       @id @default(uuid())
  firstName         String
  lastName          String
  licenseNumber     String       @unique
  licenseCategory   String
  licenseExpiry     DateTime
  contactNumber     String
  emergencyContact  String
  safetyScore       Decimal      @db.Decimal(4, 2) @default(100)
  status            DriverStatus @default(AVAILABLE)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  trips             Trip[]
  documents         Document[]   @relation("DriverDocuments")

  @@index([status])
  @@index([licenseExpiry])
  @@map("drivers")
}

// ----------------------------------------------------------------------------
// TRIPS
// ----------------------------------------------------------------------------

model Trip {
  id               String     @id @default(uuid())
  source            String
  destination       String
  vehicleId         String
  driverId          String
  cargoWeightKg     Decimal    @db.Decimal(10, 2)
  plannedDistanceKm Decimal    @db.Decimal(10, 2)
  actualDistanceKm  Decimal?   @db.Decimal(10, 2)
  fuelConsumedL     Decimal?   @db.Decimal(10, 2)
  revenueGenerated  Decimal?   @db.Decimal(14, 2)
  status            TripStatus @default(DRAFT)
  dispatchedAt      DateTime?
  completedAt       DateTime?
  cancelledAt       DateTime?
  dispatchedById    String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  vehicle           Vehicle    @relation(fields: [vehicleId], references: [id])
  driver            Driver     @relation(fields: [driverId], references: [id])
  dispatchedBy      User?      @relation("DispatchedByUser", fields: [dispatchedById], references: [id])

  @@index([vehicleId])
  @@index([driverId])
  @@index([status])
  @@index([createdAt])
  @@map("trips")
}

// ----------------------------------------------------------------------------
// MAINTENANCE
// ----------------------------------------------------------------------------

model MaintenanceLog {
  id              String             @id @default(uuid())
  vehicleId       String
  issue           String
  maintenanceType MaintenanceType
  cost            Decimal            @db.Decimal(14, 2)
  startDate       DateTime
  endDate         DateTime?
  status          MaintenanceStatus  @default(SCHEDULED)
  notes           String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  vehicle         Vehicle            @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId])
  @@index([status])
  @@map("maintenance_logs")
}

// ----------------------------------------------------------------------------
// FUEL
// ----------------------------------------------------------------------------

model FuelLog {
  id             String   @id @default(uuid())
  vehicleId      String
  liters         Decimal  @db.Decimal(10, 2)
  cost           Decimal  @db.Decimal(14, 2)
  fuelType       FuelType
  date           DateTime
  odometerReading Decimal @db.Decimal(12, 2)
  createdAt      DateTime @default(now())

  vehicle        Vehicle  @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId])
  @@index([date])
  @@map("fuel_logs")
}

// ----------------------------------------------------------------------------
// EXPENSES
// ----------------------------------------------------------------------------

model Expense {
  id          String      @id @default(uuid())
  vehicleId   String?
  type        ExpenseType
  amount      Decimal     @db.Decimal(14, 2)
  description String?
  date        DateTime
  createdAt   DateTime    @default(now())

  vehicle     Vehicle?    @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId])
  @@index([type])
  @@index([date])
  @@map("expenses")
}

// ----------------------------------------------------------------------------
// DOCUMENTS (polymorphic-ish via two nullable relations, disambiguated by ownerType)
// ----------------------------------------------------------------------------

model Document {
  id          String            @id @default(uuid())
  ownerType   DocumentOwnerType
  vehicleId   String?
  driverId    String?
  fileName    String
  fileUrl     String
  fileType    String
  uploadedAt  DateTime          @default(now())

  vehicle     Vehicle?          @relation("VehicleDocuments", fields: [vehicleId], references: [id])
  driver      Driver?           @relation("DriverDocuments", fields: [driverId], references: [id])

  @@index([vehicleId])
  @@index([driverId])
  @@map("documents")
}

// ----------------------------------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------------------------------

model Notification {
  id        String            @id @default(uuid())
  userId    String
  type      NotificationType
  message   String
  isRead    Boolean           @default(false)
  createdAt DateTime          @default(now())

  user      User              @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([isRead])
  @@map("notifications")
}
