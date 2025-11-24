import type { BaseTool, ToolResult } from '../../agents/types';
import { mongodb } from '../../db/mongodb';
import { z } from 'zod';

const ProjectSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    budget: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export class ProjectTrackerTool implements BaseTool {
    name = 'project_tracker';
    description = 'Create, update, and track construction projects';

    async execute(params: any): Promise<ToolResult> {
        try {
            const { action, projectId, ...data } = params;

            const db = mongodb.getDb();
            const projects = db.collection('construction_projects');

            switch (action) {
                case 'create': {
                    const validated = ProjectSchema.parse(data);
                    const result = await projects.insertOne({
                        ...validated,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        status: 'active',
                    });

                    return {
                        success: true,
                        data: {
                            projectId: result.insertedId,
                            message: `Project "${validated.name}" created successfully`,
                        },
                    };
                }

                case 'list': {
                    const allProjects = await projects.find({}).toArray();
                    return {
                        success: true,
                        data: { projects: allProjects, count: allProjects.length },
                    };
                }

                case 'get': {
                    if (!projectId) {
                        return { success: false, error: 'projectId is required' };
                    }
                    const project = await projects.findOne({ _id: projectId });
                    return {
                        success: true,
                        data: project || { message: 'Project not found' },
                    };
                }

                case 'update': {
                    if (!projectId) {
                        return { success: false, error: 'projectId is required' };
                    }
                    const result = await projects.updateOne(
                        { _id: projectId },
                        { $set: { ...data, updatedAt: new Date() } }
                    );
                    return {
                        success: true,
                        data: { modified: result.modifiedCount, message: 'Project updated' },
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Use: create, list, get, update`,
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
