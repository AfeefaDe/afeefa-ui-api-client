var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(response) {
        var _this = _super.call(this) || this;
        _this.name = 'ApiError';
        _this.message = getErrorDescription(response);
        _this.response = response;
        return _this;
    }
    return ApiError;
}(Error));
export default ApiError;
function getErrorDescription(response) {
    var description = '';
    if (response.body && response.body.errors) {
        for (var _i = 0, _a = response.body.errors; _i < _a.length; _i++) {
            var error = _a[_i];
            description += (error.detail || error) + '\n';
        }
    }
    else if (response.body && response.body.exception) {
        description = response.body.exception;
    }
    else if (response.body && response.body.error) {
        description = response.body.error;
    }
    else {
        description = response.statusText || response + '';
    }
    return description;
}
//# sourceMappingURL=ApiError.js.map