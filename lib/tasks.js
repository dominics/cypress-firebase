"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typedTask = exports.taskSettingKeys = exports.authDeleteProviderConfig = exports.authUpdateProviderConfig = exports.authListProviderConfigs = exports.authGetProviderConfig = exports.authCreateProviderConfig = exports.authGenerateVerifyAndChangeEmailLink = exports.authGenerateSignInWithEmailLink = exports.authGeneratePasswordResetLink = exports.authGenerateEmailVerificationLink = exports.authRevokeRefreshTokens = exports.authVerifyIdToken = exports.authCreateSessionCookie = exports.authCreateCustomToken = exports.authDeleteUsers = exports.authDeleteUser = exports.authSetCustomUserClaims = exports.authUpdateUser = exports.authGetUsers = exports.authGetUserByProviderUid = exports.authGetUserByPhoneNumber = exports.authGetUserByEmail = exports.authGetUser = exports.authListUsers = exports.authImportUsers = exports.authCreateUser = exports.callFirestore = exports.callRtdb = exports.convertValueToTimestampOrGeoPointIfPossible = void 0;
const firebase_utils_1 = require("./firebase-utils");
/**
 * @param baseRef - Base RTDB reference
 * @param options - Options for ref
 * @returns RTDB Reference
 */
function optionsToRtdbRef(baseRef, options) {
    let newRef = baseRef;
    [
        'orderByChild',
        'orderByKey',
        'orderByValue',
        'equalTo',
        'startAfter',
        'startAt',
        'endBefore',
        'endAt',
        'limitToFirst',
        'limitToLast',
    ].forEach((optionName) => {
        if (options && options[optionName]) {
            const args = options[optionName];
            // Spread arg arrays (such as startAfter and endBefore)
            if (Array.isArray(args)) {
                newRef = newRef[optionName](...args);
            }
            else {
                newRef = newRef[optionName](args);
            }
        }
    });
    return newRef;
}
/**
 * Get Firebase Auth or TenantAwareAuth instance, based on tenantId being provided
 * @param adminInstance - Admin SDK instance
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Firebase Auth or TenantAwareAuth instance
 */
function getAuth(adminInstance, tenantId) {
    const auth = tenantId
        ? adminInstance.auth().tenantManager().authForTenant(tenantId)
        : adminInstance.auth();
    return auth;
}
/**
 * Convert unique data types which have been stringified and parsed back
 * into their original type.
 * @param dataVal - Value of data
 * @param firestoreStatics - Statics from firestore instance
 * @returns Value converted into timestamp object if possible
 */
function convertValueToTimestampOrGeoPointIfPossible(dataVal, firestoreStatics) {
    /* eslint-disable no-underscore-dangle */
    if ((dataVal && dataVal._methodName === 'serverTimestamp') ||
        (dataVal && dataVal._methodName === 'FieldValue.serverTimestamp') // v8 and earlier
    ) {
        return firestoreStatics.FieldValue.serverTimestamp();
    }
    if ((dataVal && dataVal._methodName === 'deleteField') ||
        (dataVal && dataVal._methodName === 'FieldValue.delete') // v8 and earlier
    ) {
        return firestoreStatics.FieldValue.delete();
    }
    /* eslint-enable no-underscore-dangle */
    if (typeof dataVal !== 'undefined' &&
        dataVal !== null &&
        typeof dataVal.seconds === 'number' &&
        typeof dataVal.nanoseconds === 'number') {
        return new firestoreStatics.Timestamp(dataVal.seconds, dataVal.nanoseconds);
    }
    if (typeof dataVal !== 'undefined' &&
        dataVal !== null &&
        typeof dataVal.latitude === 'number' &&
        typeof dataVal.longitude === 'number') {
        return new firestoreStatics.GeoPoint(dataVal.latitude, dataVal.longitude);
    }
    return dataVal;
}
exports.convertValueToTimestampOrGeoPointIfPossible = convertValueToTimestampOrGeoPointIfPossible;
/**
 * @param data - Data to be set in firestore
 * @param firestoreStatics - Statics from Firestore object
 * @returns Data to be set in firestore with timestamp
 */
function getDataWithTimestampsAndGeoPoints(data, firestoreStatics) {
    // Exit if no statics are passed
    if (!firestoreStatics) {
        return data;
    }
    return Object.entries(data).reduce((acc, [currKey, currData]) => {
        // Convert nested timestamp if item is an object
        if (typeof currData === 'object' &&
            currData !== null &&
            !Array.isArray(currData) &&
            /* eslint-disable-next-line no-underscore-dangle */
            !currData._methodName &&
            !currData.seconds &&
            !(currData.latitude && currData.longitude)) {
            return {
                ...acc,
                [currKey]: getDataWithTimestampsAndGeoPoints(currData, firestoreStatics),
            };
        }
        const value = Array.isArray(currData)
            ? currData.map((dataItem) => {
                const result = convertValueToTimestampOrGeoPointIfPossible(dataItem, firestoreStatics);
                return result.constructor === Object
                    ? getDataWithTimestampsAndGeoPoints(result, firestoreStatics)
                    : result;
            })
            : convertValueToTimestampOrGeoPointIfPossible(currData, firestoreStatics);
        return {
            ...acc,
            [currKey]: value,
        };
    }, {});
}
/**
 * @param adminInstance - firebase-admin instance
 * @param action - Action to run
 * @param actionPath - Path in RTDB
 * @param options - Query options
 * @param data - Data to pass to action
 * @returns Promise which resolves with results of calling RTDB
 */
async function callRtdb(adminInstance, action, actionPath, options, data) {
    // Handle actionPath not being set (see #244 for more info)
    if (!actionPath) {
        throw new Error('actionPath is required for callRtdb. Use "/" for top level actions.');
    }
    try {
        const dbRef = adminInstance.database().ref(actionPath);
        if (action === 'get') {
            const snap = await optionsToRtdbRef(dbRef, options).once('value');
            return snap.val();
        }
        if (action === 'push') {
            const pushRef = dbRef.push();
            await pushRef.set(data);
            // TODO: Return key on an object for consistent return regardless of action
            return pushRef.key;
        }
        // Delete action
        const actionNameMap = {
            delete: 'remove',
        };
        const cleanedActionName = actionNameMap[action] || action;
        await dbRef[cleanedActionName](data);
        // Prevents Cypress error with message:
        // "You must return a promise, a value, or null to indicate that the task was handled."
        return null;
    }
    catch (err) {
        /* eslint-disable no-console */
        console.error(`cypress-firebase: Error with RTDB "${action}" at path "${actionPath}" :`, err);
        /* eslint-enable no-console */
        throw err;
    }
}
exports.callRtdb = callRtdb;
/**
 * @param adminInstance - firebase-admin instance
 * @param action - Action to run
 * @param actionPath - Path to collection or document within Firestore
 * @param options - Query options
 * @param data - Data to pass to action
 * @returns Promise which resolves with results of calling Firestore
 */
async function callFirestore(adminInstance, action, actionPath, options, data) {
    try {
        if (action === 'get') {
            const snap = await (0, firebase_utils_1.slashPathToFirestoreRef)(adminInstance.firestore, actionPath, options).get();
            if (snap &&
                snap.docs &&
                snap.docs.length &&
                typeof snap.docs.map === 'function') {
                return snap.docs.map((docSnap) => ({
                    ...docSnap.data(),
                    id: docSnap.id,
                }));
            }
            // Falling back to null in the case of falsey value prevents Cypress error with message:
            // "You must return a promise, a value, or null to indicate that the task was handled."
            return (snap && typeof snap.data === 'function' && snap.data()) || null;
        }
        if (action === 'delete') {
            // Handle deleting of collections & sub-collections if not a doc path
            const deletePromise = (0, firebase_utils_1.isDocPath)(actionPath)
                ? (0, firebase_utils_1.slashPathToFirestoreRef)(adminInstance.firestore, actionPath, options).delete()
                : (0, firebase_utils_1.deleteCollection)(adminInstance.firestore(), (0, firebase_utils_1.slashPathToFirestoreRef)(adminInstance.firestore, actionPath, options), options);
            await deletePromise;
            // Returning null in the case of falsey value prevents Cypress error with message:
            // "You must return a promise, a value, or null to indicate that the task was handled."
            return null;
        }
        if (!data) {
            throw new Error(`You must define data to run ${action} in firestore.`);
        }
        const dataToSet = getDataWithTimestampsAndGeoPoints(data, 
        // Use static option if passed (tests), otherwise fallback to statics on adminInstance
        // Tests do not have statics since they are using @firebase/testing
        (options && options.statics) ||
            adminInstance.firestore);
        if (action === 'set') {
            return adminInstance
                .firestore()
                .doc(actionPath)
                .set(dataToSet, options && options.merge
                ? {
                    merge: options.merge,
                }
                : undefined);
        }
        // "update" and "add" action
        return (0, firebase_utils_1.slashPathToFirestoreRef)(adminInstance.firestore, actionPath, options)[action](dataToSet);
    }
    catch (err) {
        /* eslint-disable no-console */
        console.error(`cypress-firebase: Error with Firestore "${action}" at path "${actionPath}" :`, err);
        /* eslint-enable no-console */
        throw err;
    }
}
exports.callFirestore = callFirestore;
/**
 * Create a Firebase Auth user
 * @param adminInstance - Admin SDK instance
 * @param properties - The properties to set on the new user record to be created
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
function authCreateUser(adminInstance, properties, tenantId) {
    return getAuth(adminInstance, tenantId)
        .createUser(properties)
        .catch((err) => {
        if (err.code === 'auth/email-already-exists')
            return 'auth/email-already-exists';
        if (err.code === 'auth/phone-number-already-exists')
            return 'auth/phone-number-already-exists';
        throw err;
    });
}
exports.authCreateUser = authCreateUser;
/**
 * Import list of Firebase Auth users
 * @param adminInstance - Admin SDK instance
 * @param usersImport - The list of user records to import to Firebase Auth
 * @param importOptions - Optional options for the user import
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves when the operation completes with the result of the import
 */
function authImportUsers(adminInstance, usersImport, importOptions, tenantId) {
    return getAuth(adminInstance, tenantId).importUsers(usersImport, importOptions);
}
exports.authImportUsers = authImportUsers;
/**
 * List Firebase Auth users
 * @param adminInstance - Admin SDK instance
 * @param maxResults - The page size, 1000 if undefined
 * @param pageToken - The next page token
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves with the current batch of downloaded users and the next page token
 */
function authListUsers(adminInstance, maxResults, pageToken, tenantId) {
    return getAuth(adminInstance, tenantId).listUsers(maxResults, pageToken);
}
exports.authListUsers = authListUsers;
/**
 * Get Firebase Auth user based on UID
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user whose data to fetch
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
function authGetUser(adminInstance, uid, tenantId) {
    return getAuth(adminInstance, tenantId)
        .getUser(uid)
        .catch((err) => {
        if (err.code === 'auth/user-not-found')
            return 'auth/user-not-found';
        throw err;
    });
}
exports.authGetUser = authGetUser;
/**
 * Get Firebase Auth user based on email
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user whose data to fetch
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
function authGetUserByEmail(adminInstance, email, tenantId) {
    return getAuth(adminInstance, tenantId)
        .getUserByEmail(email)
        .catch((err) => {
        if (err.code === 'auth/user-not-found')
            return 'auth/user-not-found';
        throw err;
    });
}
exports.authGetUserByEmail = authGetUserByEmail;
/**
 * Get Firebase Auth user based on phone number
 * @param adminInstance - Admin SDK instance
 * @param phoneNumber - Phone number of the user whose data to fetch
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
function authGetUserByPhoneNumber(adminInstance, phoneNumber, tenantId) {
    return getAuth(adminInstance, tenantId)
        .getUserByPhoneNumber(phoneNumber)
        .catch((err) => {
        if (err.code === 'auth/user-not-found')
            return 'auth/user-not-found';
        throw err;
    });
}
exports.authGetUserByPhoneNumber = authGetUserByPhoneNumber;
/**
 * Get Firebase Auth user based on phone number
 * @param adminInstance - Admin SDK instance
 * @param providerId - The Provider ID
 * @param uid - The user identifier for the given provider
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a UserRecord
 */
function authGetUserByProviderUid(adminInstance, providerId, uid, tenantId) {
    return getAuth(adminInstance, tenantId)
        .getUserByProviderUid(providerId, uid)
        .catch((err) => {
        if (err.code === 'auth/user-not-found')
            return 'auth/user-not-found';
        throw err;
    });
}
exports.authGetUserByProviderUid = authGetUserByProviderUid;
/**
 * Get Firebase Auth users based on identifiers
 * @param adminInstance - Admin SDK instance
 * @param identifiers - The identifiers used to indicate which user records should be returned.
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a GetUsersResult object
 */
function authGetUsers(adminInstance, identifiers, tenantId) {
    return getAuth(adminInstance, tenantId).getUsers(identifiers);
}
exports.authGetUsers = authGetUsers;
/**
 * Update an existing Firebase Auth user
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user to edit
 * @param properties - The properties to update on the user
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves with a UserRecord
 */
function authUpdateUser(adminInstance, uid, properties, tenantId) {
    return getAuth(adminInstance, tenantId).updateUser(uid, properties);
}
exports.authUpdateUser = authUpdateUser;
/**
 * Delete multiple Firebase Auth users
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user to edit
 * @param customClaims - The custom claims to set, null deletes the custom claims
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves with null when the operation completes
 */
function authSetCustomUserClaims(adminInstance, uid, customClaims, tenantId) {
    return getAuth(adminInstance, tenantId)
        .setCustomUserClaims(uid, customClaims)
        .then(() => null);
}
exports.authSetCustomUserClaims = authSetCustomUserClaims;
/**
 * Delete a Firebase Auth user
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user to delete
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise that resolves to null when user is deleted
 */
function authDeleteUser(adminInstance, uid, tenantId) {
    return getAuth(adminInstance, tenantId)
        .deleteUser(uid)
        .then(() => null);
}
exports.authDeleteUser = authDeleteUser;
/**
 * Delete multiple Firebase Auth users
 * @param adminInstance - Admin SDK instance
 * @param uids - Array of UIDs of the users to delete
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves to a DeleteUsersResult object
 */
function authDeleteUsers(adminInstance, uids, tenantId) {
    return getAuth(adminInstance, tenantId).deleteUsers(uids);
}
exports.authDeleteUsers = authDeleteUsers;
/**
 * Create a custom token
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of user for which the custom token will be generated
 * @param customClaims - Optional custom claims to include in the token
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a custom Firebase Auth token
 */
function authCreateCustomToken(adminInstance, uid, customClaims, tenantId) {
    // Use custom claims or default to { isTesting: true }
    const userCustomClaims = customClaims || {
        isTesting: true,
    };
    // Create auth token
    return getAuth(adminInstance, tenantId).createCustomToken(uid, userCustomClaims);
}
exports.authCreateCustomToken = authCreateCustomToken;
/**
 * Create a session cookie
 * @param adminInstance - Admin SDK instance
 * @param idToken - Firebase ID token
 * @param sessionCookieOptions - Session cookie options
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a session cookie
 */
function authCreateSessionCookie(adminInstance, idToken, sessionCookieOptions, tenantId) {
    return getAuth(adminInstance, tenantId).createSessionCookie(idToken, sessionCookieOptions);
}
exports.authCreateSessionCookie = authCreateSessionCookie;
/**
 * Verify a Firebase ID token
 * @param adminInstance - Admin SDK instance
 * @param idToken - Firebase ID token
 * @param checkRevoked - Whether to check if the token is revoked
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a decoded ID token
 */
function authVerifyIdToken(adminInstance, idToken, checkRevoked, tenantId) {
    return getAuth(adminInstance, tenantId).verifyIdToken(idToken, checkRevoked);
}
exports.authVerifyIdToken = authVerifyIdToken;
/**
 * Revoke all refresh tokens for a user
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of the user for which to revoke tokens
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves when the operation completes
 */
function authRevokeRefreshTokens(adminInstance, uid, tenantId) {
    return getAuth(adminInstance, tenantId).revokeRefreshTokens(uid);
}
exports.authRevokeRefreshTokens = authRevokeRefreshTokens;
/**
 * Generate an email verification link
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user
 * @param actionCodeSettings - Action code settings
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the email verification link
 */
function authGenerateEmailVerificationLink(adminInstance, email, actionCodeSettings, tenantId) {
    return getAuth(adminInstance, tenantId).generateEmailVerificationLink(email, actionCodeSettings);
}
exports.authGenerateEmailVerificationLink = authGenerateEmailVerificationLink;
/**
 * Generate a password reset link
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user
 * @param actionCodeSettings - Action code settings
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the password reset link
 */
function authGeneratePasswordResetLink(adminInstance, email, actionCodeSettings, tenantId) {
    return getAuth(adminInstance, tenantId).generatePasswordResetLink(email, actionCodeSettings);
}
exports.authGeneratePasswordResetLink = authGeneratePasswordResetLink;
/**
 * Generate a sign-in with email link
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user
 * @param actionCodeSettings - Action code settings
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the sign-in with email link
 */
function authGenerateSignInWithEmailLink(adminInstance, email, actionCodeSettings, tenantId) {
    return getAuth(adminInstance, tenantId).generateSignInWithEmailLink(email, actionCodeSettings);
}
exports.authGenerateSignInWithEmailLink = authGenerateSignInWithEmailLink;
/**
 * Generate a link for email verification and email change
 * @param adminInstance - Admin SDK instance
 * @param email - Email of the user
 * @param newEmail - New email of the user
 * @param actionCodeSettings - Action code settings
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the email verification link
 */
function authGenerateVerifyAndChangeEmailLink(adminInstance, email, newEmail, actionCodeSettings, tenantId) {
    return getAuth(adminInstance, tenantId).generateVerifyAndChangeEmailLink(email, newEmail, actionCodeSettings);
}
exports.authGenerateVerifyAndChangeEmailLink = authGenerateVerifyAndChangeEmailLink;
/**
 * Create a provider configuration
 * @param adminInstance - Admin SDK instance
 * @param providerConfig - The provider configuration
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the provider configuration
 */
function authCreateProviderConfig(adminInstance, providerConfig, tenantId) {
    return getAuth(adminInstance, tenantId).createProviderConfig(providerConfig);
}
exports.authCreateProviderConfig = authCreateProviderConfig;
/**
 * Get a provider configuration
 * @param adminInstance - Admin SDK instance
 * @param providerId - The provider ID
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the provider configuration
 */
function authGetProviderConfig(adminInstance, providerId, tenantId) {
    return getAuth(adminInstance, tenantId).getProviderConfig(providerId);
}
exports.authGetProviderConfig = authGetProviderConfig;
/**
 * List provider configurations
 * @param adminInstance - Admin SDK instance
 * @param providerFilter - The provider filter
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the provider configurations
 */
function authListProviderConfigs(adminInstance, providerFilter, tenantId) {
    return getAuth(adminInstance, tenantId).listProviderConfigs(providerFilter);
}
exports.authListProviderConfigs = authListProviderConfigs;
/**
 * Update a provider configuration
 * @param adminInstance - Admin SDK instance
 * @param providerId - The provider ID
 * @param providerConfig - The provider configuration
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with the provider configuration
 */
function authUpdateProviderConfig(adminInstance, providerId, providerConfig, tenantId) {
    return getAuth(adminInstance, tenantId).updateProviderConfig(providerId, providerConfig);
}
exports.authUpdateProviderConfig = authUpdateProviderConfig;
/**
 * Delete a provider configuration
 * @param adminInstance - Admin SDK instance
 * @param providerId - The provider ID
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves to null when the operation completes
 */
function authDeleteProviderConfig(adminInstance, providerId, tenantId) {
    return getAuth(adminInstance, tenantId)
        .deleteProviderConfig(providerId)
        .then(() => null);
}
exports.authDeleteProviderConfig = authDeleteProviderConfig;
/**
 * Object containing all tasks created by the plugin
 */
const tasks = {
    callRtdb,
    callFirestore,
    authCreateUser,
    authImportUsers,
    authListUsers,
    authGetUser,
    authGetUserByEmail,
    authGetUserByPhoneNumber,
    authGetUserByProviderUid,
    authGetUsers,
    authUpdateUser,
    authSetCustomUserClaims,
    authDeleteUser,
    authDeleteUsers,
    authCreateCustomToken,
    authCreateSessionCookie,
    authVerifyIdToken,
    authRevokeRefreshTokens,
    authGenerateEmailVerificationLink,
    authGeneratePasswordResetLink,
    authGenerateSignInWithEmailLink,
    authGenerateVerifyAndChangeEmailLink,
    authCreateProviderConfig,
    authGetProviderConfig,
    authListProviderConfigs,
    authUpdateProviderConfig,
    authDeleteProviderConfig,
};
/**
 * Object mapping task names to their settings keys
 */
exports.taskSettingKeys = {
    callRtdb: ['action', 'path', 'options', 'data'],
    callFirestore: ['action', 'path', 'options', 'data'],
    authCreateUser: ['properties', 'tenantId'],
    authImportUsers: ['usersImport', 'importOptions', 'tenantId'],
    authListUsers: ['maxResults', 'pageToken', 'tenantId'],
    authGetUser: ['uid', 'tenantId'],
    authGetUserByEmail: ['email', 'tenantId'],
    authGetUserByPhoneNumber: ['phoneNumber', 'tenantId'],
    authGetUserByProviderUid: ['providerId', 'uid', 'tenantId'],
    authGetUsers: ['identifiers', 'tenantId'],
    authUpdateUser: ['uid', 'properties', 'tenantId'],
    authSetCustomUserClaims: ['uid', 'customClaims', 'tenantId'],
    authDeleteUser: ['uid', 'tenantId'],
    authDeleteUsers: ['uids', 'tenantId'],
    authCreateCustomToken: ['uid', 'customClaims', 'tenantId'],
    authCreateSessionCookie: ['idToken', 'sessionCookieOptions', 'tenantId'],
    authVerifyIdToken: ['idToken', 'checkRevoked', 'tenantId'],
    authRevokeRefreshTokens: ['uid', 'tenantId'],
    authGenerateEmailVerificationLink: [
        'email',
        'actionCodeSettings',
        'tenantId',
    ],
    authGeneratePasswordResetLink: ['email', 'actionCodeSettings', 'tenantId'],
    authGenerateSignInWithEmailLink: ['email', 'actionCodeSettings', 'tenantId'],
    authGenerateVerifyAndChangeEmailLink: [
        'email',
        'newEmail',
        'actionCodeSettings',
        'tenantId',
    ],
    authCreateProviderConfig: ['providerConfig', 'tenantId'],
    authGetProviderConfig: ['providerId', 'tenantId'],
    authListProviderConfigs: ['providerFilter', 'tenantId'],
    authUpdateProviderConfig: ['providerId', 'providerConfig', 'tenantId'],
    authDeleteProviderConfig: ['providerId', 'tenantId'],
};
/**
 * A drop-in replacement for cy.task that provides type safe tasks
 * @param cy - The Cypress object
 * @param taskName - The name of the task
 * @param taskSettings - The settings for the task
 * @returns - A Cypress Chainable with the return type of the task
 */
function typedTask(cy, taskName, taskSettings) {
    return cy.task(taskName, taskSettings);
}
exports.typedTask = typedTask;
exports.default = tasks;
