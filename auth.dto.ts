/**
 * Seeds baseline RBAC data + one Admin user.
 * Run: npm run prisma:seed
 */
import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Permission keys follow "<resource>:<action>" convention.
const PERMISSIONS = [
  'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
  'driver:create', 'driver:read', 'driver:update', 'driver:delete',
  'trip:create', 'trip:dispatch', 'trip:complete', 'trip:cancel', 'trip:read',
  'maintenance:create', 'maintenance:update', 'maintenance:read',
  'fuel:create', 'fuel:read',
  'expense:create', 'expense:read',
  'analytics:read',
  'report:generate',
  'user:manage',
];

// Role -> permission keys. ADMIN gets everything implicitly.
const ROLE_PERMISSIONS: Record<Exclude<RoleName, 'ADMIN'>, string[]> = {
  FLEET_MANAGER: [
    'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
    'driver:create', 'driver:read', 'driver:update', 'driver:delete',
    'maintenance:create', 'maintenance:update', 'maintenance:read',
    'fuel:read', 'analytics:read', 'report:generate', 'trip:read',
  ],
  DISPATCHER: [
    'trip:create', 'trip:dispatch', 'trip:complete', 'trip:cancel', 'trip:read',
    'vehicle:read', 'driver:read',
  ],
  SAFETY_OFFICER: [
    'driver:read', 'driver:update', 'trip:read', 'analytics:read',
  ],
  FINANCIAL_ANALYST: [
    'expense:create', 'expense:read', 'fuel:read', 'fuel:create',
    'analytics:read', 'report:generate', 'trip:read',
  ],
};

async function main() {
  // 1. Permissions
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } }),
    ),
  );
  const permByKey = new Map(permissionRecords.map((p) => [p.key, p.id]));

  // 2. Roles
  const roleNames = Object.values(RoleName);
  const roleRecords = await Promise.all(
    roleNames.map((name) =>
      prisma.role.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const roleByName = new Map(roleRecords.map((r) => [r.name, r.id]));

  // 3. Role -> Permission mapping (ADMIN = all permissions)
  for (const roleName of roleNames) {
    const keys = roleName === 'ADMIN' ? PERMISSIONS : ROLE_PERMISSIONS[roleName];
    for (const key of keys) {
      const permissionId = permByKey.get(key)!;
      const roleId = roleByName.get(roleName)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  // 4. Seed Admin user (dev only — change password immediately in real deploys)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@transitops.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      roleId: roleByName.get('ADMIN')!,
    },
  });

  console.log('Seed complete.');
  console.log(`Admin login: ${adminEmail} / ${adminPassword} (rotate this immediately)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
