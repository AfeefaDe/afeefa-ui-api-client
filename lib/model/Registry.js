var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import Resource from '../resource/Resource';
import App from './App';
import ModelType from './Model';
var ModelRegistry = /** @class */ (function () {
    function ModelRegistry() {
        this.models = {};
    }
    ModelRegistry.prototype.add = function (Model) {
        this.models[Model.type] = Model;
        return Model;
    };
    ModelRegistry.prototype.initializeAll = function () {
        for (var _i = 0, _a = Object.keys(this.models); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var Model = this.models[name_1];
            this.checkType(Model);
            this.initializeResource(Model);
        }
        // make sure all model are initialized when
        // setting up relations
        for (var _b = 0, _c = Object.keys(this.models); _b < _c.length; _b++) {
            var name_2 = _c[_b];
            var Model = this.models[name_2];
            this.initializeAttributes(Model);
            this.initializeRelations(Model);
        }
    };
    ModelRegistry.prototype.checkType = function (Model) {
        if (!Model.hasOwnProperty('type')) {
            throw new Error("Das Model " + Model.name + " hat keinen type");
        }
    };
    ModelRegistry.prototype.initializeResource = function (Model) {
        var relation = App.getRelationByModel(Model);
        var resource = null;
        if (Model.Resource) {
            // custom resource is configured for Model
            resource = new Model.Resource(Resource.TYPE_MODEL, relation);
        }
        else if (Model.ResourceUrl) {
            // create a default resource by using the specified url
            resource = new Resource(Resource.TYPE_MODEL, relation);
            resource.url = Model.ResourceUrl;
        }
        else {
            // create a default resource (experimentally)
            resource = new Resource(Resource.TYPE_MODEL, relation);
        }
        if (resource) {
            Model.Query = resource;
            relation.Query = resource;
        }
    };
    ModelRegistry.prototype.initializeAttributes = function (Model) {
        var mixedAttrs = this.setupAttributes(Model);
        var attrs = {};
        // convert simple DataTypes attributes to IAttributeConfig
        // name: DataTypes.Int => name: { type: DataTypes.Int }
        for (var _i = 0, _a = Object.keys(mixedAttrs); _i < _a.length; _i++) {
            var name_3 = _a[_i];
            var attr = mixedAttrs[name_3];
            if (!attr.type) {
                attr = { type: attr };
            }
            attrs[name_3] = attr;
        }
        var attributeRemoteNameMap = {};
        for (var _b = 0, _c = Object.keys(attrs); _b < _c.length; _b++) {
            var name_4 = _c[_b];
            var attr = attrs[name_4];
            if (attr.remoteName) {
                attributeRemoteNameMap[attr.remoteName] = name_4;
            }
        }
        Model._attributes = attrs;
        Model._attributeRemoteNameMap = attributeRemoteNameMap;
    };
    ModelRegistry.prototype.setupAttributes = function (Model) {
        var attributes = {};
        if (Model !== ModelType) {
            var superAttrs = this.setupAttributes(Object.getPrototypeOf(Model));
            attributes = superAttrs;
        }
        if (Model.hasOwnProperty('attributes')) {
            attributes = __assign({}, attributes, Model.attributes());
        }
        return attributes;
    };
    ModelRegistry.prototype.initializeRelations = function (Model) {
        var relations = this.setupRelations(Model);
        var relationRemoteNameMap = {};
        for (var _i = 0, _a = Object.keys(relations); _i < _a.length; _i++) {
            var name_5 = _a[_i];
            var relation = relations[name_5];
            if (relation.remoteName) {
                relationRemoteNameMap[relation.remoteName] = name_5;
            }
        }
        Model._relations = relations;
        Model._relationRemoteNameMap = relationRemoteNameMap;
    };
    ModelRegistry.prototype.setupRelations = function (Model) {
        var relations = {};
        if (Model !== ModelType) {
            var superRelations = this.setupRelations(Object.getPrototypeOf(Model));
            relations = superRelations;
        }
        relations = __assign({}, relations, Model.relations());
        return relations;
    };
    return ModelRegistry;
}());
export { ModelRegistry };
export default new ModelRegistry();
//# sourceMappingURL=Registry.js.map