import type { firestore } from 'firebase-admin';
/**
 * Params for attachCustomCommand function for
 * attaching custom commands.
 */
export interface AttachCustomCommandParams {
    Cypress: any;
    cy: any;
    firebase: any;
    app?: any;
}
/**
 * Action for Firestore
 */
export type FirestoreAction = 'get' | 'add' | 'set' | 'update' | 'delete';
/**
 * Data from loaded fixture
 */
export interface FixtureData {
    [k: string]: any;
}
export type WhereOptions = [string, FirebaseFirestore.WhereFilterOp, any];
/**
 * Options for callFirestore custom Cypress command.
 */
export interface CallFirestoreOptions {
    /**
     * Whether or not to include createdAt and createdBy
     */
    withMeta?: boolean;
    /**
     * Merge during set
     */
    merge?: boolean;
    /**
     * Size of batch to use while deleting
     */
    batchSize?: number;
    /**
     * Filter documents by the specified field and the value should satisfy
     * the relation constraint provided
     */
    where?: WhereOptions | WhereOptions[];
    /**
     * Order documents
     */
    orderBy?: string | [string, FirebaseFirestore.OrderByDirection];
    /**
     * Limit to n number of documents
     */
    limit?: number;
    /**
     * Limit to last n number of documents
     */
    limitToLast?: number;
    /**
     * Firestore statics (i.e. admin.firestore). This should only be needed during
     * testing due to @firebase/testing not containing statics
     */
    statics?: typeof firestore;
}
/**
 * Action for Real Time Database
 */
export type RTDBAction = 'push' | 'remove' | 'set' | 'update' | 'delete' | 'get';
/**
 * Options for callRtdb commands
 */
export interface CallRtdbOptions {
    /**
     * Whether or not to include meta data
     */
    withMeta?: boolean;
    /**
     * Limit to the last <num> results.
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#limittolast
     */
    limitToLast?: number;
    /**
     * Limit to the first <num> results.
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#limittofirst
     */
    limitToFirst?: number;
    /**
     * Select a child key by which to order results
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#orderbychild
     */
    orderByChild?: string;
    /**
     * Order by key name
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#orderbykey
     */
    orderByKey?: boolean;
    /**
     * Order by primitive value
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#orderbyvalue
     */
    orderByValue?: boolean;
    /**
     * Creates a Query with the specified starting point.
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#startat
     */
    startAt?: number | string | boolean | null | [number | string | boolean | null, string];
    /**
     * Creates a Query with the specified starting point.
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#startafter
     */
    startAfter?: number | string | boolean | null | [number | string | boolean | null, string];
    /**
     * End results after <val, key> (based on specified ordering)
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#endbefore
     */
    endBefore?: number | string | boolean | null | [number | string | boolean | null, string];
    /**
     * End results at <val> (based on specified ordering)
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#endat
     */
    endAt?: number | string | boolean | null | [number | string | boolean | null, string];
    /**
     * Restrict results to <val> (based on specified ordering)
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Query#equalto
     */
    equalTo?: number | string | boolean | null | [number | string | boolean | null, string];
}
declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Login to Firebase auth as a user with either a passed uid or the TEST_UID
             * environment variable. A custom auth token is generated using firebase-admin
             * authenticated with serviceAccount.json or SERVICE_ACCOUNT env var.
             * @see https://github.com/prescottprue/cypress-firebase#cylogin
             * @param uid - UID of user to login as
             * @param customClaims - Custom claims to attach to the custom token
             * @param tenantId - Optional ID of tenant used for multi-tenancy. Can also be set with environment variable TEST_TENANT_ID
             * @example <caption>Env Based Login (TEST_UID)</caption>
             * cy.login()
             * @example <caption>Passed UID</caption>
             * cy.login('123SOMEUID')
             */
            login: (uid?: string, customClaims?: any, tenantId?: string) => Chainable;
            /**
             * Log current user out of Firebase Auth
             * @see https://github.com/prescottprue/cypress-firebase#cylogout
             * @example
             * cy.logout()
             */
            logout: () => Chainable;
            /**
             * Call Real Time Database path with some specified action. Authentication is through
             * `FIREBASE_TOKEN` (CI token) since firebase-tools is used under the hood, allowing
             * for admin privileges.
             * @param action - The action type to call with (set, push, update, remove)
             * @param actionPath - Path within RTDB that action should be applied
             * @param dataOrOptions - Data to be used in write action or options to be used for query
             * @param options - Options object
             * @see https://github.com/prescottprue/cypress-firebase#cycallrtdb
             * @example <caption>Set Data</caption>
             * const fakeProject = { some: 'data' }
             * cy.callRtdb('set', 'projects/ABC123', fakeProject)
             * @example <caption>Set Data With Meta Data</caption>
             * const fakeProject = { some: 'data' }
             * // Adds createdAt and createdBy (current user's uid) on data
             * cy.callRtdb('set', 'projects/ABC123', fakeProject, { withMeta: true })
             */
            callRtdb: (action: RTDBAction, actionPath: string, dataOrOptions?: FixtureData | string | boolean | CallRtdbOptions, options?: CallRtdbOptions) => Chainable;
            /**
             * Delete a collection or document from Firestore. Authentication is through serviceAccount.json or SERVICE_ACCOUNT
             * environment variable.
             * @param action This call will perform a deletion
             * @param deletePath The path within Firestore to delete - if it has an odd number of segments, it will delete
             *                     the document, otherwise it will delete the collection
             * @param options Options to be used when calling Firestore
             * @example <caption>Delete a document</caption>
             * cy.callFirestore('delete', 'project/test-project')
             * @example <caption>Delete all documents in a collection</caption>
             * cy.callFirestore('delete', 'project')
             */
            callFirestore(action: 'delete', deletePath: string, options?: CallFirestoreOptions): Chainable;
            /**
             * Set, or add a document to Firestore. Authentication is through serviceAccount.json or SERVICE_ACCOUNT
             * environment variable.
             * @param action This call will add or set a document
             * @param writePath The path within Firestore where the data should be written
             * @param data The data to be used in the write action
             * @param options Options to be used when calling Firestore
             * @example <caption>Set Data</caption>
             * const project = { some: 'data' }
             * cy.callFirestore('set', 'project/test-project', project)
             * @example <caption>Add New Document</caption>
             * const project = { some: 'data' }
             * cy.callFirestore('add', 'projects', project)
             * @example <caption>Passing A Fixture</caption>
             * cy.fixture('fakeProject.json').then((project) => {
             *   cy.callFirestore('add', 'projects', project)
             * })
             */
            callFirestore<T = firestore.DocumentData>(action: 'set' | 'add', writePath: string, data: firestore.PartialWithFieldValue<T>, options?: CallFirestoreOptions): Chainable;
            /**
             * Update an existing document in Firestore. Authentication is through serviceAccount.json or SERVICE_ACCOUNT
             * environment variable.
             * @param action This call will update an existing document
             * @param writePath The path within Firestore where the existing document is
             * @param data The data to be used in the update action, which is a partial update of the document, with field paths
             * @param options Options to be used when calling Firestore
             */
            callFirestore<T = firestore.DocumentData>(action: 'update', writePath: string, data: firestore.UpdateData<T>, options?: CallFirestoreOptions): Chainable;
            /**
             * Get an existing document from Firestore. Authentication is through serviceAccount.json or SERVICE_ACCOUNT
             * environment variable.
             * @param action This call will get an existing document
             * @param getPath The path within Firestore where the existing document is
             * @param options Options to be used when calling Firestore
             * @see https://github.com/prescottprue/cypress-firebase#cycallfirestore
             * @example <caption>Basic Get</caption>
             * cy.callFirestore('get', 'projects/test-project').then((project) => {
             *   cy.log('Project:', project)
             * })
             */
            callFirestore(action: 'get', getPath: string, options?: CallFirestoreOptions): Chainable;
        }
    }
}
interface CommandNamespacesConfig {
    login?: string;
    logout?: string;
    callRtdb?: string;
    callFirestore?: string;
    getAuthUser?: string;
}
interface CustomCommandOptions {
    commandNames?: CommandNamespacesConfig;
    tenantId?: string;
}
/**
 * Attach custom commands including cy.login, cy.logout, cy.callRtdb,
 * @param context - Context values passed from Cypress environment
 * custom command attachment
 * @param options - Custom command options
 */
export default function attachCustomCommands(context: AttachCustomCommandParams, options?: CustomCommandOptions): void;
export {};
