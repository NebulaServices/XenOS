"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomGenerator = void 0;
const yeoman_generator_1 = __importDefault(require("yeoman-generator"));
const path_1 = __importDefault(require("path"));
class CustomGenerator extends yeoman_generator_1.default {
    constructor(args, opts) {
        super(args, opts);
        this.cli = opts.cli;
        this.dependencies = [];
        this.answers = {};
        this.supportedTemplates = [];
        const { options } = opts;
        this.template = options.template;
        this.force = typeof options.force !== "undefined" ? options.force : false;
        this.generationPath = path_1.default.resolve(process.cwd(), options.generationPath);
    }
}
exports.CustomGenerator = CustomGenerator;
