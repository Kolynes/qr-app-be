import Service from "./Service";

export function service(serviceKey: any): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    Object.defineProperty(
      target, 
      propertyKey, 
      { value: ServiceProvider.getInstance().getService(serviceKey) }
    );
  }
}

export default class ServiceProvider implements IServiceProvider {
  private services = new Map<any, Service>();

  private constructor(){}

  static getInstance(): ServiceProvider {
    if(global.serviceProvider == undefined)
      global.serviceProvider = new ServiceProvider();
    return global.serviceProvider as ServiceProvider;
  }

  getService<S extends Service>(key: any): S {
    const service = this.services.get(key) as S;
    if(!service)
      throw new Error(`The service '${key}' is not registered`)
    if(!service.isInitialized)
      service.initState();
    return service;
  }

  registerService(service: Service, key: any) {
    if(this.services.has(key))
      throw new Error(`A service with this key '${key}' has already been registered`);
    else {
      this.services.set(key, service);
    }
  }
}