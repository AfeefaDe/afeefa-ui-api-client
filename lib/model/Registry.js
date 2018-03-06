import ModelType from './Model';
export class ModelRegistry {
    constructor() {
        this.models = {};
    }
    register(Model) {
        this.models[Model.name] = Model;
        return Model;
    }
    initializeAll() {
        for (const name of Object.keys(this.models)) {
            const Model = this.models[name];
            this.checkType(Model);
            this.initializeAttributes(Model);
            this.initializeRelations(Model);
        }
    }
    checkType(Model) {
        if (!Model.hasOwnProperty('type')) {
            console.error('Das Model', Model.name, 'hat keinen Typ');
        }
    }
    initializeAttributes(Model) {
        const mixedAttrs = this.setupAttributes(Model);
        const attrs = {};
        // convert simple DataTypes attributes to IAttributeConfig
        // name: DataTypes.Int => name: { type: DataTypes.Int }
        for (const name of Object.keys(mixedAttrs)) {
            let attr = mixedAttrs[name];
            if (!attr.type) {
                attr = { type: attr };
            }
            attrs[name] = attr;
        }
        const attributeRemoteNameMap = {};
        for (const name of Object.keys(attrs)) {
            const attr = attrs[name];
            if (attr.remoteName) {
                attributeRemoteNameMap[attr.remoteName] = name;
            }
        }
        Model._attributes = attrs;
        Model._attributeRemoteNameMap = attributeRemoteNameMap;
    }
    setupAttributes(Model) {
        let attributes = {};
        if (Model !== ModelType) {
            const superAttrs = this.setupAttributes(Object.getPrototypeOf(Model));
            attributes = superAttrs;
        }
        if (Model.hasOwnProperty('attributes')) {
            attributes = Object.assign({}, attributes, Model.attributes());
        }
        return attributes;
    }
    initializeRelations(Model) {
        const relations = this.setupRelations(Model);
        const relationRemoteNameMap = {};
        for (const name of Object.keys(relations)) {
            const relation = relations[name];
            if (relation.remoteName) {
                relationRemoteNameMap[relation.remoteName] = name;
            }
        }
        Model._relations = relations;
        Model._relationRemoteNameMap = relationRemoteNameMap;
    }
    setupRelations(Model) {
        let relations = {};
        if (Model !== ModelType) {
            const superRelations = this.setupRelations(Object.getPrototypeOf(Model));
            relations = superRelations;
        }
        relations = Object.assign({}, relations, Model.relations());
        return relations;
    }
}
export default new ModelRegistry();
//# sourceMappingURL=Registry.js.map