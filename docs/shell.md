# XenShell
XenOSes Shell

## Features
XenOS is a UNIX-like shell so things like UNIX paths, `>`, `&&`, `|`, etc. work

## Env Vars
XenShell (XS) supports env vars
```
user@localhost:~$ export a=b
user@localhost:~$ echo $a
b
```

## Paths
XS supports paths
```
user@xen.local:~$ ls /usr/clis/
test
user@xen.local:~$ test
wallpapers
test.xs
policies
libs
clis
apps
user@xen.local:~$ cat /usr/clis/test
#!xs
ls
```

## Scripts
XS scripts are formatted like this:
### XS Scripts
```
#!xs

# Comment!
ls
```
Save the file as, for example, `test.xs` and then run `xs test.xs`
### JS Scripts
```js
#!js
alert(1);
```
XS can run JS scripts

## Included commands
A list of commands provided by XS:
```
ls
cd <path>
pwd
date
echo <string>
touch <path>
mkdir <path>
rm <path>
cat <path>
grep <string>
history
clear
alias <alias>=<command>
export <k>=<v>
zip <src_path> <dest_path>
unzip <src_path> <dest_path>
link <src_path> <dest_path>
readlink <path>
unlink <src_path> <dest_path>
mount <path>
umount <path>
eval <js code>
xs <path>
cowsay <strign>
help
```

## How to make commands
```ts
const commands = [
    {
        name: "test",
        callback: async(args?: string[], shell?: XenShell, stdin?: string) => {
            /*
                `args` gives you access to the arguments passed in as an array
                `shell` gives you access to the XenShell instance
                `stdin` gives you access, to well, stdin
            */
           return args[0]; // return = stdout
        }
    }
];

const xs = new window.xen.XenShell();
await xs.init();

for (const cmd of commands) {
    xs.registerCommand(xs);
}

await xs.runline('test');
```