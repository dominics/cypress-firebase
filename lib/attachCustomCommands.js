"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tasks_1 = require("./tasks");
/**
 * Get String representing the type for the provided value
 * @param value - Value for which to get type string
 * @returns String representing a type
 */
function getTypeStr(value) {
    if (Array.isArray(value)) {
        return 'array';
    }
    if (typeof value === 'object' && value instanceof Date) {
        return 'date';
    }
    return typeof value;
}
/**
 * @param auth - firebase auth instance
 * @param customToken - Custom token to use for login
 * @returns Promise which resolves with the user auth object
 */
function loginWithCustomToken(auth, customToken) {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((auth) => {
            if (auth) {
                resolve(auth);
            }
        });
        auth.signInWithCustomToken(customToken).catch(reject);
    });
}
/**
 * @param auth - firebase auth instance
 * @param email - email to use for login
 * @param password - password to use for login
 * @returns Promise which resolves with the user auth object
 */
function loginWithEmailAndPassword(auth, email, password) {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((auth) => {
            if (auth) {
                resolve(auth);
            }
        });
        auth.signInWithEmailAndPassword(email, password).catch(reject);
    });
}
/**
 * Delete all users from Firebase Auth, recursively because of batch
 * size limitations
 * Resolves when all users have been deleted
 * Rejects if too many deletes fail or all deletes failed
 * @param cy - Cypress object
 * @param tenantId - Tenant ID to use for user deletion
 * @param pageToken - Page token used for recursion
 * @returns Promise which resolves when all users have been deleted
 */
function authDeleteAllUsers(cy, tenantId, pageToken) {
    return new Promise((resolve, reject) => {
        (0, tasks_1.typedTask)(cy, 'authListUsers', { tenantId, pageToken }).then(({ users, pageToken: nextPageToken }) => {
            if (users.length === 0)
                resolve();
            else {
                const uids = users.map((user) => user.uid);
                (0, tasks_1.typedTask)(cy, 'authDeleteUsers', { uids, tenantId }).then(({ successCount, failureCount }) => {
                    if (failureCount > successCount || successCount === 0)
                        reject(new Error(`Too many deletes failed. ${successCount} users were deleted, ${failureCount} failed.`));
                    authDeleteAllUsers(cy, tenantId, nextPageToken).then(resolve);
                });
            }
        });
    });
}
/**
 * Attach custom commands including cy.login, cy.logout, cy.callRtdb,
 * @param context - Context values passed from Cypress environment
 * custom command attachment
 * @param options - Custom command options
 */
function attachCustomCommands(context, options) {
    const { Cypress, cy, firebase, app } = context;
    const defaultApp = app || firebase.app(); // select default  app
    /**
     * Get firebase auth instance, with tenantId set if provided
     * @param tenantId Optional tenant ID
     * @returns firebase auth instance
     */
    function getAuth(tenantId) {
        const auth = defaultApp.auth();
        if (tenantId) {
            auth.tenantId = tenantId;
        }
        return auth;
    }
    Cypress.Commands.add((options && options.commandNames && options.commandNames.callRtdb) ||
        'callRtdb', (action, actionPath, dataOrOptions, options) => {
        const taskSettings = {
            action,
            path: actionPath,
        };
        // Add data only for write actions
        if (['set', 'update', 'push'].includes(action)) {
            // If exists, create a copy to original object is not modified
            const dataIsObject = getTypeStr(dataOrOptions) === 'object';
            const dataToWrite = dataIsObject ? { ...dataOrOptions } : dataOrOptions;
            // Add metadata to dataToWrite if specified by options
            if (dataIsObject && options && options.withMeta) {
                if (!dataToWrite.createdBy && Cypress.env('TEST_UID')) {
                    dataToWrite.createdBy = Cypress.env('TEST_UID');
                }
                if (!dataToWrite.createdAt) {
                    dataToWrite.createdAt = firebase.database.ServerValue.TIMESTAMP;
                }
            }
            taskSettings.data = dataToWrite;
        }
        // Use third argument as options for get action
        if (action === 'get') {
            taskSettings.options = dataOrOptions;
        }
        else if (options) {
            // Attach options if they exist
            taskSettings.options = options;
        }
        return cy.task('callRtdb', taskSettings);
    });
    Cypress.Commands.add((options && options.commandNames && options.commandNames.callFirestore) ||
        'callFirestore', (action, actionPath, dataOrOptions, options) => {
        const taskSettings = {
            action,
            path: actionPath,
        };
        // Add data only for write actions
        if (['set', 'update', 'add'].includes(action)) {
            // If data is an object, create a copy to original object is not modified
            const dataIsObject = getTypeStr(dataOrOptions) === 'object';
            const dataToWrite = dataIsObject ? { ...dataOrOptions } : dataOrOptions;
            // Add metadata to dataToWrite if specified by options
            if (dataIsObject && options && options.withMeta) {
                if (!dataToWrite.createdBy) {
                    dataToWrite.createdBy = Cypress.env('TEST_UID');
                }
                if (!dataToWrite.createdAt) {
                    dataToWrite.createdAt = firebase.firestore.Timestamp.now();
                }
            }
            taskSettings.data = dataToWrite;
        }
        // Use third argument as options for get and delete actions
        if (action === 'get' || action === 'delete') {
            taskSettings.options = dataOrOptions;
        }
        else if (options) {
            // Attach options if they exist
            taskSettings.options = options;
        }
        return cy.task('callFirestore', taskSettings);
    });
    Cypress.Commands.add((options && options.commandNames && options.commandNames.authCreateUser) ||
        'authCreateUser', (properties, tenantId = Cypress.env('TEST_TENANT_ID')) => (0, tasks_1.typedTask)(cy, 'authCreateUser', { properties, tenantId }).then((user) => {
        if (user === 'auth/email-already-exists') {
            if (!properties.email) {
                throw new Error('User with email already exists yet no email was given');
            }
            cy.log('Auth user with given email already exists.');
            return (0, tasks_1.typedTask)(cy, 'authGetUserByEmail', {
                email: properties.email,
                tenantId,
            }).then((user) => (user === 'auth/user-not-found' ? null : user));
        }
        if (user === 'auth/phone-number-already-exists') {
            if (!properties.phoneNumber) {
                throw new Error('User with phone number already exists yet no phone number was given');
            }
            cy.log('Auth user with given phone number already exists.');
            return (0, tasks_1.typedTask)(cy, 'authGetUserByPhoneNumber', {
                phoneNumber: properties.phoneNumber,
                tenantId,
            }).then((user) => (user === 'auth/user-not-found' ? null : user));
        }
        return user;
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.createUserWithClaims) ||
        'createUserWithClaims', (properties, customClaims, tenantId = Cypress.env('TEST_TENANT_ID')) => {
        (0, tasks_1.typedTask)(cy, 'authCreateUser', { properties, tenantId }).then((user) => {
            if (user === 'auth/email-already-exists') {
                if (!properties.email) {
                    throw new Error('User with email already exists yet no email was given');
                }
                cy.log('Auth user with given email already exists.');
                return (0, tasks_1.typedTask)(cy, 'authGetUserByEmail', {
                    email: properties.email,
                    tenantId,
                }).then((user) => (user === 'auth/user-not-found' ? null : user));
            }
            if (user === 'auth/phone-number-already-exists') {
                if (!properties.phoneNumber) {
                    throw new Error('User with phone number already exists yet no phone number was given');
                }
                cy.log('Auth user with given phone number already exists.');
                return (0, tasks_1.typedTask)(cy, 'authGetUserByPhoneNumber', {
                    phoneNumber: properties.phoneNumber,
                    tenantId,
                }).then((user) => (user === 'auth/user-not-found' ? null : user));
            }
            if (customClaims !== undefined && user) {
                return (0, tasks_1.typedTask)(cy, 'authSetCustomUserClaims', {
                    uid: user.uid,
                    customClaims,
                    tenantId,
                }).then(() => user.uid);
            }
            return user;
        });
    });
    Cypress.Commands.add((options && options.commandNames && options.commandNames.authImportUsers) ||
        'authImportUsers', (...args) => (0, tasks_1.typedTask)(cy, 'authImportUsers', {
        usersImport: args[0],
        importOptions: args[1],
        tenantId: args[2] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options && options.commandNames && options.commandNames.authListUsers) ||
        'authListUsers', (...args) => (0, tasks_1.typedTask)(cy, 'authListUsers', {
        maxResults: args[0],
        pageToken: args[1],
        tenantId: args[2] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options && options.commandNames && options.commandNames.login) || 'login', (uid, customClaims, tenantId = Cypress.env('TEST_TENANT_ID')) => {
        const userUid = uid || Cypress.env('TEST_UID');
        // Handle UID which is passed in
        if (!userUid) {
            throw new Error('uid must be passed or TEST_UID set within environment to login');
        }
        const auth = getAuth(tenantId);
        // Resolve with current user if they already exist
        if (auth.currentUser && userUid === auth.currentUser.uid) {
            cy.log('Authed user already exists, login complete.');
            return undefined;
        }
        cy.log('Creating custom token for login...');
        // Generate a custom token using authCreateCustomToken task (if tasks are enabled) then login
        return (0, tasks_1.typedTask)(cy, 'authCreateCustomToken', {
            uid: userUid,
            customClaims,
            tenantId,
        }).then((customToken) => loginWithCustomToken(auth, customToken));
    });
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.loginWithEmailAndPassword) ||
        'loginWithEmailAndPassword', (email, password, extraInfo, tenantId = Cypress.env('TEST_TENANT_ID')) => {
        const userUid = Cypress.env('TEST_UID');
        const userEmail = email || Cypress.env('TEST_EMAIL');
        // Handle email which is passed in
        if (!userEmail) {
            throw new Error('email must be passed or TEST_EMAIL set within environment to login');
        }
        const userPassword = password || Cypress.env('TEST_PASSWORD');
        // Handle password which is passed in
        if (!userPassword) {
            throw new Error('password must be passed or TEST_PASSWORD set within environment to login');
        }
        const auth = getAuth(tenantId);
        // Resolve with current user if they already exist
        if (auth.currentUser && userEmail === auth.currentUser.email) {
            cy.log('Authed user already exists, login complete.');
            return undefined;
        }
        return (0, tasks_1.typedTask)(cy, 'authGetUserByEmail', {
            email: userEmail,
            tenantId,
        }).then((user) => {
            if (user)
                return loginWithEmailAndPassword(auth, userEmail, userPassword);
            (0, tasks_1.typedTask)(cy, 'authCreateUser', {
                properties: {
                    uid: userUid,
                    email: userEmail,
                    password: userPassword,
                    ...extraInfo,
                },
                tenantId,
            });
            return cy
                .task('authCreateUser', {
                properties: {
                    email: userEmail,
                    password: userPassword,
                    ...extraInfo,
                },
                tenantId,
            })
                .then(() => loginWithEmailAndPassword(auth, userEmail, userPassword));
        });
    });
    Cypress.Commands.add((options && options.commandNames && options.commandNames.logout) ||
        'logout', (tenantId = Cypress.env('TEST_TENANT_ID')) => new Promise((resolve, reject) => {
        const auth = getAuth(tenantId);
        auth.onAuthStateChanged((auth) => {
            if (!auth) {
                resolve();
            }
        });
        auth.signOut().catch(reject);
    }));
    Cypress.Commands.add((options && options.commandNames && options.commandNames.authGetUser) ||
        'authGetUser', (uid, tenantId) => {
        const userUid = uid || Cypress.env('TEST_UID');
        // Handle UID which is passed in
        if (!userUid) {
            throw new Error('uid must be passed or TEST_UID set within environment to login');
        }
        return (0, tasks_1.typedTask)(cy, 'authGetUser', {
            uid: userUid,
            tenantId: tenantId || Cypress.env('TEST_TENANT_ID'),
        }).then((user) => {
            if (user === 'auth/user-not-found')
                return null;
            return user;
        });
    });
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authGetUserByEmail) ||
        'authGetUserByEmail', (email, tenantId) => {
        const userEmail = email || Cypress.env('TEST_EMAIL');
        // Handle email which is passed in
        if (!userEmail) {
            throw new Error('email must be passed or TEST_EMAIL set within environment to login');
        }
        return (0, tasks_1.typedTask)(cy, 'authGetUserByEmail', {
            email: userEmail,
            tenantId: tenantId || Cypress.env('TEST_TENANT_ID'),
        }).then((user) => {
            if (user === 'auth/user-not-found')
                return null;
            return user;
        });
    });
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authGetUserByPhoneNumber) ||
        'authGetUserByPhoneNumber', (...args) => (0, tasks_1.typedTask)(cy, 'authGetUserByPhoneNumber', {
        phoneNumber: args[0],
        tenantId: args[1] || Cypress.env('TEST_TENANT_ID'),
    }).then((user) => {
        if (user === 'auth/user-not-found')
            return null;
        return user;
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authGetUserByProviderUid) ||
        'authGetUserByProviderUid', (providerId, uid, tenantId) => {
        const userUid = uid || Cypress.env('TEST_UID');
        // Handle UID which is passed in
        if (!userUid) {
            throw new Error('uid must be passed or TEST_UID set within environment to login');
        }
        (0, tasks_1.typedTask)(cy, 'authGetUserByProviderUid', {
            providerId,
            uid: userUid,
            tenantId: tenantId || Cypress.env('TEST_TENANT_ID'),
        }).then((user) => {
            if (user === 'auth/user-not-found')
                return null;
            return user;
        });
    });
    Cypress.Commands.add((options && options.commandNames && options.commandNames.authGetUsers) ||
        'authGetUsers', (...args) => (0, tasks_1.typedTask)(cy, 'authGetUsers', {
        identifiers: args[0],
        tenantId: args[1] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options && options.commandNames && options.commandNames.authUpdateUser) ||
        'authUpdateUser', (...args) => (0, tasks_1.typedTask)(cy, 'authUpdateUser', {
        uid: args[0],
        properties: args[1],
        tenantId: args[2] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authSetCustomUserClaims) ||
        'authSetCustomUserClaims', (...args) => (0, tasks_1.typedTask)(cy, 'authSetCustomUserClaims', {
        uid: args[0],
        customClaims: args[1],
        tenantId: args[2] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options && options.commandNames && options.commandNames.authDeleteUser) ||
        'authDeleteUser', (uid, tenantId = Cypress.env('TEST_TENANT_ID')) => {
        const userUid = uid || Cypress.env('TEST_UID');
        // Handle UID which is passed in
        if (!userUid) {
            throw new Error('uid must be passed or TEST_UID set within environment to login');
        }
        return (0, tasks_1.typedTask)(cy, 'authDeleteUser', { uid: userUid, tenantId });
    });
    Cypress.Commands.add((options && options.commandNames && options.commandNames.authDeleteUsers) ||
        'authDeleteUsers', (...args) => (0, tasks_1.typedTask)(cy, 'authDeleteUsers', {
        uids: args[0],
        tenantId: args[1] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.deleteAllAuthUsers) ||
        'deleteAllAuthUsers', (tenantId = Cypress.env('TEST_TENANT_ID')) => cy.wrap(authDeleteAllUsers(cy, tenantId)));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authCreateCustomToken) ||
        'authCreateCustomToken', (uid, customClaims, tenantId) => {
        const userUid = uid || Cypress.env('TEST_UID');
        // Handle UID which is passed in
        if (!userUid) {
            throw new Error('uid must be passed or TEST_UID set within environment to login');
        }
        return (0, tasks_1.typedTask)(cy, 'authCreateCustomToken', {
            uid: userUid,
            customClaims,
            tenantId: tenantId || Cypress.env('TEST_TENANT_ID'),
        });
    });
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authCreateSessionCookie) ||
        'authCreateSessionCookie', (...args) => (0, tasks_1.typedTask)(cy, 'authCreateSessionCookie', {
        idToken: args[0],
        sessionCookieOptions: args[1],
        tenantId: args[2] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authVerifyIdToken) ||
        'authVerifyIdToken', (...args) => (0, tasks_1.typedTask)(cy, 'authVerifyIdToken', {
        idToken: args[0],
        checkRevoked: args[1],
        tenantId: args[2] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authRevokeRefreshTokens) ||
        'authRevokeRefreshTokens', (uid, tenantId) => {
        const userUid = uid || Cypress.env('TEST_UID');
        // Handle UID which is passed in
        if (!userUid) {
            throw new Error('uid must be passed or TEST_UID set within environment to login');
        }
        return (0, tasks_1.typedTask)(cy, 'authRevokeRefreshTokens', {
            uid: userUid,
            tenantId: tenantId || Cypress.env('TEST_TENANT_ID'),
        });
    });
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authGenerateEmailVerificationLink) ||
        'authGenerateEmailVerificationLink', (email, actionCodeSettings, tenantId) => {
        const userEmail = email || Cypress.env('TEST_EMAIL');
        // Handle email which is passed in
        if (!userEmail) {
            throw new Error('email must be passed or TEST_EMAIL set within environment to login');
        }
        return (0, tasks_1.typedTask)(cy, 'authGenerateEmailVerificationLink', {
            email: userEmail,
            actionCodeSettings,
            tenantId: tenantId || Cypress.env('TEST_TENANT_ID'),
        });
    });
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authGeneratePasswordResetLink) ||
        'authGeneratePasswordResetLink', (email, actionCodeSettings, tenantId) => {
        const userEmail = email || Cypress.env('TEST_EMAIL');
        // Handle email which is passed in
        if (!userEmail) {
            throw new Error('email must be passed or TEST_EMAIL set within environment to login');
        }
        return (0, tasks_1.typedTask)(cy, 'authGeneratePasswordResetLink', {
            email: userEmail,
            actionCodeSettings,
            tenantId: tenantId || Cypress.env('TEST_TENANT_ID'),
        });
    });
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authGenerateSignInWithEmailLink) ||
        'authGenerateSignInWithEmailLink', (...args) => (0, tasks_1.typedTask)(cy, 'authGenerateSignInWithEmailLink', {
        email: args[0],
        actionCodeSettings: args[1],
        tenantId: args[2] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authGenerateVerifyAndChangeEmailLink) ||
        'authGenerateVerifyAndChangeEmailLink', (...args) => (0, tasks_1.typedTask)(cy, 'authGenerateVerifyAndChangeEmailLink', {
        email: args[0],
        newEmail: args[1],
        actionCodeSettings: args[2],
        tenantId: args[3] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authCreateProviderConfig) ||
        'authCreateProviderConfig', (...args) => (0, tasks_1.typedTask)(cy, 'authCreateProviderConfig', {
        providerConfig: args[0],
        tenantId: args[1] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authGetProviderConfig) ||
        'authGetProviderConfig', (...args) => (0, tasks_1.typedTask)(cy, 'authGetProviderConfig', {
        providerId: args[0],
        tenantId: args[1] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authListProviderConfigs) ||
        'authListProviderConfigs', (...args) => (0, tasks_1.typedTask)(cy, 'authListProviderConfigs', {
        providerFilter: args[0],
        tenantId: args[1] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authUpdateProviderConfig) ||
        'authUpdateProviderConfig', (...args) => (0, tasks_1.typedTask)(cy, 'authUpdateProviderConfig', {
        providerId: args[0],
        providerConfig: args[1],
        tenantId: args[2] || Cypress.env('TEST_TENANT_ID'),
    }));
    Cypress.Commands.add((options &&
        options.commandNames &&
        options.commandNames.authDeleteProviderConfig) ||
        'authDeleteProviderConfig', (...args) => (0, tasks_1.typedTask)(cy, 'authDeleteProviderConfig', {
        providerId: args[0],
        tenantId: args[1] || Cypress.env('TEST_TENANT_ID'),
    }));
}
exports.default = attachCustomCommands;
