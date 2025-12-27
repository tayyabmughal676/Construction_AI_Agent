import { StateGraph, START, END } from "@langchain/langgraph";
import { LangGraphState } from "./state";
import { AgentRegistry } from "../../agents/AgentRegistry";
import { lmStudioService } from "../../services/lmstudio";
import { logger } from "../../config/logger";

/**
 * Super Orchestrator: The Company Control Graph.
 * It decomposes a complex request into multiple sequential tasks and executes them.
 */

// 1. Analyzer Node: Breaks down the message into a list of tasks
const analyzeRequestNode = async (state: LangGraphState) => {
    logger.info({ message: state.data.message }, "CompanyControl: Decomposing request...");
    const registry = AgentRegistry.getInstance();
    const summaries = registry.getAgentSummaries();

    try {
        const tasks = await lmStudioService.decomposeTasks(state.data.message, summaries);
        logger.info({ count: tasks.length }, "CompanyControl: Decompostion complete.");

        return {
            data: {
                ...state.data,
                pendingTasks: tasks,
                completedTasks: []
            },
            status: 'running' as const
        };
    } catch (error) {
        logger.error({ error }, "CompanyControl: Decomposition failed.");
        return { errors: [error instanceof Error ? error.message : "Failed to analyze request"] };
    }
};

// 2. Executor Node: Runs the next pending task from the list
const executeTaskNode = async (state: LangGraphState) => {
    const tasks = state.data.pendingTasks || [];
    const nextTask = tasks[0];

    if (!nextTask) return { status: 'completed' as const };

    logger.info({ department: nextTask.department, action: nextTask.action }, "CompanyControl: Executing step...");
    const registry = AgentRegistry.getInstance();
    const agent = registry.getAgent(nextTask.department);

    if (!agent) {
        return { errors: [`Agent for department '${nextTask.department}' not found.`] };
    }

    try {
        // Execute the task via the agent's processMessage, providing the detected intent context
        const result = await agent.processMessage(
            state.data.message,
            state.sessionId,
            nextTask.parameters,
            {
                department: nextTask.department,
                confidence: nextTask.confidence,
                action: nextTask.action,
                parameters: nextTask.parameters,
                reason: nextTask.reasoning,
                method: 'llm'
            }
        );

        return {
            data: {
                ...state.data,
                pendingTasks: tasks.slice(1),
                completedTasks: [...(state.data.completedTasks || []), nextTask]
            },
            results: [{
                step: nextTask.action,
                department: nextTask.department,
                response: result.message,
                data: result.data
            }]
        };
    } catch (error) {
        logger.error({ error }, "CompanyControl: Step execution failed.");
        return { errors: [error instanceof Error ? error.message : "Task execution failed"] };
    }
};

// Routing logic: Decide whether to loop back for more tasks
const shouldContinue = (state: LangGraphState) => {
    if (state.errors.length > 0) return END;
    return state.data.pendingTasks && state.data.pendingTasks.length > 0 ? "executeTask" : END;
};

// Define the State Machine
const workflow = new StateGraph(LangGraphState)
    .addNode("analyze", analyzeRequestNode)
    .addNode("executeTask", executeTaskNode)
    .addEdge(START, "analyze")
    .addEdge("analyze", "executeTask")
    .addConditionalEdges("executeTask", shouldContinue);

export const companyControlGraph = workflow.compile();
