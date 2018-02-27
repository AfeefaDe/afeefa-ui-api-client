"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DataTypes = /** @class */ (function () {
    function DataTypes() {
    }
    DataTypes.Boolean = {
        value: function (value) {
            return !!value;
        }
    };
    DataTypes.String = {
        value: function (value) {
            return typeof value === 'string' ? value : '';
        }
    };
    DataTypes.Array = {
        value: function (value) {
            return Array.isArray(value) ? value : [];
        }
    };
    DataTypes.Date = {
        value: function (value) {
            return !isNaN(Date.parse(value)) ? new Date(value) : null;
        }
    };
    DataTypes.Int = {
        value: function (value) {
            return value ? (parseInt(value, 10) || 0) : 0;
        }
    };
    DataTypes.Number = {
        value: function (value) {
            return value ? (parseFloat(value) || 0) : 0;
        }
    };
    DataTypes.Custom = {
        value: function (value) {
            return value;
        }
    };
    return DataTypes;
}());
exports.default = DataTypes;
//# sourceMappingURL=DataTypes.js.map