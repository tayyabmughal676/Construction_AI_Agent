import type {BaseTool, ToolResult} from '../../agents/types';
import {mongodb} from '../../db/mongodb';
import {z} from 'zod';

const GoalSchema = z.object({
    employeeId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    category: z.enum(['individual', 'team', 'company']).optional().default('individual'),
    dueDate: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).optional().default('not_started'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
});

const ReviewSchema = z.object({
    employeeId: z.string(),
    reviewerId: z.string(),
    reviewType: z.enum(['quarterly', 'annual', 'probation', 'project']),
    rating: z.number().min(1).max(5),
    strengths: z.string().optional(),
    areasForImprovement: z.string().optional(),
    comments: z.string().optional(),
    reviewDate: z.string().optional(),
});

const FeedbackSchema = z.object({
    employeeId: z.string(),
    fromEmployeeId: z.string(),
    feedbackType: z.enum(['positive', 'constructive', 'peer_review']),
    message: z.string(),
    anonymous: z.boolean().optional().default(false),
});

export class PerformanceTrackerTool implements BaseTool {
    name = 'performance_tracker';
    description = 'Track employee performance - goals, reviews, and feedback';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {action, goalId, reviewId, feedbackId, employeeId, ...data} = params;

            const db = mongodb.getDb();
            const goals = db.collection('performance_goals');
            const reviews = db.collection('performance_reviews');
            const feedback = db.collection('performance_feedback');

            switch (action) {
                // ===== GOALS =====
                case 'create_goal': {
                    const validated = GoalSchema.parse({employeeId, ...data});

                    const result = await goals.insertOne({
                        ...validated,
                        progress: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            goalId: result.insertedId,
                            message: `Goal "${validated.title}" created successfully`,
                        },
                    };
                }

                case 'update_goal': {
                    if (!goalId) {
                        return {success: false, error: 'goalId is required'};
                    }

                    const result = await goals.updateOne(
                        {_id: goalId},
                        {$set: {...data, updatedAt: new Date()}}
                    );

                    if (result.matchedCount === 0) {
                        return {success: false, error: 'Goal not found'};
                    }

                    return {
                        success: true,
                        data: {
                            modified: result.modifiedCount,
                            message: 'Goal updated successfully',
                        },
                    };
                }

                case 'list_goals': {
                    const {status, category, limit = 50} = data;
                    const filter: any = {};

                    if (employeeId) filter.employeeId = employeeId;
                    if (status) filter.status = status;
                    if (category) filter.category = category;

                    const allGoals = await goals
                        .find(filter)
                        .sort({createdAt: -1})
                        .limit(limit)
                        .toArray();

                    const summary = {
                        total: allGoals.length,
                        completed: allGoals.filter(g => g.status === 'completed').length,
                        inProgress: allGoals.filter(g => g.status === 'in_progress').length,
                        notStarted: allGoals.filter(g => g.status === 'not_started').length,
                        blocked: allGoals.filter(g => g.status === 'blocked').length,
                    };

                    return {
                        success: true,
                        data: {
                            goals: allGoals,
                            summary,
                        },
                    };
                }

                // ===== REVIEWS =====
                case 'create_review': {
                    const validated = ReviewSchema.parse({employeeId, ...data});

                    const result = await reviews.insertOne({
                        ...validated,
                        reviewDate: validated.reviewDate || new Date().toISOString(),
                        createdAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            reviewId: result.insertedId,
                            rating: validated.rating,
                            message: `${validated.reviewType} review created with rating ${validated.rating}/5`,
                        },
                    };
                }

                case 'list_reviews': {
                    const {reviewType, limit = 20} = data;
                    const filter: any = {};

                    if (employeeId) filter.employeeId = employeeId;
                    if (reviewType) filter.reviewType = reviewType;

                    const allReviews = await reviews
                        .find(filter)
                        .sort({reviewDate: -1})
                        .limit(limit)
                        .toArray();

                    const averageRating = allReviews.length > 0
                        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
                        : 0;

                    return {
                        success: true,
                        data: {
                            reviews: allReviews,
                            count: allReviews.length,
                            averageRating: Math.round(averageRating * 10) / 10,
                        },
                    };
                }

                case 'get_review': {
                    if (!reviewId) {
                        return {success: false, error: 'reviewId is required'};
                    }

                    const review = await reviews.findOne({_id: reviewId});

                    if (!review) {
                        return {success: false, error: 'Review not found'};
                    }

                    return {
                        success: true,
                        data: review,
                    };
                }

                // ===== FEEDBACK =====
                case 'submit_feedback': {
                    const validated = FeedbackSchema.parse({employeeId, ...data});

                    const result = await feedback.insertOne({
                        ...validated,
                        createdAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            feedbackId: result.insertedId,
                            message: 'Feedback submitted successfully',
                            anonymous: validated.anonymous,
                        },
                    };
                }

                case 'list_feedback': {
                    const {feedbackType, limit = 50} = data;
                    const filter: any = {};

                    if (employeeId) filter.employeeId = employeeId;
                    if (feedbackType) filter.feedbackType = feedbackType;

                    const allFeedback = await feedback
                        .find(filter)
                        .sort({createdAt: -1})
                        .limit(limit)
                        .toArray();

                    // Hide fromEmployeeId for anonymous feedback
                    const sanitized = allFeedback.map(f => ({
                        ...f,
                        fromEmployeeId: f.anonymous ? 'Anonymous' : f.fromEmployeeId,
                    }));

                    return {
                        success: true,
                        data: {
                            feedback: sanitized,
                            count: sanitized.length,
                        },
                    };
                }

                // ===== SUMMARY =====
                case 'summary': {
                    if (!employeeId) {
                        return {success: false, error: 'employeeId is required'};
                    }

                    const employeeGoals = await goals.find({employeeId}).toArray();
                    const employeeReviews = await reviews.find({employeeId}).toArray();
                    const employeeFeedback = await feedback.find({employeeId}).toArray();

                    const goalsSummary = {
                        total: employeeGoals.length,
                        completed: employeeGoals.filter(g => g.status === 'completed').length,
                        inProgress: employeeGoals.filter(g => g.status === 'in_progress').length,
                    };

                    const averageRating = employeeReviews.length > 0
                        ? employeeReviews.reduce((sum, r) => sum + r.rating, 0) / employeeReviews.length
                        : 0;

                    return {
                        success: true,
                        data: {
                            employeeId,
                            goals: goalsSummary,
                            reviews: {
                                total: employeeReviews.length,
                                averageRating: Math.round(averageRating * 10) / 10,
                                latestReview: employeeReviews[0] || null,
                            },
                            feedback: {
                                total: employeeFeedback.length,
                                positive: employeeFeedback.filter(f => f.feedbackType === 'positive').length,
                                constructive: employeeFeedback.filter(f => f.feedbackType === 'constructive').length,
                            },
                        },
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Use: create_goal, update_goal, list_goals, create_review, list_reviews, get_review, submit_feedback, list_feedback, summary`,
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
