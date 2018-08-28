export default class ReverseRelations {
    constructor() {
        this.relations = [];
        this.relationParamsMap = new Map();
    }
    static getDiff(relations1, relations2) {
        const notInR2 = relations1.relations.filter(r => {
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
        const notInR1 = relations2.relations.filter(r => !relations1.relations.includes(r));
        const uniqueRelations = notInR2.concat(notInR1);
        const relations = new ReverseRelations();
        uniqueRelations.forEach(r => {
            relations.add(r);
        });
        return relations;
    }
    toArray() {
        return this.relations;
    }
    add(relation, params) {
        this.relations.push(relation);
        if (params) {
            this.relationParamsMap.set(relation, params);
        }
    }
    addMany(relations, params) {
        relations.forEach(relation => {
            this.add(relation, params);
        });
    }
    reloadAlways(relation) {
        this.relations.push(relation);
        this.relationParamsMap.set(relation, ReverseRelations.FORCE_RELOAD);
    }
    reloadOnNextGet() {
        // console.log('reload')
        this.relations.forEach(r => {
            // console.log('---', r.info)
            r.reloadOnNextGet();
        });
    }
}
ReverseRelations.FORCE_RELOAD = '__forceReload__';
//# sourceMappingURL=ReverseRelations.js.map