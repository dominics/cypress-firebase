"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthUser = exports.createCustomToken = exports.callFirestore = exports.callRtdb = exports.convertValueToTimestampOrGeoPointIfPossible = void 0;
var tslib_1 = require("tslib");
var firebase_utils_1 = require("./firebase-utils");
/**
 * @param baseRef - Base RTDB reference
 * @param options - Options for ref
 * @returns RTDB Reference
 */
function optionsToRtdbRef(baseRef, options) {
    var newRef = baseRef;
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
    ].forEach(function (optionName) {
        var _a;
        if (options && options[optionName]) {
            var args = options[optionName];
            // Spread arg arrays (such as startAfter and endBefore)
            if (Array.isArray(args)) {
                newRef = (_a = newRef)[optionName].apply(_a, tslib_1.__spreadArray([], tslib_1.__read(args), false));
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
    var auth = tenantId
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
    if ((dataVal && dataVal._methodName) === 'serverTimestamp' ||
        (dataVal && dataVal._methodName) === 'FieldValue.serverTimestamp' // v8 and earlier
    ) {
        return firestoreStatics.FieldValue.serverTimestamp();
    }
    if ((dataVal && dataVal._methodName) === 'deleteField' ||
        (dataVal && dataVal._methodName) === 'FieldValue.delete' // v8 and earlier
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
    return Object.entries(data).reduce(function (acc, _a) {
        var _b, _c;
        var _d = tslib_1.__read(_a, 2), currKey = _d[0], currData = _d[1];
        // Convert nested timestamp if item is an object
        if (typeof currData === 'object' &&
            currData !== null &&
            !Array.isArray(currData) &&
            /* eslint-disable-next-line no-underscore-dangle */
            !currData._methodName &&
            !currData.seconds &&
            !(currData.latitude && currData.longitude)) {
            return tslib_1.__assign(tslib_1.__assign({}, acc), (_b = {}, _b[currKey] = getDataWithTimestampsAndGeoPoints(currData, firestoreStatics), _b));
        }
        var value = Array.isArray(currData)
            ? currData.map(function (dataItem) {
                var result = convertValueToTimestampOrGeoPointIfPossible(dataItem, firestoreStatics);
                return result.constructor === Object
                    ? getDataWithTimestampsAndGeoPoints(result, firestoreStatics)
                    : result;
            })
            : convertValueToTimestampOrGeoPointIfPossible(currData, firestoreStatics);
        return tslib_1.__assign(tslib_1.__assign({}, acc), (_c = {}, _c[currKey] = value, _c));
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
function callRtdb(adminInstance, action, actionPath, options, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var dbRef, snap, pushRef, actionNameMap, cleanedActionName, err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Handle actionPath not being set (see #244 for more info)
                    if (!actionPath) {
                        throw new Error('actionPath is required for callRtdb. Use "/" for top level actions.');
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    dbRef = adminInstance.database().ref(actionPath);
                    if (!(action === 'get')) return [3 /*break*/, 3];
                    return [4 /*yield*/, optionsToRtdbRef(dbRef, options).once('value')];
                case 2:
                    snap = _a.sent();
                    return [2 /*return*/, snap.val()];
                case 3:
                    if (!(action === 'push')) return [3 /*break*/, 5];
                    pushRef = dbRef.push();
                    return [4 /*yield*/, pushRef.set(data)];
                case 4:
                    _a.sent();
                    // TODO: Return key on an object for consistent return regardless of action
                    return [2 /*return*/, pushRef.key];
                case 5:
                    actionNameMap = {
                        delete: 'remove',
                    };
                    cleanedActionName = actionNameMap[action] || action;
                    return [4 /*yield*/, dbRef[cleanedActionName](data)];
                case 6:
                    _a.sent();
                    // Prevents Cypress error with message:
                    // "You must return a promise, a value, or null to indicate that the task was handled."
                    return [2 /*return*/, null];
                case 7:
                    err_1 = _a.sent();
                    /* eslint-disable no-console */
                    console.error("cypress-firebase: Error with RTDB \"".concat(action, "\" at path \"").concat(actionPath, "\" :"), err_1);
                    /* eslint-enable no-console */
                    throw err_1;
                case 8: return [2 /*return*/];
            }
        });
    });
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
function callFirestore(adminInstance, action, actionPath, options, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var snap, deletePromise, dataToSet, err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!(action === 'get')) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, firebase_utils_1.slashPathToFirestoreRef)(adminInstance.firestore, actionPath, options).get()];
                case 1:
                    snap = _a.sent();
                    if (snap &&
                        snap.docs &&
                        snap.docs.length &&
                        typeof snap.docs.map === 'function') {
                        return [2 /*return*/, snap.docs.map(function (docSnap) { return (tslib_1.__assign(tslib_1.__assign({}, docSnap.data()), { id: docSnap.id })); })];
                    }
                    // Falling back to null in the case of falsey value prevents Cypress error with message:
                    // "You must return a promise, a value, or null to indicate that the task was handled."
                    return [2 /*return*/, (typeof (snap && snap.data) === 'function' && snap.data()) || null];
                case 2:
                    if (!(action === 'delete')) return [3 /*break*/, 4];
                    deletePromise = (0, firebase_utils_1.isDocPath)(actionPath)
                        ? (0, firebase_utils_1.slashPathToFirestoreRef)(adminInstance.firestore, actionPath, options).delete()
                        : (0, firebase_utils_1.deleteCollection)(adminInstance.firestore(), (0, firebase_utils_1.slashPathToFirestoreRef)(adminInstance.firestore, actionPath, options), options);
                    return [4 /*yield*/, deletePromise];
                case 3:
                    _a.sent();
                    // Returning null in the case of falsey value prevents Cypress error with message:
                    // "You must return a promise, a value, or null to indicate that the task was handled."
                    return [2 /*return*/, null];
                case 4:
                    if (!data) {
                        throw new Error("You must define data to run ".concat(action, " in firestore."));
                    }
                    dataToSet = getDataWithTimestampsAndGeoPoints(data, 
                    // Use static option if passed (tests), otherwise fallback to statics on adminInstance
                    // Tests do not have statics since they are using @firebase/testing
                    (options && options.statics) ||
                        adminInstance.firestore);
                    if (action === 'set') {
                        return [2 /*return*/, adminInstance
                                .firestore()
                                .doc(actionPath)
                                .set(dataToSet, options && options.merge
                                ? {
                                    merge: options && options.merge,
                                }
                                : undefined)];
                    }
                    // "update" and "add" action
                    return [2 /*return*/, (0, firebase_utils_1.slashPathToFirestoreRef)(adminInstance.firestore, actionPath, options)[action](dataToSet)];
                case 5:
                    err_2 = _a.sent();
                    /* eslint-disable no-console */
                    console.error("cypress-firebase: Error with Firestore \"".concat(action, "\" at path \"").concat(actionPath, "\" :"), err_2);
                    /* eslint-enable no-console */
                    throw err_2;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.callFirestore = callFirestore;
/**
 * Create a custom token
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of user for which the custom token will be generated
 * @param settings - Settings object
 * @returns Promise which resolves with a custom Firebase Auth token
 */
function createCustomToken(adminInstance, uid, settings) {
    // Use custom claims or default to { isTesting: true }
    var customClaims = (settings && settings.customClaims) || {
        isTesting: true,
    };
    // Create auth token
    return getAuth(adminInstance, settings.tenantId).createCustomToken(uid, customClaims);
}
exports.createCustomToken = createCustomToken;
/**
 * Get Firebase Auth user based on UID
 * @param adminInstance - Admin SDK instance
 * @param uid - UID of user for which the custom token will be generated
 * @param tenantId - Optional ID of tenant used for multi-tenancy
 * @returns Promise which resolves with a custom Firebase Auth token
 */
function getAuthUser(adminInstance, uid, tenantId) {
    return getAuth(adminInstance, tenantId).getUser(uid);
}
exports.getAuthUser = getAuthUser;
