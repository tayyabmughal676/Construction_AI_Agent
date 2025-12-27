import { StateGraph, START, END } from "@langchain/langgraph";
import { LangGraphState } from "./state";
import { logger } from "../../config/logger";
import { randomUUID } from "crypto";

export interface LangGraphWorkflowConfig {
    id: string;
    name: string;
    description: string;
}

/**
 * LangGraphWorkflowEngine
 * A wrapper to create and execute graphs for workflows.
 */
export class LangGraphWorkflowEngine {
    /**
     * Creates a graph from a list of steps.
     * This is a "step by step" integration, so we start with a simple linear graph.
     */
    static createLinearGraph(config: LangGraphWorkflowConfig, steps: any[]) {
        const workflow = new StateGraph(LangGraphState);

        // Dynamic node mapping
        steps.forEach((step, index) => {
            workflow.addNode(step.name, async (state: LangGraphState) => {
                logger.info({ workflowId: state.workflowId, stepName: step.name }, "Executing node");

                try {
                    if (step.condition && !step.condition(state)) {
                        return { nextStep: steps[index + 1]?.name || "END" };
                    }

                    const result = await step.action(state);

                    if (result.success) {
                        return {
                            results: [result.data],
                            currentStep: index + 1,
                            status: index === steps.length - 1 ? 'completed' : 'running'
                        };
                    } else {
                        return {
                            errors: [result.error],
                            status: 'failed'
                        };
                    }
                } catch (error) {
                    return {
                        errors: [error instanceof Error ? error.message : 'Unknown error'],
                        status: 'failed'
                    };
                }
            });
        });

        // Add edges
        workflow.addEdge(START, steps[0].name);
        for (let i = 0; i < steps.length - 1; i++) {
            workflow.addEdge(steps[i].name, steps[i + 1].name);
        }
        workflow.addEdge(steps[steps.length - 1].name, END);

        return workflow.compile();
    }

    /**
     * Executes a compiled graph.
     */
    static async execute(compiledGraph: any, context: Record<string, any>, sessionId: string) {
        const workflowId = randomUUID();
        const initialState = {
            workflowId,
            sessionId,
            currentStep: 0,
            totalSteps: 0, // Will be updated
            status: 'running' as const,
            data: context,
            results: [],
            errors: [],
        };

        return await compiledGraph.invoke(initialState);
    }
}
