import { CustomGenerator } from "../types";
import * as QuestionAPI from "../utils/scaffold-utils";
export declare function questions(self: CustomGenerator, Question: typeof QuestionAPI, config?: Record<string, {
    skip?: boolean;
    required?: boolean;
}>): Promise<void>;
/**
 * Handles generation of project files
 * @param self Generator values
 */
export declare function generate(self: CustomGenerator): void;
