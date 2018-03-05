export default class BaseResource {
    constructor(...params) {
        this.url = '';
        this.Model = null;
        this.init(...params);
    }
    init(_params) {
        // hook into
    }
    getListType() {
        return this.getItemType();
    }
    getItemType(json) {
        return this.getItemModel(json).type;
    }
    getItemJson(json) {
        return json;
    }
    createItem(json) {
        const item = new (this.getItemModel(json))();
        item.id = json.id;
        return item;
    }
    transformList(_items) {
        // hook into
    }
    itemAdded(_item) {
        // hook into
    }
    itemDeleted(_item) {
        // hook into
    }
    itemSaved(_itemOld, _item) {
        // hook into
    }
    getItemModel(_json) {
        // hook into
        return this.Model;
    }
}
//# sourceMappingURL=BaseResource.js.map