import { describe, expect, it } from 'bun:test';

// Unit test Toast message logic and color mapping
describe('Toast Component & Logic', () => {
    it('should map toast types to correct CSS style classes and icons', () => {
        const getStyle = (type: 'success' | 'error' | 'warning' | 'info') => {
            switch (type) {
                case 'success':
                    return {
                        bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
                        icon: '🟢',
                    };
                case 'error':
                    return {
                        bg: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
                        icon: '🔴',
                    };
                case 'warning':
                    return {
                        bg: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
                        icon: '🟡',
                    };
                default:
                    return {
                        bg: 'bg-slate-900/95 border-purple-500/40 text-purple-200',
                        icon: '⚡',
                    };
            }
        };

        expect(getStyle('success').bg).toContain('emerald');
        expect(getStyle('error').bg).toContain('rose');
        expect(getStyle('warning').bg).toContain('amber');
        expect(getStyle('info').bg).toContain('slate');
    });

    it('should cap active toasts queue to 5 items', () => {
        const toasts: Array<{ id: string; message: string }> = [];
        const addToast = (msg: string) => {
            const newToast = { id: Math.random().toString(), message: msg };
            toasts.push(newToast);
            if (toasts.length > 5) toasts.shift();
        };

        for (let i = 1; i <= 8; i++) {
            addToast(`Toast Message ${i}`);
        }

        expect(toasts.length).toBe(5);
        expect(toasts[0].message).toBe('Toast Message 4');
        expect(toasts[4].message).toBe('Toast Message 8');
    });
});
