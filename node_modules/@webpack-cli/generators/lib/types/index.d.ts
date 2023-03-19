import Generator from "yeoman-generator";
import { IWebpackCLI } from "webpack-cli";
export type InitOptions = {
    template: string;
    force?: boolean;
};
export type LoaderOptions = {
    template: string;
};
export type PluginOptions = {
    template: string;
};
export type InitGeneratorOptions = {
    generationPath: string;
} & InitOptions;
export type LoaderGeneratorOptions = {
    generationPath: string;
} & LoaderOptions;
export type PluginGeneratorOptions = {
    generationPath: string;
} & PluginOptions;
export type BaseCustomGeneratorOptions = {
    template: string;
    generationPath: string;
    force?: boolean;
};
export type CustomGeneratorOptions<T extends BaseCustomGeneratorOptions> = Generator.GeneratorOptions & {
    cli: IWebpackCLI;
    options: T;
};
export declare class CustomGenerator<T extends BaseCustomGeneratorOptions = BaseCustomGeneratorOptions, Z extends CustomGeneratorOptions<T> = CustomGeneratorOptions<T>> extends Generator<Z> {
    cli: IWebpackCLI;
    template: string;
    dependencies: string[];
    force: boolean;
    answers: Record<string, unknown>;
    generationPath: string;
    supportedTemplates: string[];
    packageManager: string | undefined;
    constructor(args: string | string[], opts: Z);
}
