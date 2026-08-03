import { Elysia, t } from 'elysia';
import { multiAgentSwarmGraph } from '../workflows/langgraph/MultiAgentSwarmGraph';
import { MongoDBSaver } from '../workflows/langgraph/MongoDBSaver';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';

export const v2graphRouter = new Elysia({ prefix: '/api/v2/graph' })
  /**
   * POST /api/v2/graph/chat
   * Main v2.x LangGraph Autonomous Multi-Agent Swarm Endpoint
   */
  .post(
    '/chat',
    async (c) => {
      try {
        const body = c.body as { message: string; sessionId?: string };
        const prompt = body.message || 'Show enterprise status across departments';
        const sessionId = body.sessionId || `session_${randomUUID()}`;

        logger.info({ sessionId, prompt }, '🌐 Initiating LangGraph v2.x Autonomous Swarm execution...');

        // Initial StateGraph Invocation
        const initialInputs = {
          sessionId,
          prompt,
          departments: [],
          totalPurchaseCost: 0,
          requiresApproval: false,
          approved: false,
          status: 'running' as const,
          executionTrace: [],
        };

        const result = await multiAgentSwarmGraph.invoke(initialInputs);

        return {
          success: true,
          engine: 'LangGraph Autonomous Swarm v2.x',
          sessionId,
          status: result.status,
          requiresApproval: result.requiresApproval,
          totalPurchaseCost: result.totalPurchaseCost,
          finalResponse: result.finalResponse,
          executionTrace: result.executionTrace,
          departments: result.departments,
        };
      } catch (error) {
        logger.error({ error }, 'v2.x Swarm Graph Execution Error');
        c.set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Swarm Graph Execution Failed',
        };
      }
    },
    {
      body: t.Object({
        message: t.String(),
        sessionId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * POST /api/v2/graph/approve
   * Approves a paused checkpoint and resumes graph execution
   */
  .post(
    '/approve',
    async (c) => {
      try {
        const body = c.body as { sessionId: string };
        const { sessionId } = body;

        logger.info({ sessionId }, '👍 Human approval received! Resuming LangGraph Swarm checkpoint...');

        const approvedRecord = await MongoDBSaver.approveCheckpoint(sessionId);

        if (!approvedRecord) {
          c.set.status = 404;
          return { success: false, error: `No paused checkpoint found for session ${sessionId}` };
        }

        // Resume Swarm execution with approved flag set to true
        const resumedInputs = {
          ...approvedRecord.state,
          approved: true,
          requiresApproval: false,
          status: 'running' as const,
        };

        const result = await multiAgentSwarmGraph.invoke(resumedInputs);

        return {
          success: true,
          engine: 'LangGraph Autonomous Swarm v2.x (Resumed)',
          sessionId,
          status: result.status,
          approved: true,
          finalResponse: result.finalResponse,
          executionTrace: result.executionTrace,
        };
      } catch (error) {
        logger.error({ error }, 'v2.x Swarm Resume Error');
        c.set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to approve and resume checkpoint',
        };
      }
    },
    {
      body: t.Object({
        sessionId: t.String(),
      }),
    }
  )

  /**
   * GET /api/v2/graph/checkpoint/:sessionId
   * Fetches active MongoDB checkpoint
   */
  .get('/checkpoint/:sessionId', async (c) => {
    const { sessionId } = c.params;
    const checkpoint = await MongoDBSaver.getCheckpoint(sessionId);

    if (!checkpoint) {
      c.set.status = 404;
      return { success: false, error: 'Checkpoint not found' };
    }

    return { success: true, checkpoint };
  })

  /**
   * GET /api/v2/graph/pending-approvals
   * Fetches list of paused checkpoints waiting for human approval
   */
  .get('/pending-approvals', async () => {
    const approvals = await MongoDBSaver.getPendingApprovals();
    return { success: true, count: approvals.length, approvals };
  });
