import { describe, expect, it } from 'bun:test';
import { multiAgentSwarmGraph } from '../../src/workflows/langgraph/MultiAgentSwarmGraph';
import { MongoDBSaver } from '../../src/workflows/langgraph/MongoDBSaver';

describe('LangGraph Autonomous Swarm Engine (v2.x)', () => {
  it('should compile and expose StateGraph nodes', () => {
    expect(multiAgentSwarmGraph).toBeDefined();
  });

  it('should save and retrieve checkpoints from MongoDB saver', async () => {
    const sessionId = `test_session_${Date.now()}`;
    const checkpointId = await MongoDBSaver.saveCheckpoint(
      sessionId,
      1,
      { prompt: 'Test swarm prompt' },
      'running'
    );

    expect(checkpointId).toContain(sessionId);

    const retrieved = await MongoDBSaver.getCheckpoint(sessionId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.sessionId).toBe(sessionId);
  });

  it('should execute multi-agent swarm graph for multi-department prompts', async () => {
    const sessionId = `swarm_run_${Date.now()}`;
    const result = await multiAgentSwarmGraph.invoke({
      sessionId,
      prompt: 'Onboard Sarah as an engineer and calculate site material costs for concrete',
      departments: [],
      totalPurchaseCost: 0,
      requiresApproval: false,
      approved: false,
      status: 'running',
      executionTrace: [],
    });

    expect(result.sessionId).toBe(sessionId);
    expect(result.executionTrace.length).toBeGreaterThan(0);
    expect(result.finalResponse).toBeDefined();
  });

  it('should pause graph execution when purchase order exceeds $10,000 interrupt threshold', async () => {
    const sessionId = `interrupt_run_${Date.now()}`;
    const result = await multiAgentSwarmGraph.invoke({
      sessionId,
      prompt: 'Order 1000 steel beams for factory assembly',
      departments: ['MANUFACTURING'],
      manufacturingInput: { quantity: 1000, unitCost: 50 }, // 1000 * 50 = $50,000 > $10,000
      totalPurchaseCost: 0,
      requiresApproval: false,
      approved: false,
      status: 'running',
      executionTrace: [],
    });

    expect(result.requiresApproval).toBe(true);
    expect(result.status).toBe('paused');
    expect(result.totalPurchaseCost).toBeGreaterThan(10000);
  });
});
