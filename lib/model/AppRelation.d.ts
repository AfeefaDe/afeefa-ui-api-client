import Relation from './Relation';
export default class AppRelation extends Relation {
    purgeFromCacheAndMarkInvalid(): void;
    listKey(): object;
}
