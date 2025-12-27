
import { lmStudioService } from './src/services/lmstudio';
import { AgentRegistry } from './src/agents/AgentRegistry';
import { ManufacturingAgent } from './src/agents/ManufacturingAgent';
import { ConstructionAgent } from './src/agents/ConstructionAgent';
import { HRAgent } from './src/agents/HRAgent';
import { logger } from './src/config/logger';

async function runTests() {
    console.log('🚀 Starting Comprehensive Intent Detection Verification\n');

    // 1. Setup Registry
    const registry = AgentRegistry.getInstance();
    registry.registerAgent('manufacturing', new ManufacturingAgent());
    registry.registerAgent('construction', new ConstructionAgent());
    registry.registerAgent('hr', new HRAgent());

    const summaries = registry.getAgentSummaries();

    // 2. Define Test Scenarios
    const scenarios = [
        // --- MANUFACTURING ---
        {
            name: "Inventory: Addition",
            message: "Add 500 Steel Beams to our stock",
            expectedDept: "manufacturing",
            expectedAction: "ADD_ITEM"
        },
        {
            name: "Inventory: Check",
            message: "How many bolts do we have left in the warehouse?",
            expectedDept: "manufacturing",
            expectedAction: "CHECK_STOCK"
        },
        {
            name: "Production: Scheduling",
            message: "Plan a new production run for the tower cranes",
            expectedDept: "manufacturing",
            expectedAction: "SCHEDULE_RUN"
        },

        // --- HR ---
        {
            name: "HR: Policy Query",
            message: "What is the policy regarding maternity leave and sick days?",
            expectedDept: "hr",
            expectedAction: "QUERY_POLICY"
        },
        {
            name: "HR: Employee Search",
            message: "Find Charlie Duplicate in the directory",
            expectedDept: "hr",
            expectedAction: "SEARCH_EMPLOYEE"
        },

        // --- CONSTRUCTION ---
        {
            name: "Construction: Project Creation",
            message: "Initialize a new project named 'Desert Oasis' with a $2M budget",
            expectedDept: "construction",
            expectedAction: "CREATE_PROJECT"
        },
        {
            name: "Construction: Export",
            message: "Generate a PDF report of all active sites",
            expectedDept: "construction",
            expectedAction: "EXPORT_PDF"
        },
        {
            name: "Construction: Timeline",
            message: "Estimate the timeline for the site preparation phase",
            expectedDept: "construction",
            expectedAction: "ESTIMATE_TIMELINE"
        }
    ];

    // 3. Execute Scenarios
    let passed = 0;
    for (const scenario of scenarios) {
        console.log(`[TEST] ${scenario.name}`);
        console.log(`      Query: "${scenario.message}"`);

        try {
            const result = await lmStudioService.detectIntent(scenario.message, summaries);

            const deptMatch = result.department.toLowerCase() === scenario.expectedDept;
            const actionMatch = result.action === scenario.expectedAction;

            if (deptMatch && actionMatch) {
                console.log(`      ✅ PASS (Dept: ${result.department}, Action: ${result.action})`);
                passed++;
            } else {
                console.log(`      ❌ FAIL`);
                console.log(`         Expected: ${scenario.expectedDept} / ${scenario.expectedAction}`);
                console.log(`         Actual:   ${result.department} / ${result.action}`);
                console.log(`         Reason:   ${result.reasoning}`);
            }

            if (result.parameters) {
                console.log(`         Params: ${JSON.stringify(result.parameters)}`);
            }
        } catch (error) {
            console.error(`      💥 ERROR:`, error instanceof Error ? error.message : error);
        }
        console.log('--------------------------------------------------\n');
    }

    console.log(`📊 Result: ${passed}/${scenarios.length} passed.`);
}

runTests().catch(err => {
    console.error('Fatal Test Error:', err);
    process.exit(1);
});
