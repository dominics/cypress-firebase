import type { AppOptions, app, firestore } from 'firebase-admin';
import { CallFirestoreOptions, WhereOptions } from './attachCustomCommands';
/**
 * Check whether a value is a string or not
 * @param valToCheck - Value to check
 * @returns Whether or not value is a string
 */
export declare function isString(valToCheck: any): boolean;
/**
 * Initialize Firebase instance from service account (from either local
 * serviceAccount.json or environment variables)
 * @returns Initialized Firebase instance
 * @param adminInstance - firebase-admin instance to initialize
 * @param overrideConfig - firebase-admin instance to initialize
 */
export declare function initializeFirebase(adminInstance: any, overrideConfig?: AppOptions): app.App;
/**
 * Check with or not a slash path is the path of a document
 * @param slashPath - Path to check for whether or not it is a doc
 * @returns Whether or not slash path is a document path
 */
export declare function isDocPath(slashPath: string): boolean;
/**
 * Apply where setting to reference
 * @param ref - Reference
 * @param whereSetting - Where options
 * @param firestoreStatics - Firestore statics
 * @returns Refere with where applied
 */
export declare function applyWhere(ref: firestore.CollectionReference | firestore.Query, whereSetting: WhereOptions, firestoreStatics: app.App['firestore']): firestore.Query;
/**
 * Convert slash path to Firestore reference
 * @param firestoreStatics - Firestore instance statics (invoking gets instance)
 * @param slashPath - Path to convert into firestore reference
 * @param options - Options object
 * @returns Ref at slash path
 */
export declare function slashPathToFirestoreRef(firestoreStatics: app.App['firestore'], slashPath: string, options?: CallFirestoreOptions): firestore.CollectionReference | firestore.DocumentReference | firestore.Query;
/**
 * @param db - Firestore database instance
 * @param refOrQuery - Firestore instance
 * @param options - Call Firestore options
 * @returns Promise which resolves with results of deleting batch
 */
export declare function deleteCollection(db: any, refOrQuery: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query, options?: CallFirestoreOptions): Promise<any>;
