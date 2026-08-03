import { describe, expect, it } from 'bun:test';
import { KnowledgeBaseTool } from '../../src/tools/utils/KnowledgeBaseTool';

describe('KnowledgeBaseTool (Issa Group Enterprise Knowledge Store)', () => {
  const tool = new KnowledgeBaseTool();

  it('should have correct name and description', () => {
    expect(tool.name).toBe('company_knowledge_base');
    expect(tool.description).toContain('Issa Group');
  });

  it('should search policies by keyword query', async () => {
    const result = await tool.execute({ query: 'WFH policy stipend' });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.articles.length).toBeGreaterThan(0);
  });

  it('should fetch policy articles by category', async () => {
    const result = await tool.execute({ action: 'get_by_category', category: 'construction_sops' });
    expect(result.success).toBe(true);
    expect(result.data.category).toBe('construction_sops');
  });

  it('should list all knowledge base articles', async () => {
    const result = await tool.execute({ action: 'list_all' });
    expect(result.success).toBe(true);
    expect(result.data.count).toBeGreaterThan(0);
  });
});
