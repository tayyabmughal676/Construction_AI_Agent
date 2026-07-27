import { StateGraph, START, END } from "@langchain/langgraph";
import { LangGraphState } from "./state";
import { AgentRegistry } from "../../agents/AgentRegistry";
import { logger } from "../../config/logger";

/**
 * Project Kickoff Workflow
 * 1. Create Project
 * 2. Estimate Costs
 * 3. Generate Safety Checklist
 * 4. Notify Team (Email)
 */

const createProjectNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Creating project record...");
    const registry = AgentRegistry.getInstance();
    const agent = registry.getAgent('construction');

    if (!agent) return { errors: ["Construction Agent not found"] };

    const result = await agent.executeTool('project_tracker', {
        action: 'create',
        name: state.data.projectName,
        description: state.data.description,
        budget: state.data.budget,
        startDate: new Date().toISOString()
    });

    if (result.success) {
        return {
            data: { ...state.data, projectId: result.data.projectId },
            results: [{ step: "Create Project", projectId: result.data.projectId }]
        };
    }
    return { errors: [result.error] };
};

const estimateCostsNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Estimating costs...");
    const registry = AgentRegistry.getInstance();
    const agent = registry.getAgent('construction');

    const result = await agent!.executeTool('material_calculator', {
        projectType: state.data.projectType || 'commercial',
        squareFootage: state.data.squareFootage || 10000,
        qualityTier: state.data.qualityTier || 'standard'
    });

    if (result.success) {
        return {
            data: { ...state.data, estimatedCost: result.data.totalEstimatedCost, materials: result.data.materials },
            results: [{ step: "Estimate Costs", estimatedCost: result.data.totalEstimatedCost }]
        };
    }
    return { errors: [result.error] };
};

const generateChecklistNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Generating safety checklist...");
    const registry = AgentRegistry.getInstance();
    const agent = registry.getAgent('construction');

    const result = await agent!.executeTool('safety_checklist', {
        action: 'generate',
        projectPhase: 'pre_construction',
        projectType: state.data.projectType || 'commercial'
    });

    if (result.success) {
        return {
            data: { ...state.data, checklistId: result.data.checklistId },
            results: [{ step: "Generate Checklist", checklistId: result.data.checklistId }]
        };
    }
    return { errors: [result.error] };
};

const notifyTeamNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Notifying team...");
    const registry = AgentRegistry.getInstance();
    const hrAgent = registry.getAgent('hr');

    if (!hrAgent) return { errors: ["HR Agent not found"] };

    const emailBody = `
Project Kickoff Summary:
Name: ${state.data.projectName}
ID: ${state.data.projectId}
Estimated Material Cost: $${state.data.estimatedCost}
Safety Checklist ID: ${state.data.checklistId}

Please review the attached documents and prepare for site mobilization.
    `.trim();

    const result = await hrAgent.executeTool('email_sender', {
        to: state.data.pmEmail || 'pm@company.com',
        subject: `Project Kickoff: ${state.data.projectName}`,
        body: emailBody
    });

    return {
        results: [{ step: "Notify Team", success: result.success }]
    };
};

const checkSuccess = (nextStep: string) => (state: LangGraphState) => {
    if (state.errors.length > 0) return END;
    return nextStep;
};

const workflow = new StateGraph(LangGraphState)
    .addNode("createProject", createProjectNode)
    .addNode("estimateCosts", estimateCostsNode)
    .addNode("generateChecklist", generateChecklistNode)
    .addNode("notifyTeam", notifyTeamNode)
    .addEdge(START, "createProject")
    .addConditionalEdges("createProject", checkSuccess("estimateCosts"))
    .addConditionalEdges("estimateCosts", checkSuccess("generateChecklist"))
    .addConditionalEdges("generateChecklist", checkSuccess("notifyTeam"))
    .addEdge("notifyTeam", END);

export const projectKickoffGraph = workflow.compile();
