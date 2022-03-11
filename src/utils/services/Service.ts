import ServiceProvider from "./ServiceProvider";

export function serviceClass(key: any): ClassDecorator {
  return (target: any) => {
    ServiceProvider.getInstance().registerService(new target(), key);
  }
}

export default abstract class Service implements IService {
  private initialized: boolean = false;

  constructor(){}

  get isInitialized() {
    return this.initialized;
  }

  initState(...args: any[]) {
    this.initialized = true;
  }
}
