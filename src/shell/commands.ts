import { XenShell } from "./XenShell";

export const commands = [
    {
        name: "ls",
        callback: async (args: string[], shell: XenShell) => {
            const path = args[0] ? shell["resolvePath"](args[0]) : shell.getCwd();
            const entries = await window.xen.fs.list(path);
            return entries.map((e) => e.name).join("\n");
        }
    },
    {
        name: "cd",
        callback: async (args: string[], shell: XenShell) => {
            const path = args[0]
                ? shell["resolvePath"](args[0])
                : shell.getEnv("HOME")!;
            await window.xen.fs.cd(path);
            shell.setCwd(path);
        }
    },
    {
        name: "pwd",
        callback: async (_, shell: XenShell) => shell.getCwd()
    },
    {
        name: "date",
        callback: async () => {
            return new Date().toString();
        }
    },
    {
        name: "echo",
        callback: async (args: string[]) => {
            return args.join(" ");
        }
    },
    {
        name: "touch",
        callback: async (args: string[], shell: XenShell) => {
            const path = shell["resolvePath"](args[0]);
            await window.xen.fs.write(path, "");
        }
    },
    {
        name: "mkdir",
        callback: async (args: string[], shell: XenShell) => {
            await window.xen.fs.mkdir(shell["resolvePath"](args[0]));
        }
    },
    {
        name: "rm",
        callback: async (args: string[], shell: XenShell) => {
            await window.xen.fs.rm(shell["resolvePath"](args[0]));
        }
    },
    {
        name: "cat",
        callback: async (args: string[], shell: XenShell) => {
            return await window.xen.fs.read(
                shell["resolvePath"](args[0]),
                "text"
            ) as string;
        }
    },
    {
        name: "grep",
        callback: async (args: string[], shell: XenShell, stdin?: string) => {
            const pattern = args[0];
            let data = "";

            if (args[1]) {
                data = (await window.xen.fs.read(
                    shell["resolvePath"](args[1]),
                    "text"
                )) as string;
            } else {
                data = stdin || "";
            }

            return data
                .split("\n")
                .filter((line) => line.includes(pattern))
                .join("\n");
        }
    },
    {
        name: "history",
        callback: async (_, shell: XenShell) => shell.getHistory().join("\n")
    },
    {
        name: "clear",
        callback: async () => "CLEAR_TERMINAL"
    },
    {
        name: "alias",
        callback: async (args: string[], shell: XenShell) => {
            const [name, ...cmd] = args.join(" ").split("=");
            shell.registerCommand({
                name: name.trim(),
                callback: async () => await shell.runLine(cmd.join("="))
            });
        }
    },
    {
        name: "export",
        callback: async (args: string[], shell: XenShell) => {
            const [key, val] = args.join(" ").split("=");
            shell.setEnv(key.trim(), val.replace(/"/g, "").trim());
        }
    },
    {
        name: "zip",
        callback: async (args: string[]) => {
            await window.xen.fs.compress(args[0], args[1]);
        }
    },
    {
        name: "unzip",
        callback: async (args: string[]) => {
            await window.xen.fs.decompress(args[0], args[1]);
        }
    },
    {
        name: "link",
        callback: async (args: string[]) => {
            await window.xen.fs.link(args[0], args[1]);
        }
    },
    {
        name: "readlink",
        callback: async (args: string[]) => {
            return await window.xen.fs.readlink(args[0]);
        }
    },
    {
        name: "unlink",
        callback: async (args: string[]) => {
            await window.xen.fs.unlink(args[0]);
        }
    },
    {
        name: "mount",
        callback: async (args: string[]) => {
            await window.xen.fs.mount(args[0]);
        }
    },
    {
        name: "umount",
        callback: async (args: string[]) => {
            await window.xen.fs.unmount(args[0]);
        }
    },
    {
        name: "eval",
        callback: async (args: string[]) => {
            return eval(args.join(" "));
        }
    },
    {
        name: "xs",
        callback: async (args: string[], shell: XenShell) => {
            return await shell.runScript(shell["resolvePath"](args[0]));
        }
    },
    {
        name: "cowsay",
        callback: async (args: string[]) => {
            const msg = args.join(" ");
            return `  ${"_".repeat(msg.length + 2)}\n< ${msg} >\n  ${"-".repeat(
                msg.length + 2
            )}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`;
        }
    },
    {
        name: "help",
        callback: async () => {
            return "Available commands: " + commands.map((c) => c.name).join(", ");
        }
    }
];