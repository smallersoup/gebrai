/**
 * Global type declarations for GeoGebra integration
 */

declare global {
  interface Window {
    ggbApplet: {
      evalCommand(command: string): boolean;
      evalCommandGetLabels(command: string): string;
      deleteObject(objName: string): void;
      exists(objName: string): boolean;
      isDefined(objName: string): boolean;
      getAllObjectNames(type?: string): string[];
      getObjectType(objName: string): string;
      getValue(objName: string): number;
      getValueString(objName: string): string;
      getVisible(objName: string): boolean;
      getXcoord(objName: string): number;
      getYcoord(objName: string): number;
      getZcoord(objName: string): number;
      getColor(objName: string): string;
      newConstruction(): void;
      reset(): void;
      refreshViews(): void;
    };
    ggbReady: boolean;
    ggbOnInit: () => void;
  }
}

export {}; 