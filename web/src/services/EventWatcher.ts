export class EventWatcher<Type> {
  watchers: Array<(value: Type) => void>;

  constructor() {
    this.watchers = [];
  }

  public subscribe(callback: (value: Type) => void) {
    this.watchers.push(callback);
  }

  public unsubscribe(callback: (value: Type) => void) {
    this.watchers = this.watchers.filter((cb) => cb !== callback);
  }

  public notify(value: Type) {
    this.watchers.forEach((callback) => callback(value));
  }
}