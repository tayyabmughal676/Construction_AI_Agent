import {mongodb} from './db/mongodb';
import {logger} from './config/logger';

/**
 * Seed database with test data for all agents
 */
export async function seedDatabase() {
    try {
        const db = mongodb.getDb();

        logger.info('Starting database seeding...');

        // Clear existing data
        await clearCollections(db);

        // Seed HR data
        await seedHRData(db);

        // Seed Manufacturing data
        await seedManufacturingData(db);

        // Seed Construction data
        await seedConstructionData(db);

        logger.info('✅ Database seeding completed successfully!');
    } catch (error) {
        logger.error({error}, 'Failed to seed database');
        throw error;
    }
}

async function clearCollections(db: any) {
    logger.info('Clearing existing collections...');

    const collections = [
        'employees', 'leave_requests', 'leave_balances', 'performance_goals',
        'performance_reviews', 'performance_feedback', 'inventory', 'stock_movements',
        'production_runs', 'quality_inspections', 'quality_defects', 'equipment',
        'maintenance_records', 'projects'
    ];

    for (const collection of collections) {
        await db.collection(collection).deleteMany({});
    }

    logger.info('Collections cleared');
}

// ==================== HR DATA ====================
async function seedHRData(db: any) {
    logger.info('Seeding HR data...');

    // Employees
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
            salary: 120000,
            manager: 'EMP005',
            status: 'active',
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
            salary: 95000,
            manager: 'EMP006',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            employeeId: 'EMP003',
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mike.johnson@company.com',
            phone: '+1 (555) 345-6789',
            department: 'Sales',
            position: 'Sales Representative',
            startDate: '2023-03-10',
            salary: 75000,
            manager: 'EMP007',
            status: 'active',
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
            salary: 65000,
            status: 'active',
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
            salary: 145000,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
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
    logger.info(`✅ Inserted ${leaveBalances.length} leave balances`);

    // Leave requests
    const leaveRequests = [
        {
            leaveId: 'LV001',
            employeeId: 'EMP001',
            leaveType: 'vacation',
            startDate: '2025-12-20',
            endDate: '2025-12-27',
            days: 5,
            reason: 'Holiday vacation',
            status: 'approved',
            createdAt: new Date('2025-11-01'),
            updatedAt: new Date('2025-11-02'),
        },
        {
            leaveId: 'LV002',
            employeeId: 'EMP002',
            leaveType: 'sick',
            startDate: '2025-11-15',
            endDate: '2025-11-16',
            days: 2,
            reason: 'Medical appointment',
            status: 'pending',
            createdAt: new Date('2025-11-14'),
            updatedAt: new Date('2025-11-14'),
        },
    ];

    await db.collection('leave_requests').insertMany(leaveRequests);
    logger.info(`✅ Inserted ${leaveRequests.length} leave requests`);

    // Performance goals
    const goals = [
        {
            goalId: 'GOAL001',
            employeeId: 'EMP001',
            title: 'Complete microservices migration',
            description: 'Migrate legacy monolith to microservices architecture',
            category: 'technical',
            priority: 'high',
            status: 'in_progress',
            dueDate: '2025-12-31',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date(),
        },
        {
            goalId: 'GOAL002',
            employeeId: 'EMP002',
            title: 'Launch Q4 marketing campaign',
            description: 'Plan and execute holiday marketing campaign',
            category: 'business',
            priority: 'high',
            status: 'completed',
            dueDate: '2025-11-30',
            createdAt: new Date('2025-09-01'),
            updatedAt: new Date(),
        },
    ];

    await db.collection('performance_goals').insertMany(goals);
    logger.info(`✅ Inserted ${goals.length} performance goals`);

    // Performance reviews
    const reviews = [
        {
            reviewId: 'REV001',
            employeeId: 'EMP001',
            reviewType: 'quarterly',
            period: 'Q3 2025',
            rating: 4.5,
            strengths: 'Excellent technical skills, great team player',
            improvements: 'Could improve documentation',
            createdAt: new Date('2025-10-01'),
        },
    ];

    await db.collection('performance_reviews').insertMany(reviews);
    logger.info(`✅ Inserted ${reviews.length} performance reviews`);
}

// ==================== MANUFACTURING DATA ====================
async function seedManufacturingData(db: any) {
    logger.info('Seeding Manufacturing data...');

    // Inventory items
    const inventory = [
        {
            itemCode: 'STEEL-001',
            name: 'Steel Rods',
            description: 'High-grade steel rods for construction',
            category: 'Raw Materials',
            quantity: 500,
            unit: 'units',
            reorderPoint: 100,
            reorderQuantity: 200,
            supplier: 'Steel Corp',
            unitCost: 25.50,
            location: 'Warehouse A',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'BOLT-M10',
            name: 'M10 Bolts',
            description: '10mm bolts with nuts',
            category: 'Fasteners',
            quantity: 5000,
            unit: 'pieces',
            reorderPoint: 1000,
            reorderQuantity: 2000,
            supplier: 'Fastener Inc',
            unitCost: 0.50,
            location: 'Warehouse B',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            itemCode: 'PAINT-BLU',
            name: 'Blue Industrial Paint',
            description: 'Industrial grade blue paint',
            category: 'Finishing',
            quantity: 50,
            unit: 'gallons',
            reorderPoint: 20,
            reorderQuantity: 50,
            supplier: 'Paint Supply Co',
            unitCost: 45.00,
            location: 'Warehouse C',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    await db.collection('inventory').insertMany(inventory);
    logger.info(`✅ Inserted ${inventory.length} inventory items`);

    // Production runs
    const productionRuns = [
        {
            productCode: 'PROD-001',
            productName: 'Steel Frame Assembly',
            quantity: 100,
            scheduledStart: '2025-11-20T08:00:00Z',
            scheduledEnd: '2025-11-22T17:00:00Z',
            priority: 'high',
            status: 'in_progress',
            assignedLine: 'Line A',
            producedQuantity: 45,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            productCode: 'PROD-002',
            productName: 'Widget Assembly',
            quantity: 500,
            scheduledStart: '2025-11-25T08:00:00Z',
            scheduledEnd: '2025-11-27T17:00:00Z',
            priority: 'medium',
            status: 'scheduled',
            assignedLine: 'Line B',
            producedQuantity: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    await db.collection('production_runs').insertMany(productionRuns);
    logger.info(`✅ Inserted ${productionRuns.length} production runs`);

    // Quality inspections
    const inspections = [
        {
            productCode: 'PROD-001',
            batchNumber: 'BATCH-2025-001',
            inspectionType: 'final',
            inspectorId: 'INS001',
            sampleSize: 20,
            passedCount: 19,
            failedCount: 1,
            defectTypes: ['surface_defect'],
            severity: 'minor',
            passRate: 95,
            status: 'passed',
            timestamp: new Date(),
        },
    ];

    await db.collection('quality_inspections').insertMany(inspections);
    logger.info(`✅ Inserted ${inspections.length} quality inspections`);

    // Equipment
    const equipment = [
        {
            equipmentId: 'EQ001',
            name: 'CNC Machine #1',
            type: 'CNC',
            manufacturer: 'Haas',
            model: 'VF-2',
            serialNumber: 'SN123456',
            installationDate: '2020-01-15',
            location: 'Production Floor A',
            status: 'operational',
            totalDowntime: 24,
            maintenanceCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            equipmentId: 'EQ002',
            name: 'Welding Robot #1',
            type: 'Welding Robot',
            manufacturer: 'FANUC',
            model: 'ARC Mate 100iC',
            serialNumber: 'SN789012',
            installationDate: '2021-06-01',
            location: 'Production Floor B',
            status: 'operational',
            totalDowntime: 12,
            maintenanceCount: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    await db.collection('equipment').insertMany(equipment);
    logger.info(`✅ Inserted ${equipment.length} equipment records`);

    // Maintenance records
    const maintenance = [
        {
            equipmentId: 'EQ001',
            maintenanceType: 'preventive',
            description: 'Regular maintenance and lubrication',
            technicianId: 'TECH001',
            scheduledDate: '2025-12-01',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    await db.collection('maintenance_records').insertMany(maintenance);
    logger.info(`✅ Inserted ${maintenance.length} maintenance records`);
}

// ==================== CONSTRUCTION DATA ====================
async function seedConstructionData(db: any) {
    logger.info('Seeding Construction data...');

    const projects = [
        {
            projectId: 'PROJ001',
            name: 'Downtown Office Building',
            description: '15-story commercial office building',
            status: 'in_progress',
            budget: 5000000,
            startDate: '2025-01-15',
            estimatedEndDate: '2026-06-30',
            location: '123 Main St, Downtown',
            client: 'ABC Corporation',
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date(),
        },
        {
            projectId: 'PROJ002',
            name: 'Residential Complex',
            description: '50-unit residential apartment complex',
            status: 'planning',
            budget: 3500000,
            startDate: '2025-03-01',
            estimatedEndDate: '2026-12-31',
            location: '456 Oak Avenue',
            client: 'XYZ Developers',
            createdAt: new Date('2025-01-10'),
            updatedAt: new Date(),
        },
        {
            projectId: 'PROJ003',
            name: 'Highway Bridge Repair',
            description: 'Structural repair and reinforcement',
            status: 'completed',
            budget: 1200000,
            startDate: '2024-06-01',
            estimatedEndDate: '2024-11-30',
            actualEndDate: '2024-11-15',
            location: 'Highway 101, Mile Marker 45',
            client: 'State DOT',
            createdAt: new Date('2024-05-01'),
            updatedAt: new Date('2024-11-15'),
        },
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
        logger.error({error}, 'Seeding failed');
        process.exit(1);
    });
}
