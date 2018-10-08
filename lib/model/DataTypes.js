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
            if (typeof value === 'string') {
                return value;
            }
            if (typeof value === 'number') {
                return value + '';
            }
            return '';
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
export default DataTypes;
//# sourceMappingURL=DataTypes.js.map