import type { BaseTool, ToolResult } from '../../agents/types';
import { mongodb } from '../../db/mongodb';
import { logger } from '../../config/logger';

const FALLBACK_ARTICLES = [
  {
    title: 'Issa Group Hybrid & Work From Home (WFH) Policy',
    category: 'hr_policies',
    department: 'HR',
    content: 'Issa Group eligible full-time employees may work remotely up to two days per week. The company provides a one-time stipend of $500 for home office ergonomics and hardware setup.',
    tags: ['wfh', 'remote', 'policy', 'stipend'],
  },
  {
    title: 'Issa Site Personal Protective Equipment (PPE) Standard',
    category: 'construction_sops',
    department: 'CONSTRUCTION',
    content: 'All active Issa Construction sites require 100% PPE compliance: ANSI Z89.1 Hard Hats, High-Visibility Vests, ASTM Steel-Toe Boots (Grade 75), and Safety Eyewear.',
    tags: ['ppe', 'safety', 'construction', 'boots'],
  },
  {
    title: 'Issa ISO 9001 Structural Steel Quality Control SOP',
    category: 'manufacturing_sops',
    department: 'MANUFACTURING',
    content: 'Fabrication of structural steel beams (STEEL-001) must adhere to ISO 9001 quality standards with a minimum 98.5% batch pass rate.',
    tags: ['iso9001', 'qc', 'manufacturing', 'steel'],
  },
];

export class KnowledgeBaseTool implements BaseTool {
  name = 'company_knowledge_base';
  description = 'Search and query corporate policies, HR benefits, OSHA site safety SOPs, and manufacturing quality standards for Issa Group';

  async execute(params: any): Promise<ToolResult> {
    try {
      const action = params?.action || 'search';
      const query = params?.query || params?.search || params?.message || '';
      const category = params?.category;

      let docs: any[] = [];
      try {
        const db = mongodb.getDb();
        if (db) {
          const collection = db.collection('knowledge');
          if (action === 'get_by_category' && category) {
            docs = await collection.find({ category }).toArray();
          } else if (action === 'list_all' || (!query && !category)) {
            docs = await collection.find({}).limit(20).toArray();
          } else {
            const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            docs = await collection
              .find({
                $or: [
                  { title: regex },
                  { content: regex },
                  { tags: regex },
                  { category: regex },
                ],
              })
              .limit(10)
              .toArray();
          }
        }
      } catch {
        docs = [];
      }

      if (docs.length === 0) {
        docs = category
          ? FALLBACK_ARTICLES.filter(a => a.category === category)
          : FALLBACK_ARTICLES;
      }

      logger.info({ query, matchCount: docs.length }, 'KnowledgeBaseTool queried successfully');

      return {
        success: true,
        data: {
          query,
          category,
          count: docs.length,
          articles: docs.map((d: any) => ({
            title: d.title,
            category: d.category,
            department: d.department,
            content: d.content,
            tags: d.tags,
          })),
        },
      };
    } catch (error) {
      logger.error({ error }, 'KnowledgeBaseTool execution failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Knowledge Base search failed',
      };
    }
  }
}
