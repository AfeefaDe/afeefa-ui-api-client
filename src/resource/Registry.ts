export class ResourceRegistry {
  private resources = {}

  public add (name, resource) {
    this.resources[name] = resource
  }

  public get (name) {
    if (!this.resources[name]) {
      console.error('error getting unknown Resource:', name)
    }
    return this.resources[name]
  }
}

export default new ResourceRegistry()
