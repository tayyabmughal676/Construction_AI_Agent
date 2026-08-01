import { describe, expect, it } from 'bun:test';

describe('Frontend Intelligence Terminal Utilities', () => {
    const tools = [
        { name: 'project_tracker', desc: 'Manage site projects', dept: 'CONSTRUCTION' },
        { name: 'material_cost_calculator', desc: 'Estimate material costs', dept: 'CONSTRUCTION' },
        { name: 'employee_directory', desc: 'Manage workforce directory', dept: 'HR' },
        { name: 'leave_management', desc: 'Track employee leave', dept: 'HR' },
        { name: 'inventory_tracker', desc: 'Monitor plant stock', dept: 'MANUFACTURING' },
        { name: 'quality_control_logger', desc: 'Log batch QC pass rates', dept: 'MANUFACTURING' },
    ];

    it('should filter tools based on @ mention filter query', () => {
        const filterTools = (query: string) => {
            const clean = query.toLowerCase();
            return tools.filter(t => t.name.toLowerCase().includes(clean) || t.dept.toLowerCase().includes(clean));
        };

        expect(filterTools('hr').length).toBe(2);
        expect(filterTools('project').length).toBe(1);
        expect(filterTools('inventory').length).toBe(1);
        expect(filterTools('xyz').length).toBe(0);
    });

    it('should format department badges accurately', () => {
        const DEPT_ICONS: Record<string, string> = {
            HR: '👥',
            CONSTRUCTION: '🏗️',
            MANUFACTURING: '🏭',
            SYSTEM: '⚡',
        };

        expect(DEPT_ICONS['HR']).toBe('👥');
        expect(DEPT_ICONS['CONSTRUCTION']).toBe('🏗️');
        expect(DEPT_ICONS['MANUFACTURING']).toBe('🏭');
        expect(DEPT_ICONS['SYSTEM']).toBe('⚡');
    });
});
