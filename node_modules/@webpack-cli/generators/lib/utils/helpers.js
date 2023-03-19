"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplate = exports.getInstaller = exports.toUpperCamelCase = exports.toKebabCase = void 0;
const scaffold_utils_1 = require("./scaffold-utils");
const regex = /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g;
/**
 * Convert str to kebab-case
 * @param str input string
 * @returns output string
 */
function toKebabCase(str) {
    return str.match(regex).join("-").toLowerCase();
}
exports.toKebabCase = toKebabCase;
/**
 * Convert str to UpperCamelCase
 * @param str import string
 * @returns {string} output string
 */
function toUpperCamelCase(str) {
    return str.match(regex)
        .map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
        .join("");
}
exports.toUpperCamelCase = toUpperCamelCase;
async function getInstaller() {
    const installers = this.cli.getAvailablePackageManagers();
    if (installers.length === 1) {
        return installers[0];
    }
    // Prompt for the package manager of choice
    const defaultPackager = this.cli.getDefaultPackageManager();
    const { packager } = await (0, scaffold_utils_1.List)(this, "packager", "Pick a package manager:", installers, defaultPackager, this.force);
    return packager;
}
exports.getInstaller = getInstaller;
async function getTemplate() {
    if (this.supportedTemplates.includes(this.template)) {
        return this.template;
    }
    this.cli.logger.warn(`⚠ ${this.template} is not a valid template, please select one from below`);
    const { selectedTemplate } = await (0, scaffold_utils_1.List)(this, "selectedTemplate", "Select a valid template from below:", this.supportedTemplates, "default", false);
    return selectedTemplate;
}
exports.getTemplate = getTemplate;
