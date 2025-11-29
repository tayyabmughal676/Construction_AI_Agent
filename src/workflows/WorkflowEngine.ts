import {logger} from '../config/logger';
import type {StepResult, Workflow, WorkflowOptions, WorkflowResult, WorkflowState, WorkflowStep,} from './types';
import {randomUUID} from 'crypto';

/**
 * Workflow Engine
 * Executes multi-step workflows with state management
 */
export class WorkflowEngine {
    /**
     * Execute a workflow
     */
    static async execute(
        workflow: Workflow,
        options: WorkflowOptions
    ): Promise<WorkflowResult> {
        const startTime = Date.now();
        const workflowId = randomUUID();

        // Initialize workflow state
        const state: WorkflowState = {
            workflowId,
            sessionId: options.sessionId,
            currentStep: 0,
            totalSteps: workflow.steps.length,
            status: 'running',
            data: options.context || {},
            results: [],
            errors: [],
            startedAt: new Date(),
        };

        logger.info({
            workflowId,
            workflowName: workflow.name,
            totalSteps: workflow.steps.length,
        }, 'Starting workflow execution');

        let stepsCompleted = 0;

        try {
            // Execute each step
            for (let i = 0; i < workflow.steps.length; i++) {
                const step = workflow.steps[i];
                state.currentStep = i + 1;

                logger.info({
                    workflowId,
                    step: state.currentStep,
                    stepName: step.name,
                }, 'Executing workflow step');

                try {
                    // Check condition if exists
                    if (step.condition && !step.condition(state)) {
                        logger.info({
                            workflowId,
                            step: state.currentStep,
                            stepName: step.name,
                        }, 'Skipping step due to condition');
                        continue;
                    }

                    // Execute step
                    const result = await this.executeStep(step, state);

                    if (result.success) {
                        state.results.push(result.data);
                        stepsCompleted++;

                        logger.info({
                            workflowId,
                            step: state.currentStep,
                            stepName: step.name,
                        }, 'Step completed successfully');
                    } else {
                        state.errors.push(`Step ${i + 1} (${step.name}): ${result.error}`);

                        logger.error({
                            workflowId,
                            step: state.currentStep,
                            stepName: step.name,
                            error: result.error,
                        }, 'Step failed');

                        // Handle error
                        if (step.onError) {
                            await step.onError(new Error(result.error || 'Unknown error'), state);
                        }

                        // Stop if not continuing on error
                        if (!options.continueOnError) {
                            state.status = 'failed';
                            break;
                        }
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    state.errors.push(`Step ${i + 1} (${step.name}): ${errorMessage}`);

                    logger.error({
                        workflowId,
                        step: state.currentStep,
                        stepName: step.name,
                        error,
                    }, 'Step execution error');

                    // Handle error
                    if (step.onError) {
                        await step.onError(error as Error, state);
                    }

                    // Stop if not continuing on error
                    if (!options.continueOnError) {
                        state.status = 'failed';
                        break;
                    }
                }
            }

            // Determine final status
            if (state.status !== 'failed') {
                state.status = state.errors.length === 0 ? 'completed' : 'completed';
            }

            state.completedAt = new Date();

            const executionTime = Date.now() - startTime;

            logger.info({
                workflowId,
                workflowName: workflow.name,
                status: state.status,
                stepsCompleted,
                totalSteps: workflow.steps.length,
                executionTime,
            }, 'Workflow execution completed');

            // Build result
            return {
                workflowId,
                workflowName: workflow.name,
                sessionId: options.sessionId,
                success: state.status === 'completed' && state.errors.length === 0,
                status: state.errors.length === 0 ? 'completed' : (stepsCompleted > 0 ? 'partial' : 'failed'),
                message: this.buildResultMessage(workflow, state, stepsCompleted),
                results: state.results,
                errors: state.errors,
                executionTime,
                stepsCompleted,
                totalSteps: workflow.steps.length,
            };

        } catch (error) {
            logger.error({
                workflowId,
                workflowName: workflow.name,
                error,
            }, 'Workflow execution failed');

            return {
                workflowId,
                workflowName: workflow.name,
                sessionId: options.sessionId,
                success: false,
                status: 'failed',
                message: `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                results: state.results,
                errors: state.errors,
                executionTime: Date.now() - startTime,
                stepsCompleted,
                totalSteps: workflow.steps.length,
            };
        }
    }

    /**
     * Execute a single workflow step
     */
    private static async executeStep(
        step: WorkflowStep,
        state: WorkflowState
    ): Promise<StepResult> {
        try {
            return await step.action(state);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Build result message
     */
    private static buildResultMessage(
        workflow: Workflow,
        state: WorkflowState,
        stepsCompleted: number
    ): string {
        if (state.status === 'completed' && state.errors.length === 0) {
            return `✅ ${workflow.name} completed successfully! (${stepsCompleted}/${workflow.steps.length} steps)`;
        } else if (stepsCompleted > 0) {
            return `⚠️ ${workflow.name} partially completed (${stepsCompleted}/${workflow.steps.length} steps). ${state.errors.length} error(s).`;
        } else {
            return `❌ ${workflow.name} failed. ${state.errors.length} error(s).`;
        }
    }
}
