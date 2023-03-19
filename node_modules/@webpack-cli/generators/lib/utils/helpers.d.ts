import { CustomGenerator } from "../types";
/**
 * Convert str to kebab-case
 * @param str input string
 * @returns output string
 */
export declare function toKebabCase(str: string): string;
/**
 * Convert str to UpperCamelCase
 * @param str import string
 * @returns {string} output string
 */
export declare function toUpperCamelCase(str: string): string;
export declare function getInstaller(this: CustomGenerator): Promise<string>;
export declare function getTemplate(this: CustomGenerator): Promise<string>;
