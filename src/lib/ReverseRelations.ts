import Relation from '../model/Relation'

export default class ReverseRelations {
  public static getDiff (relations1: ReverseRelations, relations2: ReverseRelations): ReverseRelations {
    const notInR2 = relations1.relations.filter(r => {
      if (!relations2.relations.includes(r)) {
        return true
      }
      if (relations1.relationParamsMap.get(r) === ReverseRelations.FORCE_RELOAD) {
        return true
      }
      if (relations1.relationParamsMap.get(r) === relations2.relationParamsMap.get(r)) {
        return false
      }
      return true
    })

    const notInR1 = relations2.relations.filter(r => !relations1.relations.includes(r))

    const uniqueRelations = notInR2.concat(notInR1)

    const relations = new ReverseRelations()
    uniqueRelations.forEach(r => {
      relations.add(r)
    })
    return relations
  }

  private static FORCE_RELOAD: string = '__forceReload__'

  private relations: Relation[] = []
  private relationParamsMap: Map<Relation, string> = new Map()

  public toArray (): Relation[] {
    return this.relations
  }

  public add (relation: Relation, params?: string) {
    this.relations.push(relation)
    if (params) {
      this.relationParamsMap.set(relation, params)
    }
  }

  public reloadAlways (relation: Relation) {
    this.relations.push(relation)
    this.relationParamsMap.set(relation, ReverseRelations.FORCE_RELOAD)
  }

  public reloadOnNextGet () {
    // console.log('reload')
    this.relations.forEach(r => {
      // console.log('---', r.info)
      r.reloadOnNextGet()
    })
  }
}
