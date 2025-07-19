# xen.process
## xen.process.processes
Array of all currently running processes

## xen.process.spawn(code: string, isAsync?: boolean): void
Will create a new worker with `codde` and inject `xen` into it. If `isAsync` is true, the code being ran will be ran asynchronously

## xen.process.kill(pid: number): void
Will kill the process with given PID. You can get a processes PID by looking at the `processes` array and using its index as the PID (or the `pid` attribute)

