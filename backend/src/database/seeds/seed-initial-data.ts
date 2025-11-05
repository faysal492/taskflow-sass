import 'reflect-metadata';
import { AppDataSource } from '@database/data-source';
import { Tenant } from '@modules/tenants/entities/tenant.entity';
import { User } from '@modules/users/entities/user.entity';
import { UserRole } from '@common/enums/user-role.enum';
import { SubscriptionPlan } from '@common/enums/subscription-plan.enum';
import { SubscriptionStatus } from '@common/enums/subscription-status.enum';

export async function seedInitialData() {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const userRepo = AppDataSource.getRepository(User);

  // Create or get default tenant
  const tenantName = 'Demo Organization'; 
  const subdomain = 'demo';
  let tenant = await tenantRepo.findOne({ where: { subdomain } });

  if (!tenant) {
    tenant = tenantRepo.create({
      name: tenantName,
      subdomain,
      settings: {},
      subscriptionPlan: SubscriptionPlan.FREE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      isActive: true,
    });
    await tenantRepo.save(tenant);
    console.log('🏢 Tenant created:', tenant.name);
  }

  const users = [
    {
      email: 'admin@demo.com',
      password: 'Admin123!',
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
    {
      email: 'manager@demo.com',
      password: 'Member123!',
      firstName: 'Project',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
    {
      email: 'john@demo.com',
      password: 'Member123!',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.MEMBER,
    },
    {
      email: 'jane@demo.com',
      password: 'Member123!',
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.MEMBER,
    },
  ];

  for (const userData of users) {
    const exists = await userRepo.findOne({ where: { email: userData.email, tenant: { id: tenant.id } } });

    if (exists) {
      console.log(`ℹ️ User already exists, skipping: ${userData.email}`);
      continue;
    }

    const user = userRepo.create({
      ...userData,
      tenant: tenant,
      isActive: true,
    });

    await userRepo.save(user);
    console.log(`👤 User created: ${userData.email}`);
  }

  console.log('🌱 Seeding done.');
}