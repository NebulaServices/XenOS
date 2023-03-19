import Generator from "yeoman-generator";
import { CustomGenerator } from "./types";
import type { CustomGeneratorOptions, BaseCustomGeneratorOptions } from "./types";
declare abstract class AddonGenerator<T extends BaseCustomGeneratorOptions = BaseCustomGeneratorOptions, Z extends CustomGeneratorOptions<T> = CustomGeneratorOptions<T>> extends CustomGenerator<T, Z> {
    props: Generator.Question | undefined;
    resolvedTemplatePath: string | undefined;
}
export interface AddonGeneratorConstructor<T extends BaseCustomGeneratorOptions = BaseCustomGeneratorOptions, Z extends CustomGeneratorOptions<T> = CustomGeneratorOptions<T>> {
    new (args: string | string[], opts: Z): AddonGenerator<T, Z>;
}
declare const addonGenerator: <T extends BaseCustomGeneratorOptions = BaseCustomGeneratorOptions, Z extends CustomGeneratorOptions<T> = CustomGeneratorOptions<T>>(prompts: Generator.Questions, templateDir: string, templateFn: (instance: CustomGenerator<T, Z> & AddonGenerator<BaseCustomGeneratorOptions, CustomGeneratorOptions<BaseCustomGeneratorOptions>>) => Record<string, unknown>) => AddonGeneratorConstructor<T, Z>;
export default addonGenerator;
