// Polyfill Bun's node:v8 module to fix NotImplementedError in bson dependency
if (typeof globalThis !== 'undefined' && (globalThis as any).process?.getBuiltinModule) {
    const origGetBuiltinModule = (globalThis as any).process.getBuiltinModule;
    (globalThis as any).process.getBuiltinModule = function (id: string) {
        const mod = origGetBuiltinModule.call(this, id);
        if (id === 'v8' && mod?.startupSnapshot) {
            return {
                ...mod,
                startupSnapshot: {
                    ...mod.startupSnapshot,
                    isBuildingSnapshot: () => false,
                },
            };
        }
        return mod;
    };
}
