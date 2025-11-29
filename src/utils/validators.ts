import {z} from 'zod';

/**
 * A collection of reusable Zod schemas for validating common data structures
 * across the application. This promotes consistency and reduces code duplication.
 */

// --- Base Schemas ---

export const UUIDSchema = z.string().uuid('Invalid UUID format.');

export const NameSchema = z.string().min(2, 'Name must be at least 2 characters long.');

// --- Route-Specific Schemas ---

/**
 * Schema for standard chat requests.
 */
export const ChatRequestSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty.'),
    sessionId: UUIDSchema.optional(),
    context: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for chat requests that support department-based routing.
 */
export const RoutedChatRequestSchema = ChatRequestSchema.extend({
    department: z.string().optional(),
});

/**
 * Schema for direct tool execution requests.
 */
export const ToolExecutionRequestSchema = z.object({
    toolName: z.string().min(1, 'Tool name is required.'),
    params: z.record(z.string(), z.unknown()).optional(),
});


// --- Tool-Specific Schemas ---

/**
 * Schema for creating a new project in the ProjectTrackerTool.
 */
export const CreateProjectToolSchema = z.object({
    action: z.literal('create'),
    name: NameSchema,
    description: z.string().optional(),
    budget: z.number().positive('Budget must be a positive number.').optional(),
    startDate: z.string().datetime({
        message: 'Invalid start date format.'
    }).optional(),
});

/**
 * Schema for updating a project in the ProjectTrackerTool.
 */
export const UpdateProjectToolSchema = z.object({
    action: z.literal('update'),
    projectId: UUIDSchema,
    name: NameSchema.optional(),
    description: z.string().optional(),
    budget: z.number().positive('Budget must be a positive number.').optional(),
    status: z.enum(['active', 'completed', 'on_hold']).optional(),
});

/**
 * Schema for HR policy inquiries.
 */
export const HRPolicyToolSchema = z.object({
    query: z.string().min(3, 'Query must be at least 3 characters long.'),
    policyArea: z.enum(['leave', 'benefits', 'conduct', 'wfh', 'all']).optional(),
});
