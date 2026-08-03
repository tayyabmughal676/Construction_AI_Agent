import { AgentRegistry } from './AgentRegistry';
import type { BaseAgent } from './BaseAgent';
import { GroqService } from '../services/groq';
import { logger } from '../config/logger';

export interface ParsedSwarmIntent {
  department: 'CONSTRUCTION' | 'HR' | 'MANUFACTURING' | 'SYSTEM';
  toolName: string;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  reasoning: string;
}

export class IntelligentIntentLayer {
  private static instance: IntelligentIntentLayer;

  static getInstance(): IntelligentIntentLayer {
    if (!IntelligentIntentLayer.instance) {
      IntelligentIntentLayer.instance = new IntelligentIntentLayer();
    }
    return IntelligentIntentLayer.instance;
  }

  /**
   * Harvest live tool schemas dynamically from AgentRegistry
   */
  private buildToolCatalogPrompt(): { catalogPrompt: string; toolCount: number } {
    const registry = AgentRegistry.getInstance();
    const agentsMap = registry.getAllAgents();

    const catalogLines: string[] = [];
    let toolCount = 0;

    for (const [dept, agent] of agentsMap.entries()) {
      const tools = agent.getTools();
      const toolDescriptions = tools.map((t) => `- ${t.name}: ${t.description}`).join('\n  ');
      toolCount += tools.length;

      catalogLines.push(`Department [${dept.toUpperCase()}]:\n  ${toolDescriptions}`);
    }

    return {
      catalogPrompt: catalogLines.join('\n\n'),
      toolCount,
    };
  }

  /**
   * Classify user query dynamically using LLM tool catalog inspection
   */
  async classifyIntent(message: string): Promise<ParsedSwarmIntent> {
    const { catalogPrompt, toolCount } = this.buildToolCatalogPrompt();
    logger.info({ message, toolCount }, '🧠 Intelligent Intent Layer classifying query against dynamic tool catalog...');

    const systemPrompt = `
You are the v2 Dynamic Intelligence Intent Classifier for an enterprise multi-agent platform.
Analyze the user's message and select the exact tool and parameters from the dynamic catalog below.

AVAILABLE TOOL CATALOG:
${catalogPrompt}

INSTRUCTIONS:
1. Identify the 'department' (CONSTRUCTION, HR, MANUFACTURING, or SYSTEM).
2. Select the exact 'toolName' from the catalog above.
3. Determine the 'action' (e.g. create, read, update, delete, calculate, list, generate, schedule_run, log_inspection, list_maintenance).
4. Extract structured 'parameters' (e.g. employeeId, projectId, item, quantity, materials, date, query).
5. Assign 'confidence' (0.0 to 1.0) and brief 'reasoning'.

Respond STRICTLY in JSON format matching this schema:
{
  "department": "MANUFACTURING",
  "toolName": "quality_control_logger",
  "action": "log_inspection",
  "parameters": { "productCode": "STEEL-001", "batchNumber": "BATCH-99", "passedCount": 99, "sampleSize": 100 },
  "confidence": 0.95,
  "reasoning": "User requested quality inspection log for batch STEEL-001."
}
`;

    try {
      const groq = new GroqService();
      if (groq.isAvailable()) {
        const rawResponse = await groq.createCompletion({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.1,
          maxTokens: 512,
        });

        const parsed = this.parseJsonResponse(rawResponse);
        if (parsed && parsed.department && parsed.toolName) {
          const action = this.normalizeAction(parsed.toolName, parsed.action);
          const parameters = this.enrichParameters(parsed.toolName, action, parsed.parameters || {});

          return {
            department: (parsed.department || 'CONSTRUCTION').toUpperCase() as any,
            toolName: parsed.toolName,
            action,
            parameters: { action, ...parameters },
            confidence: Number(parsed.confidence) || 0.9,
            reasoning: parsed.reasoning || 'Extracted via Intelligent Intent Layer',
          };
        }
      }
    } catch (error) {
      logger.warn({ error }, 'Groq LLM intent classification failed, using dynamic heuristic fallback');
    }

    // Dynamic heuristic fallback
    return this.heuristicFallback(message);
  }

  /**
   * Normalizes action names to match exact tool schema requirements
   */
  private normalizeAction(toolName: string, rawAction: string): string {
    const act = (rawAction || '').toLowerCase();

    if (toolName === 'project_tracker') {
      if (act.includes('list') || act.includes('all') || act.includes('detail') || act.includes('show') || act.includes('give') || act.includes('view') || act === 'read' || act === 'execute') {
        return 'list';
      }
      if (act.includes('create') || act.includes('add') || act.includes('new')) return 'create';
      if (act.includes('update') || act.includes('change')) return 'update';
      if (act.includes('get') || act.includes('find')) return 'get';
    }

    if (toolName === 'inventory_tracker') {
      if (act.includes('list') || act.includes('all') || act === 'read') return 'list_items';
      if (act.includes('add') || act.includes('order') || act.includes('create')) return 'add_item';
      if (act.includes('check') || act.includes('find') || act.includes('search')) return 'check_stock';
      if (act.includes('update')) return 'update_stock';
    }

    if (toolName === 'quality_control_logger') {
      if (act.includes('log') || act.includes('record') || act.includes('add') || act.includes('create')) return 'log_inspection';
      if (act.includes('list') || act.includes('all') || act.includes('history')) return 'list_inspections';
      if (act.includes('metrics') || act.includes('oee')) return 'quality_metrics';
    }

    if (toolName === 'production_scheduler') {
      if (act.includes('schedule') || act.includes('create') || act.includes('add') || act.includes('run') || act.includes('plan')) return 'schedule_run';
      if (act.includes('list') || act.includes('get') || act.includes('view')) return 'get_schedule';
      if (act.includes('capacity')) return 'line_capacity';
    }

    if (toolName === 'equipment_maintenance') {
      if (act.includes('check') || act.includes('status') || act.includes('health') || act.includes('view') || act.includes('list')) return 'list_maintenance';
      if (act.includes('schedule') || act.includes('plan')) return 'schedule_maintenance';
      if (act.includes('register') || act.includes('add')) return 'register_equipment';
    }

    if (toolName === 'employee_directory') {
      if (act.includes('search') || act.includes('find') || act.includes('get') || act === 'read') return 'search';
    }

    if (toolName === 'company_knowledge_base') {
      if (act.includes('list') || act.includes('all')) return 'list_all';
      if (act.includes('category')) return 'get_by_category';
      return 'search';
    }

    return rawAction;
  }

  /**
   * Enriches parameters with schema defaults to guarantee error-free tool execution
   */
  private enrichParameters(toolName: string, action: string, params: Record<string, any>): Record<string, any> {
    const res = { ...params };

    if (toolName === 'quality_control_logger' && action === 'log_inspection') {
      res.productCode = res.productCode || 'STEEL-001';
      res.batchNumber = res.batchNumber || 'BATCH-99';
      res.inspectionType = res.inspectionType || 'final';
      res.inspectorId = res.inspectorId || 'INSP-01';
      res.sampleSize = res.sampleSize || 100;
      res.passedCount = res.passedCount || 99;
      res.failedCount = res.failedCount || 1;
    }

    if (toolName === 'production_scheduler' && action === 'schedule_run') {
      res.productCode = res.productCode || 'STEEL-001';
      res.productName = res.productName || 'Heavy H-Beam Structural Steel 300mm';
      res.quantity = res.quantity || 200;
      res.scheduledStart = res.scheduledStart || new Date().toISOString();
      res.scheduledEnd = res.scheduledEnd || new Date(Date.now() + 86400000 * 3).toISOString();
      res.assignedLine = res.assignedLine || 'Line 3';
    }

    if (toolName === 'inventory_tracker' && action === 'add_item') {
      res.itemCode = res.itemCode || `STEEL-BEAM-${Math.floor(100 + Math.random() * 900)}`;
      res.name = res.name || 'Heavy H-Beam Structural Steel 300mm';
      res.category = res.category || 'Raw Materials';
      res.quantity = res.quantity || 500;
      res.unitCost = res.unitCost || 45;
    }

    return res;
  }

  /**
   * Parse JSON safely from LLM output string
   */
  private parseJsonResponse(rawString: string): any {
    try {
      const start = rawString.indexOf('{');
      const end = rawString.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(rawString.substring(start, end + 1));
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Fallback classifier when offline
   */
  private heuristicFallback(message: string): ParsedSwarmIntent {
    const q = message.toLowerCase();

    if (q.includes('employee') || q.includes('hire') || q.includes('leave') || q.includes('policy') || q.includes('wfh')) {
      return {
        department: 'HR',
        toolName: q.includes('policy') || q.includes('wfh') ? 'company_knowledge_base' : 'employee_directory',
        action: 'search',
        parameters: { query: message },
        confidence: 0.8,
        reasoning: 'Fallback classification to HR department',
      };
    }

    if (q.includes('stock') || q.includes('inventory') || q.includes('steel') || q.includes('po') || q.includes('restock') || q.includes('qc') || q.includes('quality')) {
      return {
        department: 'MANUFACTURING',
        toolName: q.includes('quality') || q.includes('qc') ? 'quality_control_logger' : 'inventory_tracker',
        action: q.includes('quality') || q.includes('qc') ? 'log_inspection' : 'list_items',
        parameters: { query: message },
        confidence: 0.8,
        reasoning: 'Fallback classification to Manufacturing department',
      };
    }

    return {
      department: 'CONSTRUCTION',
      toolName: 'project_tracker',
      action: 'list',
      parameters: { query: message },
      confidence: 0.7,
      reasoning: 'Fallback classification to Construction department',
    };
  }
}

export const intelligentIntentLayer = IntelligentIntentLayer.getInstance();
