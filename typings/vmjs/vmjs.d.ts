declare module VmjsAjax {
  export interface Vmjs{
    require(moduleName: string): any;
    createNodeViewFromP4DJson(json): void;
  }
}

declare var vmjs: VmjsAjax.Vmjs;
