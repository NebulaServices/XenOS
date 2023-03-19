"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Confirm = exports.Input = exports.List = void 0;
function List(self, name, message, choices, defaultChoice, skip = false) {
    if (skip) {
        return { [name]: defaultChoice };
    }
    return self.prompt([{ choices, message, name, type: "list", default: defaultChoice }]);
}
exports.List = List;
function Input(self, name, message, defaultChoice, skip = false) {
    if (skip) {
        return { [name]: defaultChoice };
    }
    return self.prompt([{ default: defaultChoice, message, name, type: "input" }]);
}
exports.Input = Input;
function Confirm(self, name, message, defaultChoice = true, skip = false) {
    if (skip) {
        return { [name]: defaultChoice };
    }
    return self.prompt([{ default: defaultChoice, message, name, type: "confirm" }]);
}
exports.Confirm = Confirm;
