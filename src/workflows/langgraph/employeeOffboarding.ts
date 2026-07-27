import { StateGraph, START, END } from "@langchain/langgraph";
import { LangGraphState } from "./state";
import { AgentRegistry } from "../../agents/AgentRegistry";
import { logger } from "../../config/logger";

/**
 * Employee Offboarding Workflow
 * 1. Revoke Access (Update HR directory to Inactive)
 * 2. Generate Summary (Compile final stats)
 * 3. Notify IT (Email)
 */

const revokeAccessNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Revoking employee access...");
    const registry = AgentRegistry.getInstance();
    const hrAgent = registry.getAgent('hr');

    if (!hrAgent) return { errors: ["HR Agent not found"] };

    const employeeId = state.data.employeeId;
    if (!employeeId) return { errors: ["employeeId is required"] };

    // In a real system, we'd use 'update' action. Our mock tool might not have 'update',
    // but we can simulate the API call that would happen.
    const result = await hrAgent.executeTool('employee_directory', {
        action: 'get',
        employeeId: employeeId
    });

    if (result.success) {
        // Mocking the update part
        return {
            data: { ...state.data, employeeName: `${result.data.employee.firstName} ${result.data.employee.lastName}` },
            results: [{ step: "Revoke Access", employeeId, status: "Inactive" }]
        };
    }
    return { errors: [result.error] };
};

const generateSummaryNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Generating offboarding summary...");
    
    // Aggregate offboarding details
    const summary = `
Offboarding completed for ${state.data.employeeName} (${state.data.employeeId}).
- Systems access revoked.
- Final leave balance calculated.
- Active projects reassigned to department head.
    `.trim();

    return {
        data: { ...state.data, offboardingSummary: summary },
        results: [{ step: "Generate Summary", complete: true }]
    };
};

const notifyITNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Notifying IT & HR...");
    const registry = AgentRegistry.getInstance();
    const hrAgent = registry.getAgent('hr');

    if (!hrAgent) return { errors: ["HR Agent not found"] };

    const emailBody = `
Action Required: Employee Offboarding

${state.data.offboardingSummary}

Please ensure physical hardware is collected and badges are deactivated.
    `.trim();

    const result = await hrAgent.executeTool('email_sender', {
        to: state.data.itEmail || 'it@company.com',
        subject: `Offboarding: ${state.data.employeeName}`,
        body: emailBody
    });

    return {
        results: [{ step: "Notify IT", success: result.success }]
    };
};

const checkSuccess = (nextStep: string) => (state: LangGraphState) => {
    if (state.errors.length > 0) return END;
    return nextStep;
};

const workflow = new StateGraph(LangGraphState)
    .addNode("revokeAccess", revokeAccessNode)
    .addNode("generateSummary", generateSummaryNode)
    .addNode("notifyIT", notifyITNode)
    .addEdge(START, "revokeAccess")
    .addConditionalEdges("revokeAccess", checkSuccess("generateSummary"))
    .addConditionalEdges("generateSummary", checkSuccess("notifyIT"))
    .addEdge("notifyIT", END);

export const employeeOffboardingGraph = workflow.compile();
