"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _cache = {};
var RequestCache = /** @class */ (function () {
    function RequestCache() {
    }
    RequestCache.prototype.addItem = function (key, promise) {
        _cache[key] = promise;
        promise.then(function (result) {
            delete _cache[key];
        }).catch(function (e) {
            delete _cache[key];
        });
    };
    RequestCache.prototype.hasItem = function (key) {
        return _cache[key] !== undefined;
    };
    RequestCache.prototype.getItem = function (key) {
        return _cache[key];
    };
    RequestCache.prototype.purgeItem = function (key) {
        delete _cache[key];
    };
    return RequestCache;
}());
exports.RequestCache = RequestCache;
exports.default = new RequestCache();
//# sourceMappingURL=RequestCache.js.map