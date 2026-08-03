import { describe, expect, it, beforeAll } from 'bun:test';
import { IntelligentIntentLayer } from '../../src/agents/IntelligentIntentLayer';
import { AgentRegistry } from '../../src/agents/AgentRegistry';
import { ConstructionAgent } from '../../src/agents/ConstructionAgent';
import { ManufacturingAgent } from '../../src/agents/ManufacturingAgent';
import { HRAgent } from '../../src/agents/HRAgent';

describe('Dynamic Intelligence Intent Layer (v2)', () => {
  let intentLayer: IntelligentIntentLayer;

  beforeAll(() => {
    const registry = AgentRegistry.getInstance();
    registry.registerAgent('construction', new ConstructionAgent());
    registry.registerAgent('manufacturing', new ManufacturingAgent());
    registry.registerAgent('hr', new HRAgent());

    intentLayer = IntelligentIntentLayer.getInstance();
  });

  it('should instantiate singleton instance', () => {
    expect(intentLayer).toBeDefined();
  });

  it('should dynamically classify HR policy query', async () => {
    const intent = await intentLayer.classifyIntent('What is the WFH stipend policy for Issa Group?');
    expect(intent.department).toBe('HR');
    expect(intent.toolName).toBeDefined();
    expect(intent.confidence).toBeGreaterThan(0.5);
  }, 15000);

  it('should dynamically classify Construction material calculation query', async () => {
    const intent = await intentLayer.classifyIntent('Calculate material cost for 50 units of concrete');
    expect(intent.department).toBe('CONSTRUCTION');
    expect(intent.toolName).toBeDefined();
    expect(intent.confidence).toBeGreaterThan(0.5);
  }, 15000);

  it('should dynamically classify Manufacturing stock query', async () => {
    const intent = await intentLayer.classifyIntent('Check inventory level for STEEL-001 beams');
    expect(intent.department).toBe('MANUFACTURING');
    expect(intent.toolName).toBeDefined();
    expect(intent.confidence).toBeGreaterThan(0.5);
  }, 15000);
});
