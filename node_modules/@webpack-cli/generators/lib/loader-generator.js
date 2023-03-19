"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoaderGenerator = exports.makeLoaderName = void 0;
const path_1 = __importDefault(require("path"));
const addon_generator_1 = __importDefault(require("./addon-generator"));
const helpers_1 = require("./utils/helpers");
/**
 * Formats a string into webpack loader format
 * (eg: 'style-loader', 'raw-loader')
 *
 * @param {string} name A loader name to be formatted
 * @returns {string} The formatted string
 */
function makeLoaderName(name) {
    name = (0, helpers_1.toKebabCase)(name);
    if (!/loader$/.test(name)) {
        name += "-loader";
    }
    return name;
}
exports.makeLoaderName = makeLoaderName;
exports.LoaderGenerator = (0, addon_generator_1.default)([
    {
        default: "my-loader",
        filter: makeLoaderName,
        message: "Loader name",
        name: "name",
        type: "input",
        validate: (str) => str.length > 0,
    },
], path_1.default.resolve(__dirname, "../loader-template"), (gen) => ({
    name: gen.props.name,
}));
exports.default = exports.LoaderGenerator;
