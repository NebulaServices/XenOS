"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yeoman_generator_1 = __importDefault(require("yeoman-generator"));
const types_1 = require("./types");
const helpers_1 = require("./utils/helpers");
// eslint-disable-next-line @typescript-eslint/no-var-requires
Object.assign(yeoman_generator_1.default.prototype, require("yeoman-generator/lib/actions/install"));
// Helper to get the template-directory content
const getFiles = (dir) => {
    return fs_1.default.readdirSync(dir).reduce((list, file) => {
        const filePath = path_1.default.join(dir, file);
        const isDir = fs_1.default.statSync(filePath).isDirectory();
        return list.concat(isDir ? getFiles(filePath) : filePath);
    }, []);
};
class AddonGenerator extends types_1.CustomGenerator {
}
const addonGenerator = (prompts, templateDir, templateFn) => {
    return class extends types_1.CustomGenerator {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(args, opts) {
            super(args, opts);
            this.supportedTemplates = fs_1.default.readdirSync(templateDir);
        }
        async prompting() {
            this.template = await helpers_1.getTemplate.call(this);
            this.resolvedTemplatePath = path_1.default.join(templateDir, this.template);
            this.props = await this.prompt(prompts);
            this.packageManager = await helpers_1.getInstaller.call(this);
        }
        default() {
            const name = this.props.name;
            const currentDirName = path_1.default.basename(this.destinationPath());
            if (currentDirName !== name) {
                this.log(`
				Your project must be inside a folder named ${name}
				I will create this folder for you.
                `);
                const pathToProjectDir = this.destinationPath(name);
                try {
                    fs_1.default.mkdirSync(pathToProjectDir, { recursive: true });
                }
                catch (error) {
                    this.cli.logger.error("Failed to create directory");
                    this.cli.logger.error(error);
                }
                this.destinationRoot(pathToProjectDir);
            }
        }
        writing() {
            const name = this.props.name;
            const resolvedTemplatePath = this.resolvedTemplatePath;
            const packageJsonTemplatePath = "../addon-template/package.json.js";
            this.fs.extendJSON(this.destinationPath("package.json"), 
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require(packageJsonTemplatePath)(name));
            let files = [];
            try {
                // An array of file paths (relative to `./templates`) of files to be copied to the generated project
                files = getFiles(resolvedTemplatePath);
            }
            catch (error) {
                this.cli.logger.error(`Failed to generate starter template.\n ${error}`);
                process.exit(2);
            }
            // Template file paths should be of the form `path/to/_file.js.tpl`
            const copyTemplateFiles = files.filter((filePath) => path_1.default.basename(filePath).startsWith("_"));
            // File paths should be of the form `path/to/file.js.tpl`
            const copyFiles = files.filter((filePath) => !copyTemplateFiles.includes(filePath));
            copyFiles.forEach((filePath) => {
                // `absolute-path/to/file.js.tpl` -> `destination-path/file.js`
                const destFilePath = path_1.default.relative(resolvedTemplatePath, filePath).replace(".tpl", "");
                this.fs.copyTpl(filePath, this.destinationPath(destFilePath));
            });
            copyTemplateFiles.forEach((filePath) => {
                // `absolute-path/to/_file.js.tpl` -> `destination-path/file.js`
                const destFilePath = path_1.default
                    .relative(resolvedTemplatePath, filePath)
                    .replace("_", "")
                    .replace(".tpl", "");
                this.fs.copyTpl(filePath, this.destinationPath(destFilePath), templateFn(this));
            });
        }
        install() {
            const packageManager = this.packageManager;
            const opts = this.packageManager === "yarn" ? { dev: true } : { "save-dev": true };
            this.scheduleInstallTask(packageManager, ["webpack-defaults"], opts);
        }
    };
};
exports.default = addonGenerator;
