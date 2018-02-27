"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toCamelCase(str, options) {
    if (options === void 0) { options = { toUpper: true }; }
    // https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case/32604073#32604073
    return str
        .replace(/^(.)/, function ($1) { return (options.toUpper ? $1.toUpperCase() : $1.toLowerCase()); })
        .replace(/[-_]+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .replace(/ (.)/g, function ($1) { return $1.toUpperCase(); })
        .replace(/ /g, '');
}
exports.default = toCamelCase;
//# sourceMappingURL=camel-case.js.map