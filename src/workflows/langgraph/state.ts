import { Annotation } from "@langchain/langgraph";

/**
 * LangGraph specific workflow state.
 * This extends the basic idea of WorkflowState but is formatted for LangGraph's StateGraph.
 */
export const LangGraphState = Annotation.Root({
    workflowId: Annotation<string>(),
    sessionId: Annotation<string>(),
    currentStep: Annotation<number>(),
    totalSteps: Annotation<number>(),
    status: Annotation<'pending' | 'running' | 'completed' | 'failed'>(),
    data: Annotation<Record<string, any>>({
        reducer: (oldData, newData) => ({ ...oldData, ...newData }),
        default: () => ({}),
    }),
    results: Annotation<any[]>({
        reducer: (oldResults, newResults) => [...oldResults, ...newResults],
        default: () => [],
    }),
    errors: Annotation<string[]>({
        reducer: (oldErrors, newErrors) => [...oldErrors, ...newErrors],
        default: () => [],
    }),
    nextStep: Annotation<string | null>({
        reducer: (_, next) => next,
        default: () => null,
    }),
});

export type LangGraphState = typeof LangGraphState.State;
