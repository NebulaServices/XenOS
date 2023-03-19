"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.questions = void 0;
const path_1 = __importDefault(require("path"));
const default_1 = require("./default");
const templatePath = path_1.default.resolve(__dirname, "../../init-template/react");
const resolveFile = (file) => {
    return path_1.default.resolve(templatePath, file);
};
/**
 * Asks questions including default ones to the user used to modify generation
 * @param self Generator values
 * @param Question Contains questions
 */
async function questions(self, Question) {
    await (0, default_1.questions)(self, Question, {
        langType: { required: true },
        devServer: { skip: true },
        htmlWebpackPlugin: { skip: true },
        workboxWebpackPlugin: {},
        cssType: {},
        isCSS: {},
        isPostCSS: {},
        extractPlugin: {},
    });
    // Add react dependencies
    self.dependencies.push("react@18", "react-dom@18");
    // Add webpack-dev-server always
    self.dependencies.push("webpack-dev-server");
    // Add html-webpack-plugin always
    self.dependencies.push("html-webpack-plugin");
    switch (self.answers.langType) {
        case "Typescript":
            self.dependencies.push("@types/react", "@types/react-dom");
            break;
        case "ES6":
            self.dependencies.push("@babel/preset-react");
            break;
    }
}
exports.questions = questions;
/**
 * Handles generation of project files
 * @param self Generator values
 */
function generate(self) {
    const files = ["./index.html", "./src/assets/webpack.png", "webpack.config.js", "package.json"];
    switch (self.answers.langType) {
        case "Typescript":
            self.answers.entry = "./src/index.tsx";
            files.push("tsconfig.json", "index.d.ts", "./src/App.tsx", self.answers.entry);
            break;
        case "ES6":
            self.answers.entry = "./src/index.js";
            files.push("./src/App.js", self.answers.entry);
            break;
    }
    switch (self.answers.cssType) {
        case "CSS only":
            files.push("./src/styles/global.css");
            break;
        case "SASS":
            files.push("./src/styles/global.scss");
            break;
        case "LESS":
            files.push("./src/styles/global.less");
            break;
        case "Stylus":
            files.push("./src/styles/global.styl");
            break;
    }
    for (const file of files) {
        self.fs.copyTpl(resolveFile(file + ".tpl"), self.destinationPath(file), self.answers);
    }
}
exports.generate = generate;
