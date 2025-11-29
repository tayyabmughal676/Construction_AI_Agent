import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';
import {logger} from '../../config/logger';
import {HRPolicyToolSchema} from '../../utils/validators';

// --- Expanded Mock Knowledge Base ---
const PolicyKnowledgeBase = {
    leave: {
        title: 'Leave and Time Off Policy',
        content: 'Employees are entitled to 20 paid vacation days per year, accrued monthly. Sick leave is granted up to 10 days annually with a doctor\'s note required for absences longer than 2 days. Parental leave consists of 12 weeks paid leave for the primary caregiver.',
        keywords: ['vacation', 'sick leave', 'parental leave', 'time off', 'paid time off', 'pto'],
    },
    benefits: {
        title: 'Employee Benefits Package',
        content: 'We offer a comprehensive benefits package including health, dental, and vision insurance through BlueCross. The company covers 80% of premiums for employees and 50% for dependents. Our 401(k) plan includes a company match of 50% up to 6% of your salary.',
        keywords: ['health insurance', 'dental', 'vision', '401k', 'retirement', 'insurance', 'premiums'],
    },
    conduct: {
        title: 'Code of Professional Conduct',
        content: 'All employees are expected to maintain a professional, respectful, and inclusive work environment. Harassment, discrimination, and bullying in any form are strictly prohibited and will result in disciplinary action. Please refer to the full employee handbook for detailed examples.',
        keywords: ['professionalism', 'harassment', 'discrimination', 'respect', 'bullying', 'ethics'],
    },
    wfh: {
        title: 'Work From Home Policy',
        content: 'Eligible employees may work from home up to two days per week, subject to manager approval. A dedicated and quiet workspace is required. The company provides a one-time stipend of $500 for home office setup.',
        keywords: ['wfh', 'remote work', 'work from home', 'telecommute', 'stipend'],
    },
};

type PolicyArea = keyof typeof PolicyKnowledgeBase;

export class HRPolicyTool implements BaseTool {
    name = 'hr_policy_tool';
    description = 'Answers questions about company HR policies by searching a knowledge base.';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {
                query,
                policyArea
            } = HRPolicyToolSchema.parse(params);
            logger.info({
                query,
                policyArea
            }, 'Executing HR Policy Tool');

            const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
            const areasToSearch: PolicyArea[] = policyArea && policyArea !== 'all' ? [policyArea] : Object.keys(PolicyKnowledgeBase) as PolicyArea[];


            const scoredPolicies = areasToSearch.map(area => {
                const policy = PolicyKnowledgeBase[area];
                let score = 0;
                // Score based on keyword matches
                for (const term of searchTerms) {
                    if (policy.keywords.some(kw => kw.includes(term))) {
                        score++;
                    }
                    if (policy.title.toLowerCase().includes(term)) {
                        score += 2; // Higher weight for title matches
                    }
                }
                return {
                    area,
                    title: policy.title,
                    content: policy.content,
                    score
                };
            }).filter(p => p.score > 0);

            // Sort by score in descending order
            scoredPolicies.sort((a, b) => b.score - a.score);

            if (scoredPolicies.length === 0) {
                return {
                    success: true,
                    data: {
                        message: "I couldn't find any specific policy information for your query. Could you try rephrasing or being more specific?",
                        foundPolicies: [],
                    },
                };
            }

            return {
                success: true,
                data: {
                    message: `I found ${scoredPolicies.length} relevant policy document(s).`,
                    foundPolicies: scoredPolicies,
                },
            };

        } catch (error) {
            logger.error({
                error
            }, 'Error in HR Policy Tool');
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
