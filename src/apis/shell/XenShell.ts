import { commands } from "./commands";

interface Command {
    name: string;
    callback: (
        args: string[],
        shell: XenShell,
        stdin?: string
    ) => Promise<string | void>;
}

export class XenShell {
    private env: Map<string, string> = new Map();
    private history: string[] = [];
    private registry: Map<string, Command> = new Map();
    private cwd: string = "/usr";
    private paths: string[] = [];
    private fs: typeof window.xen.fs;

    constructor() {
        this.paths = ["/usr/clis"];
        this.env.set("PATH", this.paths.join(":"));
        this.env.set("HOME", "/usr");
        this.env.set("PWD", "/usr");

        for (const cmd of commands) {
            this.registerCommand(cmd);
        }
    }

    async init(): Promise<void> {
        this.fs = window.xen.fs;
        
        const rcPath = this.resolvePath("~/.xsrc");
        if (await this.fs.exists(rcPath)) {
            await this.runScript(rcPath);
        }
    }

    registerCommand(cmd: Command): void {
        this.registry.set(cmd.name, cmd);
    }

    private resolvePath(path: string): string {
        return this.fs.normalizePath(path, this.cwd);
    }

    private subEnvVars(input: string): string {
        input = input.replace(/\$\{([A-Za-z0-9_]+)\}/g, (_, key) => {
            return this.env.get(key) || "";
        });
        
        input = input.replace(/\$([A-Za-z0-9_]+)/g, (_, key) => {
            return this.env.get(key) || "";
        });
        
        input = input.replace(/\$\(([^)]+)\)/g, (_, cmd) => {
            try {
                return "";
            } catch {
                return "";
            }
        });
        
        return input;
    }

    private async execCmd(
        cmd: string,
        args: string[],
        stdin: string = ""
    ): Promise<string> {
        if (this.registry.has(cmd)) {
            return (
                (await this.registry.get(cmd)!.callback(args, this, stdin)) || ""
            );
        }

        const paths = this.env.get("PATH")?.split(":") || [];
        for (const path of paths) {
            const fullPath = this.resolvePath(`${path}/${cmd}`);
            if (await this.fs.exists(fullPath)) {
                return (await this.runScript(fullPath, args, stdin)) || "";
            }
        }

        if (cmd.startsWith("./") || cmd.startsWith("/") || cmd.startsWith("~/")) {
            const fullPath = this.resolvePath(cmd);
            if (await this.fs.exists(fullPath)) {
                return (await this.runScript(fullPath, args, stdin)) || "";
            }
        }

        throw new Error(`${cmd}: command not found`);
    }

    private async runPipe(parts: string[]): Promise<string> {
        let stdin = "";
        for (let i = 0; i < parts.length; i++) {
            const tokens = parts[i].trim().split(/\s+/);
            const cmd = tokens[0];
            const args = tokens.slice(1);
            const output = await this.execCmd(cmd, args, stdin);
            stdin = output;
        }
        return stdin;
    }

    async runLine(line: string): Promise<string> {
        line = this.subEnvVars(line).trim();
        if (!line) return "";

        this.history.push(line);

        const andParts = line.split("&&");
        let lastOutput = "";
        for (const part of andParts) {
            const orParts = part.split("||");
            let success = false;
            for (const orPart of orParts) {
                try {
                    lastOutput = await this.runWithRedirects(orPart.trim());
                    success = true;
                    break;
                } catch (error) {
                    lastOutput = error.message;
                    success = false;
                }
            }
            if (!success) break;
        }
        return lastOutput;
    }

    private async runWithRedirects(cmdLine: string): Promise<string> {
        let append = false;
        let outFile: string | null = null;

        if (cmdLine.includes(">>")) {
            [cmdLine, outFile] = cmdLine.split(">>");
            append = true;
        } else if (cmdLine.includes(">")) {
            [cmdLine, outFile] = cmdLine.split(">");
        }

        const output = await this.runPipe(cmdLine.split("|"));

        if (outFile) {
            const filePath = this.resolvePath(outFile.trim());
            if (append && (await this.fs.exists(filePath))) {
                const existing = (await this.fs.read(filePath, "text")) as string;
                await this.fs.write(filePath, existing + output);
            } else {
                await this.fs.write(filePath, output);
            }
            return "";
        }

        return output;
    }

    async runScript(
        path: string,
        args: string[] = [],
        stdin: string = ""
    ): Promise<string> {
        const content = (await this.fs.read(path, "text")) as string;
        const lines = content.split("\n").map((l) => l.trim());
        let output = "";

        if (lines[0].startsWith("#!")) {
            const shebang = lines[0].slice(2).trim();
            if (shebang === "xs") {
                for (const line of lines.slice(1)) {
                    if (!line.startsWith("#") && line.trim()) {
                        output = await this.runLine(line);
                    }
                }
            } else if (shebang === "js") {
                const jsCode = lines.slice(1).join("\n");
                output = eval(`(function(stdin, args){${jsCode}})(\`${stdin}\`, ${JSON.stringify(args)})`);
            }
        } else {
            for (const line of lines) {
                if (!line.startsWith("#") && line.trim()) {
                    output = await this.runLine(line);
                }
            }
        }
        return output;
    }

    async getCompletions(partial: string): Promise<string[]> {
        const completions: string[] = [];
        
        for (const cmd of this.registry.keys()) {
            if (cmd.startsWith(partial)) {
                completions.push(cmd);
            }
        }

        const paths = this.env.get("PATH")?.split(":") || [];
        for (const path of paths) {
            try {
                const entries = await this.fs.list(this.resolvePath(path));
                for (const entry of entries) {
                    if (!entry.isDirectory && entry.name.startsWith(partial)) {
                        completions.push(entry.name);
                    }
                }
            } catch {}
        }

        try {
            const lastSlash = partial.lastIndexOf('/');
            const dir = lastSlash >= 0 ? partial.substring(0, lastSlash + 1) : '';
            const prefix = lastSlash >= 0 ? partial.substring(lastSlash + 1) : partial;
            
            const searchPath = dir || this.cwd;
            const entries = await this.fs.list(this.resolvePath(searchPath));
            
            for (const entry of entries) {
                if (entry.name.startsWith(prefix)) {
                    const fullName = dir + entry.name + (entry.isDirectory ? '/' : '');
                    completions.push(fullName);
                }
            }
        } catch {}

        return [...new Set(completions)].sort();
    }

    getEnv(key: string): string | undefined {
        return this.env.get(key);
    }

    setEnv(key: string, value: string): void {
        this.env.set(key, value);
        if (key === "PWD") {
            this.cwd = value;
        }
    }

    getHistory(): string[] {
        return this.history;
    }

    setCwd(path: string): void {
        this.cwd = path;
        this.env.set("PWD", path);
    }

    getCwd(): string {
        return this.cwd;
    }
}