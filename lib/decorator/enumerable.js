export function enumerable(isEnumarable) {
    return function (target, key) {
        // https://github.com/endel/nonenumerable/blob/master/src/index.ts
        Object.defineProperty(target, key, {
            get: function () { return undefined; },
            set: function (value) {
                if (this.value === undefined) {
                    Object.defineProperty(this, key, {
                        value: value,
                        writable: true,
                        enumerable: isEnumarable,
                        configurable: true
                    });
                }
                else {
                    this.value = value;
                }
            },
            enumerable: isEnumarable
        });
    };
}
//# sourceMappingURL=enumerable.js.map