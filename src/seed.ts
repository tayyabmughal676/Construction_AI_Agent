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

        // Seed Knowledge Base data for Issa Enterprise
        await seedKnowledgeData(db);

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
        'maintenance_records', 'projects', 'knowledge'
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

    // Seed Performance Data for EMP001, EMP002, EMP003
    const goals = [
        { employeeId: 'EMP001', title: 'Complete AI Orchestration Engine', status: 'completed', category: 'individual', priority: 'high', createdAt: new Date() },
        { employeeId: 'EMP001', title: 'Achieve 98% Test Code Coverage', status: 'completed', category: 'individual', priority: 'high', createdAt: new Date() },
        { employeeId: 'EMP001', title: 'Deploy LangGraph Swarm Workflows', status: 'completed', category: 'team', priority: 'critical', createdAt: new Date() },
        { employeeId: 'EMP002', title: 'Launch Q3 Brand Awareness Campaign', status: 'completed', category: 'individual', priority: 'medium', createdAt: new Date() },
    ];
    await db.collection('performance_goals').insertMany(goals);

    const reviews = [
        { employeeId: 'EMP001', reviewerId: 'EMP004', reviewType: 'quarterly', rating: 5, comments: 'Exceptional architectural delivery of multi-agent swarm system', reviewDate: '2026-07-01' },
        { employeeId: 'EMP001', reviewerId: 'EMP004', reviewType: 'annual', rating: 4.6, comments: 'Consistently exceeds expectations across all technical initiatives', reviewDate: '2026-01-15' },
    ];
    await db.collection('performance_reviews').insertMany(reviews);

    const feedback = [
        { employeeId: 'EMP001', fromEmployeeId: 'EMP003', feedbackType: 'positive', message: 'Outstanding support on construction tool integration.', anonymous: false },
    ];
    await db.collection('performance_feedback').insertMany(feedback);
    logger.info('✅ Inserted HR performance goals, reviews, and feedback');

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

// ==================== KNOWLEDGE BASE DATA (ISSA ENTERPRISE) ====================
async function seedKnowledgeData(db: any) {
    logger.info('Seeding Issa Group Enterprise Knowledge Base & Policies...');

    const knowledgeArticles = [
        {
            title: 'Issa Group Hybrid & Work From Home (WFH) Policy',
            category: 'hr_policies',
            department: 'HR',
            content: 'Issa Group eligible full-time employees may work remotely up to two days per week subject to manager approval. Remote work requires a dedicated, quiet workspace and stable internet connectivity. The company provides a one-time stipend of $500 for home office ergonomics and hardware setup.',
            tags: ['wfh', 'remote', 'policy', 'stipend', 'benefits'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Group Paid Leave & Vacation Policy',
            category: 'hr_policies',
            department: 'HR',
            content: 'Full-time Issa Group employees receive 20 paid vacation days per calendar year accrued monthly. Up to 10 paid sick days are granted annually (doctor note required for absences over 2 consecutive days). Parental leave provides 12 weeks of 100% paid leave for primary caregivers.',
            tags: ['leave', 'vacation', 'pto', 'sick', 'parental'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Group Compensation & Salary Grade Levels',
            category: 'hr_policies',
            department: 'HR',
            content: 'Issa Group salary grades range from Grade L2 (Field Technician: $55k-$70k), Grade L4-L5 (Senior Site Engineer: $95k-$130k), Grade L6-L7 (Project Director: $145k-$185k), to Grade L8 (Corporate Vice President: $210k+). Salaries are reviewed annually in Q4.',
            tags: ['salary', 'grades', 'pay', 'compensation'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Group Health Insurance & Retirement Match',
            category: 'hr_policies',
            department: 'HR',
            content: 'Issa Group provides comprehensive health, dental, and vision insurance with 90% employer premium coverage. 401(k) retirement contributions are matched 100% up to 5% of annual base salary with immediate vesting upon hire.',
            tags: ['insurance', '401k', 'health', 'retirement', 'benefits'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Group Code of Conduct & Workplace Ethics',
            category: 'hr_policies',
            department: 'HR',
            content: 'Issa Group maintains a zero-tolerance policy against discrimination, harassment, safety compromise, or conflict of interest. All employees must adhere to ethical business practices, client confidentiality, and environmental sustainability standards.',
            tags: ['ethics', 'conduct', 'policy', 'compliance'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa OSHA Pre-Construction Inspection Checklist SOP',
            category: 'construction_sops',
            department: 'CONSTRUCTION',
            content: 'Before launching any excavation or structural framing at an Issa Construction site, the Project Superintendent must execute the 15-Point OSHA Safety Checklist covering utility mark-outs, trench soil stability, perimeter guardrails, and emergency assembly point signaling.',
            tags: ['osha', 'checklist', 'safety', 'construction', 'inspection'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Site Personal Protective Equipment (PPE) Standard',
            category: 'construction_sops',
            department: 'CONSTRUCTION',
            content: 'All active Issa Construction sites require 100% PPE compliance: ANSI Z89.1 Hard Hats, High-Visibility Class 2 Vests, ASTM F2413 Steel-Toe Safety Boots (Grade 75 impact protection), and UV-shielded Safety Eyewear. Failure to wear PPE results in immediate site removal.',
            tags: ['ppe', 'boots', 'hard-hat', 'safety', 'construction'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Fall Protection & Scaffolding Anchor Standard',
            category: 'construction_sops',
            department: 'CONSTRUCTION',
            content: 'Full-body harnesses connected to certified 5,000 lbs capacity anchor points are mandatory for all work performed at heights exceeding 6 feet (1.8m). Scaffolding must be inspected daily by a certified competent person before crew mounting.',
            tags: ['fall-protection', 'scaffolding', 'heights', 'harness', 'safety'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Heavy Equipment Operator Licensing Standard',
            category: 'construction_sops',
            department: 'CONSTRUCTION',
            content: 'Operation of heavy site equipment including tower cranes, hydraulic excavators, and high-capacity bulldozers is strictly restricted to operators holding active Issa Type C-2 Heavy Machine Certification.',
            tags: ['heavy-equipment', 'crane', 'excavator', 'license', 'construction'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa ISO 9001 Structural Steel Quality Control SOP',
            category: 'manufacturing_sops',
            department: 'MANUFACTURING',
            content: 'Fabrication of structural steel beams (STEEL-001) must adhere to ISO 9001 quality standards. Batch inspections require a minimum 98.5% pass rate on ultrasonic weld testing and tensile yield strength verification before factory dispatch.',
            tags: ['iso9001', 'quality', 'steel', 'manufacturing', 'qc'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Plant Equipment Preventive Maintenance 120-Hour SOP',
            category: 'manufacturing_sops',
            department: 'MANUFACTURING',
            content: 'Automated CNC Plasma Cutters, Laser Welders, and Robotic Assembly Arms must undergo comprehensive preventive maintenance every 120 operational hours. Maintenance logs must record bearing lubrication, optical alignment, and hydraulic pressure metrics.',
            tags: ['maintenance', 'cnc', 'robotics', 'equipment', 'manufacturing'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Recyclable Metal Scrap & Environmental SOP',
            category: 'manufacturing_sops',
            department: 'MANUFACTURING',
            content: 'All off-cut steel, aluminum shavings, and scrap copper generated in fabrication nodes must be segregated into color-coded bins and processed weekly through certified industrial metal recyclers, targeting 95% metal recovery.',
            tags: ['recycling', 'scrap', 'metal', 'environment', 'sustainability'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Procurement & Purchase Order (PO) Approval Thresholds',
            category: 'corporate_schedules',
            department: 'ENTERPRISE',
            content: 'Purchase orders up to $10,000 may be approved automatically by Department Managers via AI agents. POs exceeding $10,000 require human-in-the-loop executive review and multi-agent graph interrupt authorization before vendor commitment.',
            tags: ['procurement', 'po', 'approval', 'thresholds', 'budget'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Emergency Site Evacuation & Hazard Incident Protocol',
            category: 'construction_sops',
            department: 'CONSTRUCTION',
            content: 'In the event of severe weather, structural shift, or gas leak, sound the 3-long air horn blasts. All crews immediately evacuate to Primary Assembly Point A. Site Superintendent notifies Safety Officer and dispatches emergency report within 15 minutes.',
            tags: ['emergency', 'evacuation', 'incident', 'hazard', 'safety'],
            updatedAt: new Date(),
        },
        {
            title: 'Issa Onboarding 15-Step Employee Launch Standard',
            category: 'hr_policies',
            department: 'HR',
            content: 'Newly hired Issa Group staff undergo automated 15-step onboarding: ID assignment (EMP001), IT equipment provisioning, safety orientation, badging, benefits enrollment, and mentor pairing within the first 48 hours.',
            tags: ['onboarding', 'new-hire', 'launch', 'hr', 'checklist'],
            updatedAt: new Date(),
        }
    ];

    await db.collection('knowledge').insertMany(knowledgeArticles);
    logger.info(`✅ Inserted ${knowledgeArticles.length} Issa Group Knowledge Base & Policy documents`);
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
