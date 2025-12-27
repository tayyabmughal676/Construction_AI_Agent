import { StateGraph, START, END } from "@langchain/langgraph";
import { LangGraphState } from "./state";
import { AgentRegistry } from "../../agents/AgentRegistry";
import { logger } from "../../config/logger";

/**
 * Modern LangGraph implementation of the Onboarding Workflow.
 * This demonstrates conditional logic: If email is missing, skip the email step.
 */

// Step 1: Create Employee Node
const createEmployeeNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Creating employee record...");
    const registry = AgentRegistry.getInstance();
    const hrAgent = registry.getAgent('hr');

    if (!hrAgent) return { errors: ["HR Agent not found"] };

    const result = await hrAgent.executeTool('employee_directory', {
        action: 'create',
        firstName: state.data.firstName,
        lastName: state.data.lastName,
        email: state.data.email || `${state.data.firstName.toLowerCase()}.${state.data.lastName.toLowerCase()}@company.com`,
        department: state.data.department,
        position: state.data.position,
    });

    if (result.success) {
        const employeeId = result.data.employee?.employeeId || result.data.employeeId;
        return {
            data: { ...state.data, employeeId },
            results: [{ step: "Create Employee", employeeId }]
        };
    }
    return { errors: [result.error] };
};

// Step 2: Generate Checklist Node
const generateChecklistNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Generating checklist...");
    const registry = AgentRegistry.getInstance();
    const hrAgent = registry.getAgent('hr');

    const result = await hrAgent!.executeTool('onboarding_checklist', {
        action: 'generate',
        employeeId: state.data.employeeId,
        role: state.data.position,
        department: state.data.department,
    });

    if (result.success) {
        return {
            data: { ...state.data, checklistId: result.data.checklistId },
            results: [{ step: "Generate Checklist", checklistId: result.data.checklistId }]
        };
    }
    return { errors: [result.error] };
};

// Step 3: Send Welcome Email Node
const sendWelcomeEmailNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Sending welcome email...");
    const registry = AgentRegistry.getInstance();
    const hrAgent = registry.getAgent('hr');

    const result = await hrAgent!.executeTool('email_sender', {
        to: state.data.email,
        subject: `Welcome ${state.data.firstName}!`,
        body: `Welcome to the team. Your ID is ${state.data.employeeId}.`,
    });

    return {
        results: [{ step: "Send Email", success: result.success }]
    };
};

// Conditional Logic: Should we proceed to next step?
const checkSuccess = (nextStep: string) => (state: LangGraphState) => {
    if (state.errors.length > 0) return END;
    return nextStep;
};

// Conditional Logic: Should we send an email?
const shouldSendEmail = (state: LangGraphState) => {
    if (state.errors.length > 0) return END;
    return state.data.email ? "sendEmail" : END;
};

// Define the Graph
const workflow = new StateGraph(LangGraphState)
    .addNode("createEmployee", createEmployeeNode)
    .addNode("generateChecklist", generateChecklistNode)
    .addNode("sendEmail", sendWelcomeEmailNode)
    .addEdge(START, "createEmployee")
    // Error-aware transitions
    .addConditionalEdges("createEmployee", checkSuccess("generateChecklist"))
    .addConditionalEdges("generateChecklist", shouldSendEmail)
    .addEdge("sendEmail", END);

export const onboardingGraph = workflow.compile();
