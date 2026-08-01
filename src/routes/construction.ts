import { Elysia } from 'elysia';
import { z } from 'zod';
import { ConstructionAgent } from '../agents/ConstructionAgent';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { ChatRequestSchema, ToolExecutionRequestSchema } from '../utils/validators';
import { AgentRegistry } from '../agents/AgentRegistry'; // Added import for AgentRegistry

const constructionRouter = new Elysia();

import { mongodb } from '../db/mongodb';

/**
 * GET /api/construction/projects
 * Returns active and pending construction projects.
 */
constructionRouter.get('/projects', async (c) => {
    try {
        const db = mongodb.getDb();
        const rawProjects = await db.collection('projects').find({}).toArray();

        const projects = rawProjects.map((p: any) => ({
            id: p.projectId || p._id.toString(),
            projectId: p.projectId || 'PRJ-' + p._id.toString().substring(0, 4),
            name: p.name || 'Unnamed Project',
            description: p.description || '',
            location: p.location || 'Site Alpha',
            budget: typeof p.budget === 'number' ? `$${(p.budget / 1000000).toFixed(1)}M` : String(p.budget || '$0'),
            rawBudget: typeof p.budget === 'number' ? p.budget : 1000000,
            progress: p.progress || 0,
            status: p.status === 'active' || p.status === 'On Track' ? 'On Track' : p.status === 'completed' || p.status === 'Finished' ? 'Finished' : 'Planned',
            startDate: p.startDate || new Date().toISOString()
        }));

        return { projects };
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/construction/projects');
        c.set.status = 500;
        return { error: 'Internal server error' };
    }
});

/**
 * POST /api/construction/projects
 * Create a new construction project.
 */
constructionRouter.post('/projects', async (c) => {
    try {
        const body = (c.body as any) || await c.request.clone().json();
        const db = mongodb.getDb();

        const newProject = {
            projectId: body.projectId || `PRJ-${Date.now().toString().slice(-4)}`,
            name: body.name || 'New Site Development',
            description: body.description || 'Commercial construction project',
            location: body.location || 'Site Alpha',
            budget: Number(body.budget) || 2500000,
            progress: Number(body.progress) || 0,
            status: body.status || 'active',
            startDate: body.startDate || new Date().toISOString(),
            createdAt: new Date()
        };

        const result = await db.collection('projects').insertOne(newProject);
        return { success: true, project: { ...newProject, _id: result.insertedId } };
    } catch (error) {
        logger.error({ error }, 'Error in POST /api/construction/projects');
        c.set.status = 500;
        return { error: 'Failed to create project' };
    }
});

/**
 * PUT /api/construction/projects/:id
 * Update an existing project.
 */
constructionRouter.put('/projects/:id', async (c) => {
    try {
        const { id } = c.params;
        const body = (c.body as any) || await c.request.clone().json();
        const db = mongodb.getDb();

        const updateData: any = {};
        if (body.name) updateData.name = body.name;
        if (body.description) updateData.description = body.description;
        if (body.location) updateData.location = body.location;
        if (body.budget !== undefined) updateData.budget = Number(body.budget);
        if (body.progress !== undefined) updateData.progress = Number(body.progress);
        if (body.status) updateData.status = body.status;
        updateData.updatedAt = new Date();

        await db.collection('projects').updateOne(
            { $or: [{ projectId: id }, { _id: id as any }] },
            { $set: updateData }
        );

        return { success: true, message: 'Project updated successfully' };
    } catch (error) {
        logger.error({ error }, 'Error in PUT /api/construction/projects');
        c.set.status = 500;
        return { error: 'Failed to update project' };
    }
});

/**
 * DELETE /api/construction/projects/:id
 * Delete a project.
 */
constructionRouter.delete('/projects/:id', async (c) => {
    try {
        const { id } = c.params;
        const db = mongodb.getDb();

        await db.collection('projects').deleteOne({
            $or: [{ projectId: id }, { _id: id as any }]
        });

        return { success: true, message: 'Project deleted successfully' };
    } catch (error) {
        logger.error({ error }, 'Error in DELETE /api/construction/projects');
        c.set.status = 500;
        return { error: 'Failed to delete project' };
    }
});

const agent = new ConstructionAgent();

// --- Endpoints ---

/**
 * Main chat endpoint for the Construction Agent.
 */
constructionRouter.post('/chat', async (c) => {
    try {
        const body = (c.body as any) || await c.request.clone().json();
        const {
            message,
            sessionId,
            context
        } = ChatRequestSchema.parse(body);

        const response = await agent.processMessage(
            message,
            sessionId || randomUUID(),
            context
        );

        return response;
    } catch (error) {
        logger.error({
            error
        }, 'Error in construction chat endpoint');
        if (error instanceof z.ZodError) {
            c.set.status = 400;
            return {
                error: 'Validation failed',
                details: error.flatten()
            };
        }
        c.set.status = 500;
        return {
            error: 'An internal error occurred'
        };
    }
});

/**
 * Provides a detailed list of the agent's capabilities.
 */
constructionRouter.get('/capabilities', (c) => {
    return {
        department: agent.name,
        description: agent.description,
        tools: agent.getTools().map(tool => ({
            name: tool.name,
            description: tool.description,
        })),
    };
});

/**
 * Allows for direct execution of a specific tool by name.
 */
constructionRouter.post('/tools/:toolName', async (c) => {
    try {
        const toolName = c.params.toolName;
        const params = (c.body as any) || await c.request.clone().json();

        const {
            params: validatedParams
        } = ToolExecutionRequestSchema.parse({
            toolName,
            params
        });

        const result = await agent.executeTool(toolName, validatedParams);

        if (!result.success) {
            c.set.status = 400;
            return result;
        }
        return result;
    } catch (error) {
        logger.error({
            error
        }, 'Error executing tool directly');
        if (error instanceof z.ZodError) {
            c.set.status = 400;
            return {
                error: 'Validation failed',
                details: error.flatten()
            };
        }
        c.set.status = 500;
        return {
            success: false,
            error: 'An internal error occurred'
        };
    }
});

export default constructionRouter;
