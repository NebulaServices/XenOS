import { build } from 'esbuild';

await build({
    entryPoints: {
        index: 'src/boot.ts',
    },
    entryNames: '[name]',
    outdir: 'dist',
    bundle: true,
    //logLevel: 'info',
    format: 'esm',
    sourcemap: true
});

// Build transport (Needs both cjs and mjs)
await build({
    entryPoints: {
        index: 'src/core/Transport.ts',
    },
    entryNames: '[name]',
    outfile: './dist-transport/index.js',
    bundle: true,
    //logLevel: 'info',
    format: 'cjs',
    sourcemap: true
});

await build({
    entryPoints: {
        index: 'src/core/Transport.ts',
    },
    entryNames: '[name]',
    outfile: './dist-transport/index.mjs',
    bundle: true,
    //logLevel: 'info',
    format: 'esm',
    sourcemap: true
});

// Service Worker
await build({
    entryPoints: {
        index: 'src/sw/xen-sw.ts'
    },
    entryNames: '[name]',
    outfile: 'dist-sw/xen-sw.js',
    bundle: true,
    //logLevel: 'info',
    format: 'esm',
    sourcemap: true
})

// wisp-client-js
await build({
    entryPoints: {
        index: './wisp-client-js/src/wisp.mjs'
    },
    entryNames: '[name]',
    outfile: './wisp-client-js/dist/wisp.js',
    bundle: true,
    //logLevel: 'info',
    format: 'esm',
    sourcemap: true
})