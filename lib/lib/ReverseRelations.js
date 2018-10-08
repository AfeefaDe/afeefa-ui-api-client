var ReverseRelations = /** @class */ (function () {
    function ReverseRelations() {
        this.relations = [];
        this.relationParamsMap = new Map();
    }
    ReverseRelations.getDiff = function (relations1, relations2) {
        var notInR2 = relations1.relations.filter(function (r) {
            if (!relations2.relations.includes(r)) {
                return true;
            }
            if (relations1.relationParamsMap.get(r) === ReverseRelations.FORCE_RELOAD) {
                return true;
            }
            if (relations1.relationParamsMap.get(r) === relations2.relationParamsMap.get(r)) {
                return false;
            }
            return true;
        });
        var notInR1 = relations2.relations.filter(function (r) { return !relations1.relations.includes(r); });
        var uniqueRelations = notInR2.concat(notInR1);
        var relations = new ReverseRelations();
        uniqueRelations.forEach(function (r) {
            relations.add(r);
        });
        return relations;
    };
    ReverseRelations.prototype.toArray = function () {
        return this.relations;
    };
    ReverseRelations.prototype.add = function (relation, params) {
        this.relations.push(relation);
        if (params) {
            this.relationParamsMap.set(relation, params);
        }
    };
    ReverseRelations.prototype.addMany = function (relations, params) {
        var _this = this;
        relations.forEach(function (relation) {
            _this.add(relation, params);
        });
    };
    ReverseRelations.prototype.reloadAlways = function (relation) {
        this.relations.push(relation);
        this.relationParamsMap.set(relation, ReverseRelations.FORCE_RELOAD);
    };
    ReverseRelations.prototype.reloadOnNextGet = function () {
        // console.log('reload')
        this.relations.forEach(function (r) {
            // console.log('---', r.info)
            r.reloadOnNextGet();
        });
    };
    ReverseRelations.FORCE_RELOAD = '__forceReload__';
    return ReverseRelations;
}());
export default ReverseRelations;
//# sourceMappingURL=ReverseRelations.js.map