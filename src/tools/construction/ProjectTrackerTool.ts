import type {BaseTool, ToolResult} from '../../agents/types';
import {mongodb} from '../../db/mongodb';
import {z} from 'zod';
import {ObjectId} from 'mongodb';
import {CreateProjectToolSchema, UpdateProjectToolSchema} from '../../utils/validators';

const ActionSchema = z.object({
    action: z.enum(['create', 'list', 'get', 'update']),
});

export class ProjectTrackerTool implements BaseTool {
    name = 'project_tracker';
    description = 'Create, list, get, and update construction projects.';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {
                action
            } = ActionSchema.parse(params);
            const collection = mongodb.getDb().collection('construction_projects');

            switch (action) {
                case 'create':
                    {
                        const data = CreateProjectToolSchema.parse(params);
                        const result = await collection.insertOne({
                            ...data,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            status: 'active'
                        });
                        return {
                            success: true,
                            data: {
                                projectId: result.insertedId,
                                message: `Project "${data.name}" created.`
                            },
                        };
                    }

                case 'list':
                    {
                        const projects = await collection.find({}).sort({
                            createdAt: -1
                        }).toArray();
                        return {
                            success: true,
                            data: {
                                projects,
                                count: projects.length
                            }
                        };
                    }

                case 'get':
                    {
                        const {
                            projectId
                        } = z.object({
                            projectId: z.string()
                        }).parse(params);
                        const project = await collection.findOne({
                            _id: new ObjectId(projectId)
                        });
                        if (!project) return {
                            success: false,
                            error: `Project with ID "${projectId}" not found.`
                        };
                        return {
                            success: true,
                            data: project
                        };
                    }

                case 'update':
                    {
                        const {
                            projectId,
                            ...updateData
                        } = UpdateProjectToolSchema.parse(params);
                        if (Object.keys(updateData).length === 0) {
                            return {
                                success: false,
                                error: 'No fields to update were provided.'
                            };
                        }
                        const result = await collection.updateOne({
                            _id: new ObjectId(projectId)
                        }, {
                            $set: { ...updateData,
                                updatedAt: new Date()
                            }
                        });
                        if (result.matchedCount === 0) {
                            return {
                                success: false,
                                error: `Project with ID "${projectId}" not found.`
                            };
                        }
                        return {
                            success: true,
                            data: {
                                message: `Project "${projectId}" updated.`
                            },
                        };
                    }
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    error: 'Validation failed',
                    details: error.flatten()
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred.'
            };
        }
    }
}
