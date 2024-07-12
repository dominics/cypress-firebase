import type { firestore, auth, app } from 'firebase-admin';
import { FixtureData, FirestoreAction, RTDBAction, CallRtdbOptions, CallFirestoreOptions, AttachCustomCommandParams } from './attachCustomCommands';
/**
 * Convert unique data types which have been stringified and parsed back
 * into their original type.
 * @param dataVal - Value of data
 * @param firestoreStatics - Statics from firestore instance
 * @returns Value converted into timestamp object if possible
 */
export declare function convertValueToTimestampOrGeoPointIfPossible(dataVal: any, firestoreStatics: typeof firestore): firestore.FieldValue;
/**
 * @param adminInstance - firebase-admin instance
 * @param action - Action to run
 * @param actionPath - Path in RTDB
 * @param options - Query options
 * @param data - Data to pass to action
 * @returns Promise which resolves with results of calling RTDB
 */
export declare function callRtdb(adminInstance: any, action: RTDBAction, actionPath: string, options?: CallRtdbOptions, data?: FixtureData | string | boolean): Promise<any>;
/**
 * @param adminInstance - firebase-admin instance
 * @param action - Action to run
 * @param actionPath - Path to collection or document within Firestore
 * @param options - Query options
 * @param data - Data to pass to action
 * @returns Promise which resolves with results of calling Firestore
 */
export declare function callFirestore(adminInstance: app.App, action: FirestoreAction, actionPath: string, options?: CallFirestoreOptions, data?: FixtureData): Promise<any>;
/**
 * Create a Firebase Auth user
 * @param adminInstance - Admin SDK instance
 * @param properties - The properties to set on the new user record to be created
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
export declare function authCreateUser(adminInstance: any, properties: auth.CreateRequest, tenantId?: string): Promise<auth.UserRecord | 'auth/email-already-exists' | 'auth/phone-number-already-exists'>;
/**
 * Import list of Firebase Auth users
 * @param adminInstance - Admin SDK instance
 * @param usersImport - The list of user records to import to Firebase Auth
 * @param importOptions - Optional options for the user import
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves when the operation completes with the result of the import
 */
export declare function authImportUsers(adminInstance: any, usersImport: auth.UserImportRecord[], importOptions?: auth.UserImportOptions, tenantId?: string): Promise<auth.UserImportResult>;
/**
 * List Firebase Auth users
 * @param adminInstance - Admin SDK instance
 * @param maxResults - The page size, 1000 if undefined
 * @param pageToken - The next page token
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves with the current batch of downloaded users and the next page token
 */
export declare function authListUsers(adminInstance: any, maxResults?: number, pageToken?: string, tenantId?: string): Promise<auth.ListUsersResult>;
/**
 * Get Firebase Auth user based on UID
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user whose data to fetch
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
export declare function authGetUser(adminInstance: any, uid: string, tenantId?: string): Promise<auth.UserRecord | 'auth/user-not-found'>;
/**
 * Get Firebase Auth user based on email
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user whose data to fetch
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
export declare function authGetUserByEmail(adminInstance: any, email: string, tenantId?: string): Promise<auth.UserRecord | 'auth/user-not-found'>;
/**
 * Get Firebase Auth user based on phone number
 * @param adminInstance - Admin SDK instance
 * @param phoneNumber - Phone number of the user whose data to fetch
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
export declare function authGetUserByPhoneNumber(adminInstance: any, phoneNumber: string, tenantId?: string): Promise<auth.UserRecord | 'auth/user-not-found'>;
/**
 * Get Firebase Auth user based on phone number
 * @param adminInstance - Admin SDK instance
 * @param providerId - The Provider ID
 * @param uid - The user identifier for the given provider
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
export declare function authGetUserByProviderUid(adminInstance: any, providerId: string, uid: string, tenantId?: string): Promise<auth.UserRecord | 'auth/user-not-found'>;
/**
 * Get Firebase Auth users based on identifiers
 * @param adminInstance - Admin SDK instance
 * @param identifiers - The identifiers used to indicate which user records should be returned.
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a GetUsersResult object
 */
export declare function authGetUsers(adminInstance: any, identifiers: auth.UserIdentifier[], tenantId?: string): Promise<auth.GetUsersResult>;
/**
 * Update an existing Firebase Auth user
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user to edit
 * @param properties - The properties to update on the user
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves with a UserRecord
 */
export declare function authUpdateUser(adminInstance: any, uid: string, properties: auth.UpdateRequest, tenantId?: string): Promise<auth.UserRecord>;
/**
 * Delete multiple Firebase Auth users
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user to edit
 * @param customClaims - The custom claims to set, null deletes the custom claims
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves with null when the operation completes
 */
export declare function authSetCustomUserClaims(adminInstance: any, uid: string, customClaims: object | null, tenantId?: string): Promise<null>;
/**
 * Delete a Firebase Auth user
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user to delete
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves to null when user is deleted
 */
export declare function authDeleteUser(adminInstance: any, uid: string, tenantId?: string): Promise<null>;
/**
 * Delete multiple Firebase Auth users
 * @param adminInstance - Admin SDK instance
 * @param uids - Array of UIDs of the users to delete
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves to a DeleteUsersResult object
 */
export declare function authDeleteUsers(adminInstance: any, uids: string[], tenantId?: string): Promise<auth.DeleteUsersResult>;
/**
 * Create a custom token
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of user for which the custom token will be generated
 * @param customClaims - Optional custom claims to include in the token
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a custom Firebase Auth token
 */
export declare function authCreateCustomToken(adminInstance: any, uid: string, customClaims?: object, tenantId?: string): Promise<string>;
/**
 * Create a session cookie
 * @param adminInstance - Admin SDK instance
 * @param idToken - Firebase ID token
 * @param sessionCookieOptions - Session cookie options
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a session cookie
 */
export declare function authCreateSessionCookie(adminInstance: any, idToken: string, sessionCookieOptions: auth.SessionCookieOptions, tenantId?: string): Promise<string>;
/**
 * Verify a Firebase ID token
 * @param adminInstance - Admin SDK instance
 * @param idToken - Firebase ID token
 * @param checkRevoked - Whether to check if the token is revoked
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a decoded ID token
 */
export declare function authVerifyIdToken(adminInstance: any, idToken: string, checkRevoked?: boolean, tenantId?: string): Promise<auth.DecodedIdToken>;
/**
 * Revoke all refresh tokens for a user
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user for which to revoke tokens
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves when the operation completes
 */
export declare function authRevokeRefreshTokens(adminInstance: any, uid: string, tenantId?: string): Promise<void>;
/**
 * Generate an email verification link
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user
 * @param actionCodeSettings - Action code settings
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the email verification link
 */
export declare function authGenerateEmailVerificationLink(adminInstance: any, email: string, actionCodeSettings?: auth.ActionCodeSettings, tenantId?: string): Promise<string>;
/**
 * Generate a password reset link
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user
 * @param actionCodeSettings - Action code settings
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the password reset link
 */
export declare function authGeneratePasswordResetLink(adminInstance: any, email: string, actionCodeSettings?: auth.ActionCodeSettings, tenantId?: string): Promise<string>;
/**
 * Generate a sign-in with email link
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user
 * @param actionCodeSettings - Action code settings
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the sign-in with email link
 */
export declare function authGenerateSignInWithEmailLink(adminInstance: any, email: string, actionCodeSettings: auth.ActionCodeSettings, tenantId?: string): Promise<string>;
/**
 * Generate a link for email verification and email change
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user
 * @param newEmail - New email of the user
 * @param actionCodeSettings - Action code settings
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the email verification link
 */
export declare function authGenerateVerifyAndChangeEmailLink(adminInstance: any, email: string, newEmail: string, actionCodeSettings?: auth.ActionCodeSettings, tenantId?: string): Promise<string>;
/**
 * Create a provider configuration
 * @param adminInstance - Admin SDK instance
 * @param providerConfig - The provider configuration
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the provider configuration
 */
export declare function authCreateProviderConfig(adminInstance: any, providerConfig: auth.AuthProviderConfig, tenantId?: string): Promise<auth.AuthProviderConfig>;
/**
 * Get a provider configuration
 * @param adminInstance - Admin SDK instance
 * @param providerId - The provider ID
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the provider configuration
 */
export declare function authGetProviderConfig(adminInstance: any, providerId: string, tenantId?: string): Promise<auth.AuthProviderConfig>;
/**
 * List provider configurations
 * @param adminInstance - Admin SDK instance
 * @param providerFilter - The provider filter
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the provider configurations
 */
export declare function authListProviderConfigs(adminInstance: any, providerFilter: auth.AuthProviderConfigFilter, tenantId?: string): Promise<auth.ListProviderConfigResults>;
/**
 * Update a provider configuration
 * @param adminInstance - Admin SDK instance
 * @param providerId - The provider ID
 * @param providerConfig - The provider configuration
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the provider configuration
 */
export declare function authUpdateProviderConfig(adminInstance: any, providerId: string, providerConfig: auth.AuthProviderConfig, tenantId?: string): Promise<auth.AuthProviderConfig>;
/**
 * Delete a provider configuration
 * @param adminInstance - Admin SDK instance
 * @param providerId - The provider ID
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves to null when the operation completes
 */
export declare function authDeleteProviderConfig(adminInstance: any, providerId: string, tenantId?: string): Promise<null>;
/**
 * Object containing all tasks created by the plugin
 */
declare const tasks: {
    callRtdb: typeof callRtdb;
    callFirestore: typeof callFirestore;
    authCreateUser: typeof authCreateUser;
    authImportUsers: typeof authImportUsers;
    authListUsers: typeof authListUsers;
    authGetUser: typeof authGetUser;
    authGetUserByEmail: typeof authGetUserByEmail;
    authGetUserByPhoneNumber: typeof authGetUserByPhoneNumber;
    authGetUserByProviderUid: typeof authGetUserByProviderUid;
    authGetUsers: typeof authGetUsers;
    authUpdateUser: typeof authUpdateUser;
    authSetCustomUserClaims: typeof authSetCustomUserClaims;
    authDeleteUser: typeof authDeleteUser;
    authDeleteUsers: typeof authDeleteUsers;
    authCreateCustomToken: typeof authCreateCustomToken;
    authCreateSessionCookie: typeof authCreateSessionCookie;
    authVerifyIdToken: typeof authVerifyIdToken;
    authRevokeRefreshTokens: typeof authRevokeRefreshTokens;
    authGenerateEmailVerificationLink: typeof authGenerateEmailVerificationLink;
    authGeneratePasswordResetLink: typeof authGeneratePasswordResetLink;
    authGenerateSignInWithEmailLink: typeof authGenerateSignInWithEmailLink;
    authGenerateVerifyAndChangeEmailLink: typeof authGenerateVerifyAndChangeEmailLink;
    authCreateProviderConfig: typeof authCreateProviderConfig;
    authGetProviderConfig: typeof authGetProviderConfig;
    authListProviderConfigs: typeof authListProviderConfigs;
    authUpdateProviderConfig: typeof authUpdateProviderConfig;
    authDeleteProviderConfig: typeof authDeleteProviderConfig;
};
/**
 * Type of all the names of tasks created by the plugin
 */
export type TaskName = keyof typeof tasks;
/**
 * Given a tuple, return a tuple with the first element dropped
 */
type DropFirstElem<T extends any[]> = T extends [any, ...infer U] ? U : never;
/**
 * Given a task name, return the parameters of the task
 */
export type TaskNameToParams<TN extends TaskName> = DropFirstElem<Parameters<(typeof tasks)[TN]>>;
/**
 * Given a task name, return the return type of the task
 */
export type TaskNameToReturn<TN extends TaskName> = ReturnType<(typeof tasks)[TN]>;
/**
 * Object mapping task names to their settings keys
 */
export declare const taskSettingKeys: {
    readonly callRtdb: readonly ["action", "path", "options", "data"];
    readonly callFirestore: readonly ["action", "path", "options", "data"];
    readonly authCreateUser: readonly ["properties", "tenantId"];
    readonly authImportUsers: readonly ["usersImport", "importOptions", "tenantId"];
    readonly authListUsers: readonly ["maxResults", "pageToken", "tenantId"];
    readonly authGetUser: readonly ["uid", "tenantId"];
    readonly authGetUserByEmail: readonly ["email", "tenantId"];
    readonly authGetUserByPhoneNumber: readonly ["phoneNumber", "tenantId"];
    readonly authGetUserByProviderUid: readonly ["providerId", "uid", "tenantId"];
    readonly authGetUsers: readonly ["identifiers", "tenantId"];
    readonly authUpdateUser: readonly ["uid", "properties", "tenantId"];
    readonly authSetCustomUserClaims: readonly ["uid", "customClaims", "tenantId"];
    readonly authDeleteUser: readonly ["uid", "tenantId"];
    readonly authDeleteUsers: readonly ["uids", "tenantId"];
    readonly authCreateCustomToken: readonly ["uid", "customClaims", "tenantId"];
    readonly authCreateSessionCookie: readonly ["idToken", "sessionCookieOptions", "tenantId"];
    readonly authVerifyIdToken: readonly ["idToken", "checkRevoked", "tenantId"];
    readonly authRevokeRefreshTokens: readonly ["uid", "tenantId"];
    readonly authGenerateEmailVerificationLink: readonly ["email", "actionCodeSettings", "tenantId"];
    readonly authGeneratePasswordResetLink: readonly ["email", "actionCodeSettings", "tenantId"];
    readonly authGenerateSignInWithEmailLink: readonly ["email", "actionCodeSettings", "tenantId"];
    readonly authGenerateVerifyAndChangeEmailLink: readonly ["email", "newEmail", "actionCodeSettings", "tenantId"];
    readonly authCreateProviderConfig: readonly ["providerConfig", "tenantId"];
    readonly authGetProviderConfig: readonly ["providerId", "tenantId"];
    readonly authListProviderConfigs: readonly ["providerFilter", "tenantId"];
    readonly authUpdateProviderConfig: readonly ["providerId", "providerConfig", "tenantId"];
    readonly authDeleteProviderConfig: readonly ["providerId", "tenantId"];
};
/**
 * Given a task name, return the settings for the task
 */
type TaskNameToSettings<TN extends TaskName> = [
    (typeof taskSettingKeys)[TN],
    TaskNameToParams<TN>
] extends [infer TNK, infer TNP] ? {
    [I in Extract<keyof TNK, `${number}`> as undefined extends TNP[I] ? never : TNK[I]]: TNP[I];
} & {
    [I in Extract<keyof TNK, `${number}`> as undefined extends TNP[I] ? TNK[I] : never]?: TNP[I];
} : never;
/**
 * A drop-in replacement for cy.task that provides type safe tasks
 * @param cy - The Cypress object
 * @param taskName - The name of the task
 * @param taskSettings - The settings for the task
 * @returns - A Cypress Chainable with the return type of the task
 */
export declare function typedTask<TN extends TaskName>(cy: AttachCustomCommandParams['cy'], taskName: TN, taskSettings: TaskNameToSettings<TN>): Cypress.Chainable<Awaited<TaskNameToReturn<TN>>>;
export default tasks;
