/**
 * Mock Firebase configuration to remove dependency for now
 */

export const auth: any = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Immediate callback with null user
    callback(null);
    return () => {};
  }
};

export const db: any = {};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, _operationType: OperationType, _path: string | null) {
  console.error('Firestore Error (Mock): ', error);
  throw error;
}
