declare interface IServiceProvider {
  getService(key: any): IService;
  registerService(service: IService, key: any): void;
}

declare interface IService {}

declare namespace NodeJS {
  export interface Global {
    serviceProvider: IServiceProvider;
  }
}

declare var global: NodeJS.Global;

interface Window {
  serviceProvider: IServiceProvider;
}