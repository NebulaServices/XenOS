import { CustomGenerator } from "../types";
import * as QuestionAPI from "../utils/scaffold-utils";
/**
 * Asks questions including default ones to the user used to modify generation
 * @param self Generator values
 * @param Question Contains questions
 */
export declare function questions(self: CustomGenerator, Question: typeof QuestionAPI): Promise<void>;
/**
 * Handles generation of project files
 * @param self Generator values
 */
export declare function generate(self: CustomGenerator): void;
