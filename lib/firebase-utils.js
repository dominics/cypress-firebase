"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCollection = exports.slashPathToFirestoreRef = exports.applyWhere = exports.isDocPath = exports.initializeFirebase = exports.isString = void 0;
var tslib_1 = require("tslib");
var tasks_1 = require("./tasks");
/**
 * Check whether a value is a string or not
 * @param valToCheck - Value to check
 * @returns Whether or not value is a string
 */
function isString(valToCheck) {
    return typeof valToCheck === 'string' || valToCheck instanceof String;
}
exports.isString = isString;
/**
 * Get settings for Firestore from environment. Loads port and servicePath from
 * FIRESTORE_EMULATOR_HOST node environment variable if found, otherwise
 * defaults to port 8080 and servicePath "localhost".
 * @returns Firestore settings to be passed to firebase.firestore().settings
 */
function firestoreSettingsFromEnv() {
    var FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
    if (typeof FIRESTORE_EMULATOR_HOST === 'undefined' ||
        !isString(FIRESTORE_EMULATOR_HOST)) {
        return {
            servicePath: 'localhost',
            port: 8080,
        };
    }
    var _a = tslib_1.__read(FIRESTORE_EMULATOR_HOST.split(':'), 2), servicePath = _a[0], portStr = _a[1];
    return {
        servicePath: servicePath,
        port: parseInt(portStr, 10),
    };
}
/* eslint-enable camelcase */
/**
 * Get service account from either SERVICE_ACCOUNT environment variable
 * @returns Service account object
 */
function getServiceAccount() {
    // Environment variable
    var serviceAccountEnvVar = process.env.SERVICE_ACCOUNT;
    if (serviceAccountEnvVar) {
        try {
            return JSON.parse(serviceAccountEnvVar);
        }
        catch (err) {
            /* eslint-disable no-console */
            console.warn("cypress-firebase: Issue parsing \"SERVICE_ACCOUNT\" environment variable from string to object, returning string");
            /* eslint-enable no-console */
        }
    }
}
/**
 * @param adminInstance - firebase-admin instance to initialize
 * @returns Firebase admin credential
 */
function getFirebaseCredential(adminInstance) {
    var serviceAccount = getServiceAccount();
    // Add service account credential if it exists so that custom auth tokens can be generated
    if (serviceAccount) {
        return adminInstance.credential.cert(serviceAccount);
    }
    // Add default credentials if they exist
    var defaultCredentials = adminInstance.credential.applicationDefault();
    if (defaultCredentials) {
        console.log('cypress-firebase: Using default credentials'); // eslint-disable-line no-console
        return defaultCredentials;
    }
}
/**
 * Get default datbase url
 * @param projectId - Project id
 * @returns Default database url
 */
function getDefaultDatabaseUrl(projectId) {
    var FIREBASE_DATABASE_EMULATOR_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
    return FIREBASE_DATABASE_EMULATOR_HOST
        ? "http://".concat(FIREBASE_DATABASE_EMULATOR_HOST, "?ns=").concat(projectId || 'local')
        : "https://".concat(projectId, ".firebaseio.com");
}
/**
 * Initialize Firebase instance from service account (from either local
 * serviceAccount.json or environment variables)
 * @returns Initialized Firebase instance
 * @param adminInstance - firebase-admin instance to initialize
 * @param overrideConfig - firebase-admin instance to initialize
 */
function initializeFirebase(adminInstance, overrideConfig) {
    try {
        // TODO: Look into using @firebase/testing in place of admin here to allow for
        // usage of clearFirestoreData (see https://github.com/prescottprue/cypress-firebase/issues/73 for more info)
        var FIREBASE_DATABASE_EMULATOR_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
        var fbConfig = tslib_1.__assign({}, overrideConfig);
        if (FIREBASE_DATABASE_EMULATOR_HOST) {
            /* eslint-disable no-console */
            console.log('cypress-firebase: Using RTDB emulator with host:', FIREBASE_DATABASE_EMULATOR_HOST);
            /* eslint-enable no-console */
        }
        if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
            /* eslint-disable no-console */
            console.log('cypress-firebase: Using Auth emulator with port:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
            /* eslint-enable no-console */
        }
        // Add credentials if they do not already exist - starting with application default, falling back to SERVICE_ACCOUNT env variable
        if (!fbConfig.credential) {
            var credential_1 = getFirebaseCredential(adminInstance);
            if (credential_1) {
                fbConfig.credential = credential_1;
            }
        }
        // Add projectId to fb config if it doesn't already exist
        if (!fbConfig.projectId) {
            var projectId = process.env.GCLOUD_PROJECT ||
                ((fbConfig && fbConfig.credential) || {}).projectId; // eslint-disable-line camelcase
            if (projectId) {
                fbConfig.projectId = projectId;
            }
        }
        // Add databaseURL if it doesn't already exist
        if (!fbConfig.databaseURL) {
            var databaseURL = getDefaultDatabaseUrl(fbConfig.projectId);
            if (databaseURL) {
                fbConfig.databaseURL = databaseURL;
            }
        }
        var fbInstance = adminInstance.initializeApp(fbConfig);
        // Initialize Firestore with emulator host settings
        if (process.env.FIRESTORE_EMULATOR_HOST) {
            var firestoreSettings = firestoreSettingsFromEnv();
            /* eslint-disable no-console */
            console.log('cypress-firebase: Using Firestore emulator with settings:', firestoreSettings);
            /* eslint-enable no-console */
            adminInstance.firestore().settings(firestoreSettings);
        }
        /* eslint-disable no-console */
        var dbUrlLog = fbConfig.databaseURL
            ? " and databaseURL \"".concat(fbConfig.databaseURL, "\"")
            : '';
        console.log("cypress-firebase: Initialized Firebase app for project \"".concat(fbConfig.projectId, "\"").concat(dbUrlLog));
        /* eslint-enable no-console */
        return fbInstance;
    }
    catch (err) {
        /* eslint-disable no-console */
        console.error('cypress-firebase: Error initializing firebase-admin instance:', err instanceof Error && err.message);
        /* eslint-enable no-console */
        throw err;
    }
}
exports.initializeFirebase = initializeFirebase;
/**
 * Check with or not a slash path is the path of a document
 * @param slashPath - Path to check for whether or not it is a doc
 * @returns Whether or not slash path is a document path
 */
function isDocPath(slashPath) {
    return !(slashPath.replace(/^\/|\/$/g, '').split('/').length % 2);
}
exports.isDocPath = isDocPath;
/**
 * Apply where setting to reference
 * @param ref - Reference
 * @param whereSetting - Where options
 * @param firestoreStatics - Firestore statics
 * @returns Refere with where applied
 */
function applyWhere(ref, whereSetting, firestoreStatics) {
    var _a = tslib_1.__read(whereSetting, 3), param = _a[0], filterOp = _a[1], val = _a[2];
    return ref.where(param, filterOp, (0, tasks_1.convertValueToTimestampOrGeoPointIfPossible)(val, firestoreStatics));
}
exports.applyWhere = applyWhere;
/**
 * Convert slash path to Firestore reference
 * @param firestoreStatics - Firestore instance statics (invoking gets instance)
 * @param slashPath - Path to convert into firestore reference
 * @param options - Options object
 * @returns Ref at slash path
 */
function slashPathToFirestoreRef(firestoreStatics, slashPath, options) {
    if (!slashPath) {
        throw new Error('Path is required to make Firestore Reference');
    }
    var firestoreInstance = firestoreStatics();
    if (isDocPath(slashPath)) {
        return firestoreInstance.doc(slashPath);
    }
    var ref = firestoreInstance.collection(slashPath);
    // Apply orderBy to query if it exists
    if (options && options.orderBy && typeof ref.orderBy === 'function') {
        if (Array.isArray(options.orderBy)) {
            ref = ref.orderBy.apply(ref, tslib_1.__spreadArray([], tslib_1.__read(options.orderBy), false));
        }
        else {
            ref = ref.orderBy(options.orderBy);
        }
    }
    // Apply where to query if it exists
    if (options &&
        options.where &&
        Array.isArray(options.where) &&
        typeof ref.where === 'function') {
        if (Array.isArray(options.where[0])) {
            options.where.forEach(function (whereCondition) {
                ref = applyWhere(ref, whereCondition, options.statics || firestoreStatics);
            });
        }
        else {
            ref = applyWhere(ref, options.where, options.statics || firestoreStatics);
        }
    }
    // Apply limit to query if it exists
    if (options && options.limit && typeof ref.limit === 'function') {
        ref = ref.limit(options.limit);
    }
    // Apply limitToLast to query if it exists
    if (options && options.limitToLast && typeof ref.limitToLast === 'function') {
        ref = ref.limitToLast(options.limitToLast);
    }
    return ref;
}
exports.slashPathToFirestoreRef = slashPathToFirestoreRef;
/**
 * @param db - Firestore instance
 * @param query - Query which is limited to batch size
 * @param resolve - Resolve function
 * @param reject - Reject function
 */
function deleteQueryBatch(db, query, resolve, reject) {
    query
        .get()
        .then(function (snapshot) {
        // When there are no documents left, we are done
        if (snapshot.size === 0) {
            return 0;
        }
        // Delete documents in a batch
        var batch = db.batch();
        snapshot.docs.forEach(function (doc) {
            batch.delete(doc.ref);
        });
        return batch.commit().then(function () { return snapshot.size; });
    })
        .then(function (numDeleted) {
        if (numDeleted === 0) {
            resolve();
            return;
        }
        // Recurse on the next process tick, to avoid
        // exploding the stack.
        process.nextTick(function () {
            deleteQueryBatch(db, query, resolve, reject);
        });
    })
        .catch(reject);
}
/**
 * @param db - Firestore database instance
 * @param refOrQuery - Firestore instance
 * @param options - Call Firestore options
 * @returns Promise which resolves with results of deleting batch
 */
function deleteCollection(db, refOrQuery, options) {
    var baseQuery = refOrQuery.orderBy('__name__');
    // If no ordering is applied, order by id (__name__) to have groups in order
    if (!(options && options.orderBy)) {
        baseQuery = refOrQuery.orderBy('__name__');
    }
    // Limit to batches to set batchSize or 500
    if (!(options && options.limit)) {
        baseQuery = refOrQuery.limit((options && options.batchSize) || 500);
    }
    return new Promise(function (resolve, reject) {
        deleteQueryBatch(db, baseQuery, resolve, reject);
    });
}
exports.deleteCollection = deleteCollection;
