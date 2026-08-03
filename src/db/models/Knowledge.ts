import { z } from 'zod';

export const KnowledgeSchema = z.object({
  id: z.string().optional(),
  category: z.enum(['hr_policies', 'construction_sops', 'manufacturing_sops', 'corporate_schedules']),
  department: z.enum(['HR', 'CONSTRUCTION', 'MANUFACTURING', 'ENTERPRISE']),
  title: z.string().min(3),
  content: z.string().min(10),
  tags: z.array(z.string()).default([]),
  updatedAt: z.date().optional(),
});

export type KnowledgeDoc = z.infer<typeof KnowledgeSchema>;
