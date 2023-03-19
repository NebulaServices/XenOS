"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginGenerator = void 0;
const path_1 = __importDefault(require("path"));
const addon_generator_1 = __importDefault(require("./addon-generator"));
const helpers_1 = require("./utils/helpers");
exports.PluginGenerator = (0, addon_generator_1.default)([
    {
        default: "my-webpack-plugin",
        filter: helpers_1.toKebabCase,
        message: "Plugin name",
        name: "name",
        type: "input",
        validate: (str) => str.length > 0,
    },
], path_1.default.resolve(__dirname, "../plugin-template"), (gen) => ({
    name: (0, helpers_1.toUpperCamelCase)(gen.props.name),
}));
exports.default = exports.PluginGenerator;
