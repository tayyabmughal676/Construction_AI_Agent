import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { AgentRegistry } from '../../agents/AgentRegistry';
import type { BaseAgent } from '../../agents/BaseAgent';
import { GroqService } from '../../services/groq';
import { MongoDBSaver } from './MongoDBSaver';
import { logger } from '../../config/logger';

// 1. Define Swarm State Annotation
export const SwarmState = Annotation.Root({
  sessionId: Annotation<string>(),
  prompt: Annotation<string>(),
  departments: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  constructionInput: Annotation<Record<string, any>>({
    reducer: (oldVal, newVal) => ({ ...oldVal, ...newVal }),
    default: () => ({}),
  }),
  hrInput: Annotation<Record<string, any>>({
    reducer: (oldVal, newVal) => ({ ...oldVal, ...newVal }),
    default: () => ({}),
  }),
  manufacturingInput: Annotation<Record<string, any>>({
    reducer: (oldVal, newVal) => ({ ...oldVal, ...newVal }),
    default: () => ({}),
  }),
  constructionResult: Annotation<any>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  hrResult: Annotation<any>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  manufacturingResult: Annotation<any>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  totalPurchaseCost: Annotation<number>({
    reducer: (current, next) => (current || 0) + (next || 0),
    default: () => 0,
  }),
  requiresApproval: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
  approved: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
  status: Annotation<'pending' | 'running' | 'paused' | 'completed' | 'failed'>({
    reducer: (_, next) => next,
    default: () => 'running',
  }),
  finalResponse: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  executionTrace: Annotation<Array<{ step: string; timestamp: string; detail: string }>>({
    reducer: (oldTrace, newItems) => [...oldTrace, ...newItems],
    default: () => [],
  }),
});

export type SwarmState = typeof SwarmState.State;

import { IntelligentIntentLayer } from '../../agents/IntelligentIntentLayer';

// 2. Supervisor Node (Decomposes prompt)
async function supervisorNode(state: SwarmState): Promise<Partial<SwarmState>> {
  logger.info({ sessionId: state.sessionId, prompt: state.prompt }, '🌐 Swarm Supervisor decomposing query via Intelligent Intent Layer...');
  const intentLayer = IntelligentIntentLayer.getInstance();

  const intent = await intentLayer.classifyIntent(state.prompt);

  const departments: string[] = [...(state.departments || [])];
  let constructionInput: Record<string, any> = { ...(state.constructionInput || {}) };
  let hrInput: Record<string, any> = { ...(state.hrInput || {}) };
  let manufacturingInput: Record<string, any> = { ...(state.manufacturingInput || {}) };

  const deptUpper = (intent.department || 'CONSTRUCTION').toUpperCase();
  if (!departments.includes(deptUpper)) departments.push(deptUpper);

  const parsedParams = {
    ...intent.parameters,
    toolName: intent.toolName,
    action: intent.action,
    description: intent.reasoning || state.prompt,
  };

  if (deptUpper === 'CONSTRUCTION') constructionInput = { ...parsedParams, ...constructionInput };
  if (deptUpper === 'HR') hrInput = { ...parsedParams, ...hrInput };
  if (deptUpper === 'MANUFACTURING') manufacturingInput = { ...parsedParams, ...manufacturingInput };

  const traceItem = {
    step: `Supervisor (Dynamic Tool: ${intent.toolName})`,
    timestamp: new Date().toISOString(),
    detail: `Classified as ${deptUpper} -> Tool [${intent.toolName}] with confidence ${intent.confidence}`,
  };

  // Fallback if no specific department parsed
  if (departments.length === 0) {
    departments.push('CONSTRUCTION');
    constructionInput = { message: state.prompt };
  }

  return {
    departments,
    constructionInput,
    hrInput,
    manufacturingInput,
    executionTrace: [traceItem],
  };
}

// 3. Construction Swarm Node
async function constructionNode(state: SwarmState): Promise<Partial<SwarmState>> {
  if (!state.departments.includes('CONSTRUCTION')) return {};

  logger.info({ sessionId: state.sessionId }, '🏗️ Swarm executing Construction Node...');
  const registry = AgentRegistry.getInstance();
  const agent = registry.getAgent('construction');

  let result: any = null;
  let estimatedCost = 0;

  if (agent) {
    const res = await agent.processMessage(
      state.constructionInput.description || state.prompt,
      state.sessionId,
      state.constructionInput
    );
    result = res;

    if (res.data?.totalEstimatedCost) {
      estimatedCost = Number(res.data.totalEstimatedCost);
    }
  }

  const traceItem = {
    step: 'Construction Node',
    timestamp: new Date().toISOString(),
    detail: `Completed site project tasks. Estimated cost: $${estimatedCost.toLocaleString()}`,
  };

  return {
    constructionResult: result,
    totalPurchaseCost: estimatedCost,
    executionTrace: [traceItem],
  };
}

// 4. HR Swarm Node
async function hrNode(state: SwarmState): Promise<Partial<SwarmState>> {
  if (!state.departments.includes('HR')) return {};

  logger.info({ sessionId: state.sessionId }, '👥 Swarm executing HR Node...');
  const registry = AgentRegistry.getInstance();
  const agent = registry.getAgent('hr');

  let result: any = null;
  if (agent) {
    result = await agent.processMessage(
      state.hrInput.description || state.prompt,
      state.sessionId,
      state.hrInput
    );
  }

  const traceItem = {
    step: 'HR Node',
    timestamp: new Date().toISOString(),
    detail: `Processed workforce action: ${result?.message || 'Done'}`,
  };

  return {
    hrResult: result,
    executionTrace: [traceItem],
  };
}

// 5. Manufacturing Swarm Node
async function manufacturingNode(state: SwarmState): Promise<Partial<SwarmState>> {
  if (!state.departments.includes('MANUFACTURING')) return {};

  logger.info({ sessionId: state.sessionId }, '🏭 Swarm executing Manufacturing Node...');
  const registry = AgentRegistry.getInstance();
  const agent = registry.getAgent('manufacturing');

  let result: any = null;
  let restockCost = 0;

  if (agent) {
    result = await agent.processMessage(
      state.manufacturingInput.description || state.prompt,
      state.sessionId,
      state.manufacturingInput
    );
  }

  const qty = Number(state.manufacturingInput.quantity) || (result?.data?.quantity ? Number(result.data.quantity) : 0);
  const unitPrice = Number(state.manufacturingInput.unitCost) || (result?.data?.unitCost ? Number(result.data.unitCost) : 50);
  if (qty > 0) {
    restockCost = qty * unitPrice;
  }

  const traceItem = {
    step: 'Manufacturing Node',
    timestamp: new Date().toISOString(),
    detail: `Processed plant inventory action. Purchase value: $${restockCost.toLocaleString()}`,
  };

  return {
    manufacturingResult: result,
    totalPurchaseCost: restockCost,
    executionTrace: [traceItem],
  };
}

// 6. Approval Check Node (Human-in-the-Loop Interrupt)
async function approvalCheckNode(state: SwarmState): Promise<Partial<SwarmState>> {
  const INTERRUPT_THRESHOLD = 10000; // $10,000 threshold

  if (state.totalPurchaseCost > INTERRUPT_THRESHOLD && !state.approved) {
    logger.warn(
      { sessionId: state.sessionId, cost: state.totalPurchaseCost },
      '🛑 Human-in-the-Loop Interrupt: Cost exceeds $10,000 threshold. Pausing Swarm.'
    );

    await MongoDBSaver.saveCheckpoint(
      state.sessionId,
      state.executionTrace.length,
      state,
      'paused',
      true,
      {
        action: 'Purchase Order Approval Required',
        amount: state.totalPurchaseCost,
        description: `High-value enterprise order total ($${state.totalPurchaseCost.toLocaleString()}) exceeds human review threshold ($10,000).`,
      }
    );

    return {
      requiresApproval: true,
      status: 'paused',
      finalResponse: `🛑 **Human-in-the-Loop Review Required**: Total order cost ($${state.totalPurchaseCost.toLocaleString()}) exceeds the $10,000 review threshold. Swarm state paused in MongoDB awaiting approval.`,
    };
  }

  return { requiresApproval: false };
}

// 7. Barrier Join & Report Node
async function barrierJoinNode(state: SwarmState): Promise<Partial<SwarmState>> {
  logger.info({ sessionId: state.sessionId }, '🏁 Swarm Barrier Join: Synthesizing multi-agent results...');

  if (state.status === 'paused' || state.requiresApproval) {
    return {};
  }

  const responseLines: string[] = [
    `🌐 **LangGraph Autonomous Swarm Execution Completed (v2.x)**\n`,
  ];

  if (state.constructionResult) {
    responseLines.push(`🏗️ **Construction Execution**: ${state.constructionResult.message || 'Complete'}`);
  }
  if (state.hrResult) {
    responseLines.push(`👥 **HR Execution**: ${state.hrResult.message || 'Complete'}`);
  }
  if (state.manufacturingResult) {
    responseLines.push(`🏭 **Manufacturing Execution**: ${state.manufacturingResult.message || 'Complete'}`);
  }

  if (state.totalPurchaseCost > 0) {
    responseLines.push(`\n💰 **Total Financial Commit**: $${state.totalPurchaseCost.toLocaleString()}`);
  }

  responseLines.push(`\n⚡ **Trace Steps Executed**: ${state.executionTrace.length}`);

  const finalResponse = responseLines.join('\n');

  await MongoDBSaver.saveCheckpoint(
    state.sessionId,
    state.executionTrace.length,
    { ...state, finalResponse, status: 'completed' },
    'completed'
  );

  return {
    status: 'completed',
    finalResponse,
  };
}

// 8. Conditional Edge Router
function routeNextNode(state: SwarmState) {
  if (state.requiresApproval && !state.approved) {
    return END;
  }
  return 'barrierJoinNode';
}

// 9. Build and Compile Swarm StateGraph
const workflow = new StateGraph(SwarmState)
  .addNode('supervisorNode', supervisorNode)
  .addNode('constructionNode', constructionNode)
  .addNode('hrNode', hrNode)
  .addNode('manufacturingNode', manufacturingNode)
  .addNode('approvalCheckNode', approvalCheckNode)
  .addNode('barrierJoinNode', barrierJoinNode)
  .addEdge('__start__', 'supervisorNode')
  .addEdge('supervisorNode', 'constructionNode')
  .addEdge('supervisorNode', 'hrNode')
  .addEdge('supervisorNode', 'manufacturingNode')
  .addEdge('constructionNode', 'approvalCheckNode')
  .addEdge('hrNode', 'approvalCheckNode')
  .addEdge('manufacturingNode', 'approvalCheckNode')
  .addConditionalEdges('approvalCheckNode', routeNextNode);

export const multiAgentSwarmGraph = workflow.compile();
