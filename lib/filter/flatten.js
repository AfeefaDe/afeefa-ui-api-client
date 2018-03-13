export default function flatten(obj) {
    // https://gist.github.com/dominikwilkowski/ac65056fbb102b8003d6b33270a9d660
    return Object.assign({}, ...function _flatten(objectBit, path = '') {
        return [].concat(...Object.keys(objectBit).map(key => objectBit[key] && typeof objectBit[key] === 'object' ?
            _flatten(objectBit[key], `${path}.${key}`) :
            ({ [`${path}.${key}`]: objectBit[key] })));
    }(obj));
}
export const countKeys = (obj, level = 0) => {
    let numKeys = 0;
    if (level < 3 && obj && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            numKeys = numKeys + 1 + countKeys(obj[key], level + 1);
        }
    }
    return numKeys;
};
//# sourceMappingURL=flatten.js.map