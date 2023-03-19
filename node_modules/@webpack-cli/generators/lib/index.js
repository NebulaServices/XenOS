"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initGenerator = exports.addonGenerator = void 0;
const yeoman_environment_1 = __importDefault(require("yeoman-environment"));
const loader_generator_1 = __importDefault(require("./loader-generator"));
const plugin_generator_1 = __importDefault(require("./plugin-generator"));
const addon_generator_1 = __importDefault(require("./addon-generator"));
exports.addonGenerator = addon_generator_1.default;
const init_generator_1 = __importDefault(require("./init-generator"));
exports.initGenerator = init_generator_1.default;
class GeneratorsCommand {
    async apply(cli) {
        await cli.makeCommand({
            name: "init [generation-path]",
            alias: ["create", "new", "c", "n"],
            description: "Initialize a new webpack project.",
            argsDescription: {
                "generation-path": "Path to the installation directory, e.g. ./projectName",
            },
            usage: "[generation-path] [options]",
            pkg: "@webpack-cli/generators",
        }, [
            {
                name: "template",
                alias: "t",
                configs: [{ type: "string" }],
                description: "Type of template",
                defaultValue: "default",
            },
            {
                name: "force",
                alias: "f",
                configs: [
                    {
                        type: "enum",
                        values: [true],
                    },
                ],
                description: "Generate without questions (ideally) using default answers",
            },
        ], async (generationPath, options) => {
            const cwd = generationPath || ".";
            const env = yeoman_environment_1.default.createEnv([], { cwd });
            const generatorName = "webpack-init-generator";
            env.registerStub(init_generator_1.default, generatorName);
            env.run(generatorName, { cli, options: Object.assign(Object.assign({}, options), { generationPath: cwd }) }).then(() => {
                cli.logger.success("Project has been initialised with webpack!");
            }, (error) => {
                cli.logger.error(`Failed to initialize the project.\n ${error}`);
                process.exit(2);
            });
        });
        await cli.makeCommand({
            name: "loader [output-path]",
            alias: "l",
            description: "Scaffold a loader.",
            argsDescription: {
                "output-path": "Path to the output directory, e.g. ./loaderName",
            },
            usage: "[output-path] [options]",
            pkg: "@webpack-cli/generators",
        }, [
            {
                name: "template",
                alias: "t",
                configs: [{ type: "string" }],
                description: "Type of template",
                defaultValue: "default",
            },
        ], async (outputPath, options) => {
            const cwd = outputPath || ".";
            const env = yeoman_environment_1.default.createEnv([], { cwd });
            const generatorName = "webpack-loader-generator";
            env.registerStub(loader_generator_1.default, generatorName);
            env.run(generatorName, { cli, options: Object.assign(Object.assign({}, options), { generationPath: cwd }) }).then(() => {
                cli.logger.success("Loader template has been successfully scaffolded.");
            }, (error) => {
                cli.logger.error(`Failed to initialize the loader template.\n ${error}`);
                process.exit(2);
            });
        });
        await cli.makeCommand({
            name: "plugin [output-path]",
            alias: "p",
            description: "Scaffold a plugin.",
            argsDescription: {
                "output-path": "Path to the output directory, e.g. ./pluginName",
            },
            usage: "[output-path] [options]",
            pkg: "@webpack-cli/generators",
        }, [
            {
                name: "template",
                alias: "t",
                configs: [{ type: "string" }],
                description: "Type of template",
                defaultValue: "default",
            },
        ], async (outputPath, options) => {
            const cwd = outputPath || ".";
            const env = yeoman_environment_1.default.createEnv([], { cwd });
            const generatorName = "webpack-plugin-generator";
            env.registerStub(plugin_generator_1.default, generatorName);
            env.run(generatorName, { cli, options: Object.assign(Object.assign({}, options), { generationPath: cwd }) }).then(() => {
                cli.logger.success("Plugin template has been successfully scaffolded.");
            }, (error) => {
                cli.logger.error(`Failed to initialize the plugin template.\n ${error}`);
                process.exit(2);
            });
        });
    }
}
exports.default = GeneratorsCommand;
