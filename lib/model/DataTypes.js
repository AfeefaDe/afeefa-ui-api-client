export default class DataTypes {
}
DataTypes.Boolean = {
    value(value) {
        return !!value;
    }
};
DataTypes.String = {
    value(value) {
        return typeof value === 'string' ? value : '';
    }
};
DataTypes.Array = {
    value(value) {
        return Array.isArray(value) ? value : [];
    }
};
DataTypes.Date = {
    value(value) {
        return !isNaN(Date.parse(value)) ? new Date(value) : null;
    }
};
DataTypes.Int = {
    value(value) {
        return value ? (parseInt(value, 10) || 0) : 0;
    }
};
DataTypes.Number = {
    value(value) {
        return value ? (parseFloat(value) || 0) : 0;
    }
};
DataTypes.Custom = {
    value(value) {
        return value;
    }
};
//# sourceMappingURL=DataTypes.js.map