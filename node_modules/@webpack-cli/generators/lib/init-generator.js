"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const types_1 = require("./types");
const helpers_1 = require("./utils/helpers");
const Question = __importStar(require("./utils/scaffold-utils"));
const handlers_1 = __importDefault(require("./handlers"));
class InitGenerator extends types_1.CustomGenerator {
    constructor(args, opts) {
        super(args, opts);
        this.dependencies = ["webpack", "webpack-cli"];
        this.supportedTemplates = Object.keys(handlers_1.default);
    }
    async prompting() {
        this.template = await helpers_1.getTemplate.call(this);
        await handlers_1.default[this.template].questions(this, Question);
        // Handle installation of prettier
        try {
            // eslint-disable-next-line node/no-extraneous-require
            require.resolve("prettier");
        }
        catch (err) {
            const { installPrettier } = await Question.Confirm(this, "installPrettier", "Do you like to install prettier to format generated configuration?", true, false);
            if (installPrettier) {
                this.dependencies.push("prettier");
            }
        }
    }
    async installPlugins() {
        this.packageManager = await helpers_1.getInstaller.call(this);
        const opts = this.packageManager === "yarn" ? { dev: true } : { "save-dev": true };
        this.scheduleInstallTask(this.packageManager, this.dependencies, opts, {
            cwd: this.generationPath,
        });
    }
    writing() {
        this.cli.logger.log(`${this.cli.colors.blue("ℹ INFO ")} Initialising project...`);
        this.configurationPath = this.destinationPath("webpack.config.js");
        handlers_1.default[this.template].generate(this);
    }
    end() {
        // Prettify configuration file if possible
        try {
            // eslint-disable-next-line node/no-extraneous-require, @typescript-eslint/no-var-requires
            const prettier = require("prettier");
            const source = (0, fs_1.readFileSync)(this.configurationPath, { encoding: "utf8" });
            const formattedSource = prettier.format(source, { parser: "babel" });
            (0, fs_1.writeFileSync)(this.configurationPath, formattedSource);
        }
        catch (err) {
            this.cli.logger.log(`${this.cli.colors.yellow(`⚠ Generated configuration may not be properly formatted as prettier is not installed.`)}`);
            return;
        }
    }
}
exports.default = InitGenerator;
