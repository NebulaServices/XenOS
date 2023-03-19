import addonGenerator from "./addon-generator";
import initGenerator from "./init-generator";
import { IWebpackCLI } from "webpack-cli";
declare class GeneratorsCommand {
    apply(cli: IWebpackCLI): Promise<void>;
}
export default GeneratorsCommand;
export { addonGenerator, initGenerator };
