#!/usr/bin/env node
/**
 * Live-reload watcher for the Lucid theme.
 * Watches every file under src/files and syncs it to site/ (300 ms debounce).
 * Usage: npm run watch
 */
import {watch, existsSync} from 'fs';
import {resolve, join} from 'path';
import {execSync} from 'child_process';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src', 'files');

let timer = null;
let syncing = false;

function sync() {
    if (syncing) return;
    syncing = true;
    try {
        execSync('node build --copy', {cwd: ROOT, stdio: 'pipe'});
        process.stdout.write(`[${new Date().toLocaleTimeString()}] sync OK\n`);
    } catch (e) {
        process.stdout.write(`[${new Date().toLocaleTimeString()}] sync FAIL: ${e.message?.split('\n')[0]}\n`);
    } finally {
        syncing = false;
    }
}

if (!existsSync(SRC)) {
    console.error('src/files not found');
    process.exit(1);
}

sync();
watch(SRC, {recursive: true}, () => {
    clearTimeout(timer);
    timer = setTimeout(sync, 300);
});
console.log('Lucid live-reload on: edit src/, files are synced automatically.');
