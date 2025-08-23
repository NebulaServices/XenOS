import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';
import wisp from 'wisp-server-node';
import p2p from './p2p.js';
import express from 'express';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const port = 1543;
const buildPath = join(__dirname, '..', 'build');

let building = false;
let buildQueue = false;

function build() {
    if (building) {
        buildQueue = true;
        return;
    }

    building = true;
    buildQueue = false;

    console.log('Building...');

    const proc = spawn('bash', ['./scripts/build.sh'], {
        stdio: 'pipe',
        cwd: process.cwd()
    });

    // let output = '';

    /*
    proc.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
        output += data.toString();
        process.stderr.write(data);
    });
    */

    proc.on('close', (code) => {
        building = false;

        if (code === 0) {
            console.log('Build complete');
        } else {
            console.log('Build failed with code:', code);
            // console.log('Output:', output.slice(-500));
        }

        if (buildQueue) {
            setTimeout(build, 5000);
        }
    });

    proc.on('error', (err) => {
        building = false;
        console.log('Error while building:', err.message);
    });
}

const dirs = ['src', 'public', 'apps-src'];

dirs.forEach((dir) => {
    try {
        watch(dir, { recursive: true }, (_, file) => {
            if (file) {
                // console.log(`File changed: ${dir}/${file}`);
                setTimeout(build, 100);
            }
        })
    } catch (err) {
        console.error(`Error watching ${dir}:`, err.message);
    }
});

app.use(express.static(buildPath));

server.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith('/wisp/')) {
        wisp.routeRequest(req, socket, head);
    } else if (req.url.endsWith('/p2p/')) {
        p2p.routeRequest({
            request: req,
            socket: socket,
            head: head,
            conf: {
                logging: true,
                blockedIps: []
            }
        });
    }
});

build();

server.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});
