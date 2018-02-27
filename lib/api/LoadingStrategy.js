"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LoadingStrategy = /** @class */ (function () {
    function LoadingStrategy() {
    }
    // loads items if they are not fully loaded
    LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED = 2;
    // does not load if a cached item has been found
    LoadingStrategy.LOAD_IF_NOT_CACHED = 1;
    return LoadingStrategy;
}());
exports.default = LoadingStrategy;
//# sourceMappingURL=LoadingStrategy.js.map