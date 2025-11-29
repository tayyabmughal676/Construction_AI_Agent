import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';

const TaskSchema = z.object({
    name: z.string(),
    duration: z.number().positive('Duration must be a positive number.'), // in days
    dependencies: z.array(z.string()).optional().default([]),
});

const TimelineSchema = z.object({
    projectName: z.string(),
    tasks: z.array(TaskSchema),
    startDate: z.string().datetime({
        message: 'Invalid start date format.'
    }).optional(),
});

export class TimelineEstimatorTool implements BaseTool {
    name = 'timeline_estimator';
    description = 'Estimate project timelines based on tasks and dependencies';

    async execute(params: any): Promise<ToolResult> {
        try {
            const validated = TimelineSchema.parse(params);

            const startDate = validated.startDate ?
                new Date(validated.startDate) :
                new Date();

            // Simple timeline calculation (no dependency graph for now)
            const timeline = validated.tasks.map((task, index) => {
                const taskStart = new Date(startDate);

                // Calculate offset by summing durations of all preceding tasks
                const daysOffset = validated.tasks
                    .slice(0, index)
                    .reduce((sum, prevTask) => sum + prevTask.duration, 0);

                taskStart.setDate(taskStart.getDate() + daysOffset);

                const taskEnd = new Date(taskStart);
                taskEnd.setDate(taskEnd.getDate() + task.duration);

                return {
                    task: task.name,
                    duration: task.duration,
                    startDate: taskStart.toISOString().split('T')[0],
                    endDate: taskEnd.toISOString().split('T')[0],
                    dependencies: task.dependencies,
                };
            });

            const totalDuration = validated.tasks.reduce((sum, task) => sum + task.duration, 0);
            const projectEnd = new Date(startDate);
            projectEnd.setDate(projectEnd.getDate() + totalDuration);

            return {
                success: true,
                data: {
                    projectName: validated.projectName,
                    startDate: startDate.toISOString().split('T')[0],
                    estimatedEndDate: projectEnd.toISOString().split('T')[0],
                    totalDuration: totalDuration,
                    totalDurationUnit: 'days',
                    timeline,
                    taskCount: validated.tasks.length,
                },
            };
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
                error: error instanceof Error ? error.message : 'An unknown error occurred.',
            };
        }
    }
}
