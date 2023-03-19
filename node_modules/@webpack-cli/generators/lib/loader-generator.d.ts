import type { LoaderGeneratorOptions } from "./types";
/**
 * Formats a string into webpack loader format
 * (eg: 'style-loader', 'raw-loader')
 *
 * @param {string} name A loader name to be formatted
 * @returns {string} The formatted string
 */
export declare function makeLoaderName(name: string): string;
export declare const LoaderGenerator: import("./addon-generator").AddonGeneratorConstructor<LoaderGeneratorOptions, import("./types").CustomGeneratorOptions<LoaderGeneratorOptions>>;
export default LoaderGenerator;
