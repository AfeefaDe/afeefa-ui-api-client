import Relation from './Relation';
export default class AppRelation extends Relation {
    reloadOnNextGet(): void;
    listKey(): object;
}
