import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';

const TaskSchema = z.object({
    name: z.string(),
    duration: z.number(), // in days
    dependencies: z.array(z.string()).optional().default([]),
});

const TimelineSchema = z.object({
    projectName: z.string(),
    tasks: z.array(TaskSchema),
    startDate: z.string().optional(),
});

export class TimelineEstimatorTool implements BaseTool {
    name = 'timeline_estimator';
    description = 'Estimate project timelines based on tasks and dependencies';

    async execute(params: any): Promise<ToolResult> {
        try {
            const validated = TimelineSchema.parse(params);

            const startDate = validated.startDate
                ? new Date(validated.startDate)
                : new Date();

            // Simple timeline calculation (no dependency graph for now)
            const timeline = validated.tasks.map((task, index) => {
                const taskStart = new Date(startDate);

                // Calculate start date based on previous tasks
                let daysOffset = 0;
                for (let i = 0; i < index; i++) {
                    daysOffset += validated.tasks[i].duration;
                }
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
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
