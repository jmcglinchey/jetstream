import type { ApplicationCookie, ElectronPreferences, SalesforceOrgUi } from '../libs/types/src';

// https://webpack.js.org/loaders/worker-loader/#integrating-with-typescript
declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare global {
  interface Window {
    electron?: {
      appCookie: ApplicationCookie;
      initialPreferences: ElectronPreferences;
      loadPreferences: () => Promise<ElectronPreferences>;
      savePreferences: (preferences: ElectronPreferences) => Promise<ElectronPreferences>;
      getAppVersion: () => Promise<string>;
      logout: () => void;
      onPreferencesChanged: (callback: (event: any, preferences: ElectronPreferences) => void) => void;
      platform: string;
      isElectron: boolean;
      isElectronDev: boolean;
      isFocused: () => boolean;
      // getServerSocket: () => Promise<string>;
      // ipcConnect: (is: string, func: (client: any) => void) => void;
      onOrgAdded: (callback: (event: any, org: SalesforceOrgUi, switchActiveOrg: boolean) => void) => void;
    };
    electronPreferences?: {
      initialPreferences: ElectronPreferences;
      loadPreferences: () => Promise<ElectronPreferences>;
      savePreferences: (preferences: ElectronPreferences) => Promise<ElectronPreferences>;
      pickDirectory: () => Promise<string | null>;
      platform: string;
      isElectron: boolean;
    };
  }

  /** Available only in secure contexts. */
  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
    removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  }

  declare var FileSystemDirectoryHandle: {
    prototype: FileSystemDirectoryHandle;
    new (): FileSystemDirectoryHandle;
  };

  /** Available only in secure contexts. */
  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>;
    getFile(): Promise<File>;
  }

  declare var FileSystemFileHandle: {
    prototype: FileSystemFileHandle;
    new (): FileSystemFileHandle;
  };

  /** Available only in secure contexts. */
  interface FileSystemHandle {
    readonly kind: FileSystemHandleKind;
    readonly name: string;
    isSameEntry(other: FileSystemHandle): Promise<boolean>;
  }

  declare var FileSystemHandle: {
    prototype: FileSystemHandle;
    new (): FileSystemHandle;
  };

  interface FileSystemGetDirectoryOptions {
    create?: boolean;
  }

  interface FileSystemGetFileOptions {
    create?: boolean;
  }

  interface FileSystemReadWriteOptions {
    at?: number;
  }

  interface FileSystemRemoveOptions {
    recursive?: boolean;
  }

  /** Available only in secure contexts. */
  interface FileSystemSyncAccessHandle {
    close(): void;
    flush(): void;
    getSize(): number;
    read(buffer: BufferSource, options?: FileSystemReadWriteOptions): number;
    truncate(newSize: number): void;
    write(buffer: BufferSource, options?: FileSystemReadWriteOptions): number;
  }

  declare var FileSystemSyncAccessHandle: {
    prototype: FileSystemSyncAccessHandle;
    new (): FileSystemSyncAccessHandle;
  };
}
