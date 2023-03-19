import Generator from "yeoman-generator";
type CustomGeneratorStringPrompt = {
    [x: string]: string;
} | Promise<{
    [x: string]: string;
}>;
type CustomGeneratorBoolPrompt = {
    [x: string]: boolean;
} | Promise<{
    [x: string]: boolean;
}>;
export declare function List(self: Generator, name: string, message: string, choices: string[], defaultChoice: string, skip?: boolean): CustomGeneratorStringPrompt;
export declare function Input(self: Generator, name: string, message: string, defaultChoice: string, skip?: boolean): CustomGeneratorStringPrompt;
export declare function Confirm(self: Generator, name: string, message: string, defaultChoice?: boolean, skip?: boolean): CustomGeneratorBoolPrompt;
export {};
