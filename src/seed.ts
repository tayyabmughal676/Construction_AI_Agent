import './patch';
import { mongodb } from './db/mongodb';
import { logger } from './config/logger';
import bcrypt from 'bcrypt';

/**
 * Seed database with comprehensive enterprise data for all agents
 */
export async function seedDatabase() {
    try {
        const db = mongodb.getDb();

        logger.info('Starting database seeding...');

        // Clear existing data
        await clearCollections(db);

        // Seed Users
        await seedUsers(db);

        // Seed HR data
        await seedHRData(db);

        // Seed Manufacturing data
        await seedManufacturingData(db);

        // Seed Construction data
        await seedConstructionData(db);

        logger.info('✅ Database seeding completed successfully with rich enterprise data!');
    } catch (error) {
        logger.error({ error }, 'Failed to seed database');
        throw error;
    }
}

async function clearCollections(db: any) {
    logger.info('Clearing existing collections...');

    const collections = [
        'users', 'employees', 'leave_requests', 'leave_balances', 'performance_goals',
        'performance_reviews', 'performance_feedback', 'inventory', 'stock_movements',
        'production_runs', 'quality_inspections', 'quality_defects', 'equipment',
        'maintenance_records', 'projects'
    ];

    for (const collection of collections) {
        await db.collection(collection).deleteMany({});
    }

    logger.info('Collections cleared');
}

// ==================== USERS DATA ====================
async function seedUsers(db: any) {
    logger.info('Seeding Admin and User accounts...');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const users = [
        {
            name: 'System Admin',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
        },
        {
            name: 'Site Engineer',
            email: 'user@example.com',
            password: userPassword,
            role: 'user',
            createdAt: new Date(),
        }
    ];

    await db.collection('users').insertMany(users);
    logger.info(`✅ Inserted ${users.length} user accounts`);
}

// ==================== HR DATA ====================
async function seedHRData(db: any) {
    logger.info('Seeding HR workforce directory...');

    const employees = [
        {
            employeeId: 'EMP001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@company.com',
            phone: '+1 (555) 123-4567',
            department: 'Engineering',
            position: 'Senior Software Engineer',
            startDate: '2022-01-15',
            salary: 125000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP002',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@company.com',
            phone: '+1 (555) 234-5678',
            department: 'Marketing',
            position: 'Marketing Manager',
            startDate: '2021-06-01',
            salary: 98000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP003',
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mike.johnson@company.com',
            phone: '+1 (555) 345-6789',
            department: 'Construction',
            position: 'Senior Structural Engineer',
            startDate: '2023-03-10',
            salary: 110000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP004',
            firstName: 'Sarah',
            lastName: 'Williams',
            email: 'sarah.williams@company.com',
            phone: '+1 (555) 456-7890',
            department: 'HR',
            position: 'HR Specialist',
            startDate: '2022-08-20',
            salary: 68000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP005',
            firstName: 'David',
            lastName: 'Brown',
            email: 'david.brown@company.com',
            phone: '+1 (555) 567-8901',
            department: 'Engineering',
            position: 'Engineering Manager',
            startDate: '2020-02-01',
            salary: 150000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP006',
            firstName: 'Alex',
            lastName: 'Mercer',
            email: 'alex.mercer@company.com',
            phone: '+1 (555) 678-9012',
            department: 'Construction',
            position: 'Lead Site Superintendent',
            startDate: '2019-11-15',
            salary: 135000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP007',
            firstName: 'Elena',
            lastName: 'Rostova',
            email: 'elena.rostova@company.com',
            phone: '+1 (555) 789-0123',
            department: 'Manufacturing',
            position: 'Plant Operations Director',
            startDate: '2018-04-10',
            salary: 160000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP008',
            firstName: 'Marcus',
            lastName: 'Vance',
            email: 'marcus.vance@company.com',
            phone: '+1 (555) 890-1234',
            department: 'Construction',
            position: 'Site Safety Coordinator',
            startDate: '2022-09-01',
            salary: 82000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP009',
            firstName: 'Sophia',
            lastName: 'Chen',
            email: 'sophia.chen@company.com',
            phone: '+1 (555) 901-2345',
            department: 'Manufacturing',
            position: 'Quality Assurance Lead',
            startDate: '2021-01-20',
            salary: 92000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP010',
            firstName: 'Robert',
            lastName: 'Sterling',
            email: 'robert.sterling@company.com',
            phone: '+1 (555) 012-3456',
            department: 'Executive',
            position: 'Chief Operating Officer',
            startDate: '2017-05-01',
            salary: 220000,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.collection('employees').insertMany(employees);
    logger.info(`✅ Inserted ${employees.length} employees`);

    // Leave balances
    const leaveBalances = employees.map(emp => ({
        employeeId: emp.employeeId,
        vacation: 15,
        sick: 10,
        personal: 5,
        unpaid: 0,
        parental: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.collection('leave_balances').insertMany(leaveBalances);
}

// ==================== MANUFACTURING DATA ====================
async function seedManufacturingData(db: any) {
    logger.info('Seeding Manufacturing data...');

    const inventory = [
        {
            itemCode: 'STEEL-001',
            name: 'Steel Rods',
            description: 'High-grade 20mm structural steel rods',
            category: 'Raw Materials',
            quantity: 1500,
            unit: 'units',
            reorderPoint: 300,
            reorderQuantity: 500,
            supplier: 'Apex Steel Corp',
            unitCost: 28.50,
            location: 'Warehouse A',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'BOLT-M10',
            name: 'M10 Structural Fasteners',
            description: '10mm hardened steel bolts with lock nuts',
            category: 'Fasteners',
            quantity: 12500,
            unit: 'pieces',
            reorderPoint: 2500,
            reorderQuantity: 5000,
            supplier: 'Fastener Direct Inc',
            unitCost: 0.75,
            location: 'Warehouse B',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'PAINT-BLU',
            name: 'Blue Industrial Paint',
            description: 'Anti-corrosion weather-resistant coating',
            category: 'Finishing',
            quantity: 120,
            unit: 'gallons',
            reorderPoint: 40,
            reorderQuantity: 100,
            supplier: 'Global Paint Supply',
            unitCost: 48.00,
            location: 'Warehouse C',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'CONC-PRE',
            name: 'Pre-Stressed Concrete Panels',
            description: 'Reinforced precast concrete wall panels',
            category: 'Raw Materials',
            quantity: 450,
            unit: 'panels',
            reorderPoint: 100,
            reorderQuantity: 200,
            supplier: 'SolidRock Precast Co',
            unitCost: 320.00,
            location: 'Yard 1',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'ALUM-SHEET',
            name: 'T6 Aluminum Sheets',
            description: '4x8 ft architectural aluminum cladding',
            category: 'Hardware',
            quantity: 800,
            unit: 'sheets',
            reorderPoint: 150,
            reorderQuantity: 300,
            supplier: 'Kaiser Aluminum',
            unitCost: 65.00,
            location: 'Warehouse A',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'BEAM-H300',
            name: 'Heavy H-Beam Structural Steel 300mm',
            description: 'Load-bearing I-beam structural steel',
            category: 'Raw Materials',
            quantity: 280,
            unit: 'beams',
            reorderPoint: 50,
            reorderQuantity: 100,
            supplier: 'ArcelorMittal Steel',
            unitCost: 450.00,
            location: 'Yard 2',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'CABLE-HYD',
            name: 'High-Pressure Hydraulic Hoses',
            description: '3/8 inch reinforced heavy machinery hose',
            category: 'Hardware',
            quantity: 600,
            unit: 'meters',
            reorderPoint: 100,
            reorderQuantity: 250,
            supplier: 'Parker Hannifin',
            unitCost: 18.50,
            location: 'Warehouse B',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'INSUL-FOAM',
            name: 'Fire-Resistant Insulation Panels',
            description: 'R-30 thermal insulation foam board',
            category: 'Finishing',
            quantity: 1200,
            unit: 'panels',
            reorderPoint: 200,
            reorderQuantity: 400,
            supplier: 'Owens Corning',
            unitCost: 14.20,
            location: 'Warehouse C',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.collection('inventory').insertMany(inventory);
    logger.info(`✅ Inserted ${inventory.length} inventory items`);
}

// ==================== CONSTRUCTION DATA ====================
async function seedConstructionData(db: any) {
    logger.info('Seeding Construction projects...');

    const projects = [
        {
            projectId: 'PROJ001',
            name: 'Downtown Office Tower',
            description: '15-story commercial office building with underground parking',
            status: 'active',
            progress: 45,
            budget: 12500000,
            startDate: '2025-01-15',
            estimatedEndDate: '2026-06-30',
            location: '123 Main St, Downtown',
            client: 'Apex Commercial Properties',
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date(),
        },
        {
            projectId: 'PROJ002',
            name: 'Riverfront Residential Complex',
            description: '80-unit luxury residential apartment community with amenities',
            status: 'active',
            progress: 20,
            budget: 8500000,
            startDate: '2025-03-01',
            estimatedEndDate: '2026-12-31',
            location: '456 Riverfront Blvd',
            client: 'Horizon Realty Group',
            createdAt: new Date('2025-01-10'),
            updatedAt: new Date(),
        },
        {
            projectId: 'PROJ003',
            name: 'Highway 101 Overpass Reinforcement',
            description: 'Seismic retrofitting and structural concrete reinforcement',
            status: 'active',
            progress: 90,
            budget: 3200000,
            startDate: '2024-06-01',
            estimatedEndDate: '2025-11-30',
            location: 'Highway 101, Exit 45',
            client: 'Department of Transportation',
            createdAt: new Date('2024-05-01'),
            updatedAt: new Date(),
        },
        {
            projectId: 'PROJ004',
            name: 'Apex Industrial Fabrication Facility',
            description: 'Heavy manufacturing plant expansion with automated crane bays',
            status: 'planned',
            progress: 5,
            budget: 18000000,
            startDate: '2026-01-01',
            estimatedEndDate: '2027-08-15',
            location: 'Industrial Park Zone B',
            client: 'Apex Manufacturing Inc',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            projectId: 'PROJ005',
            name: 'Metro Skybridge Phase 2',
            description: 'Elevated pedestrian walkway connecting transit terminal to city center',
            status: 'active',
            progress: 65,
            budget: 6800000,
            startDate: '2024-09-01',
            estimatedEndDate: '2026-03-15',
            location: 'Central Transit Hub',
            client: 'Metropolitan Transit Authority',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            projectId: 'PROJ006',
            name: 'Solar Energy Farm Site C',
            description: '50MW commercial solar array installation and grid connection',
            status: 'completed',
            progress: 100,
            budget: 4500000,
            startDate: '2024-01-10',
            estimatedEndDate: '2024-10-31',
            location: 'Desert Sun Valley Site C',
            client: 'Clean Energy Partners',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.collection('projects').insertMany(projects);
    logger.info(`✅ Inserted ${projects.length} construction projects`);
}

// Run seeding if called directly
if (require.main === module) {
    mongodb.connect().then(async () => {
        await seedDatabase();
        process.exit(0);
    }).catch(error => {
        logger.error({ error }, 'Seeding failed');
        process.exit(1);
    });
}
