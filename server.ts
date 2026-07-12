import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Database } from "./src/server/db.js";
import { UserRole, TripStatus, VehicleStatus, DriverStatus, MaintenanceStatus, ExpenseType } from "./src/types.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  app.use(express.json());

  // Log requests in a neat line
  app.use((req, res, next) => {
    console.log(`[API LOG] ${req.method} ${req.url}`);
    next();
  });

  // 1. AUTHENTICATION MODULE ENDPOINTS
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const user = Database.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials. Try: admin@transitops.com, manager@transitops.com, dispatcher@transitops.com, safety@transitops.com, or analyst@transitops.com" });
    }
    
    // Simulate real JWT token creation
    const token = `mock-jwt-token-for-${user.id}-${user.role}`;
    return res.json({
      token,
      user
    });
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "Name, email, and role are required." });
    }
    try {
      const user = Database.createUser(name, email, role as UserRole);
      const token = `mock-jwt-token-for-${user.id}-${user.role}`;
      return res.json({ token, user });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });
    return res.json({ message: "Password reset link sent successfully." });
  });

  app.post("/api/auth/reset-password", (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required." });
    return res.json({ message: "Password reset completed successfully." });
  });

  // 2. DASHBOARD MODULE ENDPOINTS
  app.get("/api/dashboard/stats", (req, res) => {
    const vehicles = Database.getVehicles();
    const drivers = Database.getDrivers();
    const trips = Database.getTrips();
    const fuelLogs = Database.getFuelLogs();
    const maintenance = Database.getMaintenanceLogs();
    const expenses = Database.getExpenses();

    // Filters (Query Params)
    const { vehicleType, status, dateRange } = req.query;

    let filteredVehicles = [...vehicles];
    if (vehicleType) {
      filteredVehicles = filteredVehicles.filter(v => v.vehicleType === vehicleType);
    }
    if (status) {
      filteredVehicles = filteredVehicles.filter(v => v.status === status);
    }

    const activeVehicles = vehicles.filter(v => v.status === VehicleStatus.ON_TRIP).length;
    const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
    const vehiclesInMaintenance = vehicles.filter(v => v.status === VehicleStatus.IN_SHOP).length;
    
    const activeTrips = trips.filter(t => t.status === TripStatus.DISPATCHED).length;
    const pendingTrips = trips.filter(t => t.status === TripStatus.DRAFT).length;
    const driversOnDuty = drivers.filter(d => d.status === DriverStatus.ON_TRIP).length;

    // Fleet utilization = (vehicles on trip + in shop) / total active vehicles
    const totalCount = vehicles.filter(v => v.status !== VehicleStatus.RETIRED).length;
    const fleetUtilization = totalCount > 0 ? Math.round((activeVehicles / totalCount) * 100) : 0;

    const fuelCost = fuelLogs.reduce((acc, log) => acc + log.cost, 0);
    const maintenanceCost = maintenance.reduce((acc, log) => acc + log.cost, 0);
    const revenue = trips.filter(t => t.status === TripStatus.COMPLETED || t.status === TripStatus.DISPATCHED).reduce((acc, t) => acc + t.revenueGenerated, 0);

    const tollExpenses = expenses.filter(e => e.type === ExpenseType.TOLL).reduce((acc, e) => acc + e.amount, 0);
    const otherExpenses = expenses.filter(e => e.type === ExpenseType.MISCELLANEOUS || e.type === ExpenseType.PARKING).reduce((acc, e) => acc + e.amount, 0);
    const totalExpenses = fuelCost + maintenanceCost + tollExpenses + otherExpenses;

    const profit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    res.json({
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      fuelCost,
      maintenanceCost,
      revenue,
      profitMargin
    });
  });

  app.get("/api/dashboard/charts", (req, res) => {
    // Generate static/dynamic chart series
    const fuelLogs = Database.getFuelLogs();
    const maintenance = Database.getMaintenanceLogs();
    const trips = Database.getTrips();
    const expenses = Database.getExpenses();

    // 1. Monthly fuel expenses (past 6 months)
    const monthlyFuel = [
      { month: "Jan", cost: 3100 },
      { month: "Feb", cost: 2850 },
      { month: "Mar", cost: 3400 },
      { month: "Apr", cost: 3150 },
      { month: "May", cost: 3800 },
      { month: "Jun", cost: 4200 },
      { month: "Jul", cost: 1570 } // Current month logs + base
    ];
    // Dynamic add-on from database
    const currentMonthFuelCost = fuelLogs
      .filter(f => f.date.startsWith("2026-07"))
      .reduce((acc, f) => acc + f.cost, 0);
    monthlyFuel[6] = { month: "Jul", cost: 1200 + currentMonthFuelCost };

    // 2. Cost Trends (Fuel vs Maintenance vs Tolls)
    const costTrends = [
      { name: "Fuel", value: fuelLogs.reduce((acc, f) => acc + f.cost, 0) + 12400 },
      { name: "Maintenance", value: maintenance.reduce((acc, m) => acc + m.cost, 0) + 4200 },
      { name: "Tolls & Parking", value: expenses.filter(e => e.type === ExpenseType.TOLL || e.type === ExpenseType.PARKING).reduce((acc, e) => acc + e.amount, 0) + 1500 },
      { name: "Miscellaneous", value: expenses.filter(e => e.type === ExpenseType.MISCELLANEOUS).reduce((acc, e) => acc + e.amount, 0) + 800 }
    ];

    // 3. Vehicle Utilization over the months
    const vehicleUtilization = [
      { month: "Feb", rate: 68 },
      { month: "Mar", rate: 72 },
      { month: "Apr", rate: 75 },
      { month: "May", rate: 84 },
      { month: "Jun", rate: 89 },
      { month: "Jul", rate: 82 }
    ];

    // 4. Revenue vs Expenses
    const revenueTrends = [
      { month: "Feb", revenue: 14000, expenses: 8500 },
      { month: "Mar", revenue: 16200, expenses: 9800 },
      { month: "Apr", revenue: 17500, expenses: 10100 },
      { month: "May", revenue: 21000, expenses: 11400 },
      { month: "Jun", revenue: 24500, expenses: 13200 },
      { month: "Jul", revenue: 18400, expenses: 9500 }
    ];
    // Adjust current month dynamically
    const currentRevenue = trips.filter(t => t.status === TripStatus.COMPLETED && t.completedAt?.startsWith("2026-07")).reduce((acc, t) => acc + t.revenueGenerated, 0);
    const currentExpense = expenses.filter(e => e.date.startsWith("2026-07")).reduce((acc, e) => acc + e.amount, 0);
    revenueTrends[5].revenue += currentRevenue;
    revenueTrends[5].expenses += currentExpense;

    res.json({
      monthlyFuel,
      costTrends,
      vehicleUtilization,
      revenueTrends
    });
  });

  // 3. VEHICLE MANAGEMENT ENDPOINTS
  app.get("/api/vehicles", (req, res) => {
    res.json(Database.getVehicles());
  });

  app.post("/api/vehicles", (req, res) => {
    try {
      const vehicle = Database.saveVehicle(req.body);
      res.json(vehicle);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/vehicles/:id/documents", (req, res) => {
    const { id } = req.params;
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: "fileName and fileType are required." });
    }
    const vehicles = Database.getVehicles();
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    const doc = {
      id: "doc_" + Math.random().toString(36).substr(2, 9),
      fileName,
      fileType,
      fileUrl: `/docs/${fileName.toLowerCase().replace(/\s+/g, "_")}`,
      uploadedAt: new Date().toISOString()
    };
    vehicle.documents.push(doc);
    Database.saveVehicle(vehicle);
    res.json(vehicle);
  });

  app.delete("/api/vehicles/:id", (req, res) => {
    try {
      Database.deleteVehicle(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 4. DRIVER MANAGEMENT ENDPOINTS
  app.get("/api/drivers", (req, res) => {
    res.json(Database.getDrivers());
  });

  app.post("/api/drivers", (req, res) => {
    try {
      const driver = Database.saveDriver(req.body);
      res.json(driver);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/drivers/:id", (req, res) => {
    try {
      Database.deleteDriver(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 5. TRIP MANAGEMENT ENDPOINTS
  app.get("/api/trips", (req, res) => {
    res.json(Database.getTrips());
  });

  app.post("/api/trips", (req, res) => {
    try {
      const trip = Database.saveTrip(req.body);
      res.json(trip);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/trips/:id", (req, res) => {
    try {
      Database.deleteTrip(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 6. MAINTENANCE ENDPOINTS
  app.get("/api/maintenance", (req, res) => {
    res.json(Database.getMaintenanceLogs());
  });

  app.post("/api/maintenance", (req, res) => {
    try {
      const log = Database.saveMaintenanceLog(req.body);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/maintenance/:id", (req, res) => {
    try {
      Database.deleteMaintenanceLog(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 7. FUEL MANAGEMENT ENDPOINTS
  app.get("/api/fuel", (req, res) => {
    res.json(Database.getFuelLogs());
  });

  app.post("/api/fuel", (req, res) => {
    try {
      const log = Database.saveFuelLog(req.body);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 8. EXPENSE MANAGEMENT ENDPOINTS
  app.get("/api/expenses", (req, res) => {
    res.json(Database.getExpenses());
  });

  app.post("/api/expenses", (req, res) => {
    try {
      const exp = Database.saveExpense(req.body);
      res.json(exp);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/expenses/:id", (req, res) => {
    try {
      Database.deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 9. SYSTEM NOTIFICATIONS
  app.get("/api/notifications", (req, res) => {
    res.json(Database.getNotifications());
  });

  app.post("/api/notifications/:id/read", (req, res) => {
    Database.markNotificationRead(req.params.id);
    res.json({ success: true });
  });

  // 10. SYSTEM DATABASE RESET
  app.post("/api/db/reset", (req, res) => {
    Database.reset();
    res.json({ success: true, message: "Database reset to factory seeds." });
  });

  // Vite middleware setup for assets and HTML
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TransitOps] Full-stack server booted on port ${PORT}`);
  });
}

startServer();
