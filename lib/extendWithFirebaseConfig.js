"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/**
 * Load config for Cypress from environment variables. Loads
 * FIREBASE_AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST,
 * FIREBASE_DATABASE_EMULATOR_HOST, and GCLOUD_PROJECT variable
 * values from environment to pass to Cypress environment
 * @param cypressConfig - Existing Cypress config
 * @returns Cypress config extended with environment variables
 */
function extendWithFirebaseConfig(cypressConfig) {
    var valuesFromEnv = [
        'FIREBASE_AUTH_EMULATOR_HOST',
        'FIREBASE_DATABASE_EMULATOR_HOST',
        'FIRESTORE_EMULATOR_HOST',
        'GCLOUD_PROJECT',
    ].reduce(function (acc, varKey) {
        var _a;
        return process.env[varKey] ? tslib_1.__assign(tslib_1.__assign({}, acc), (_a = {}, _a[varKey] = process.env[varKey], _a)) : acc;
    }, {});
    // Return merge with original config (so it is not runover)
    return tslib_1.__assign(tslib_1.__assign({}, cypressConfig), { env: tslib_1.__assign(tslib_1.__assign({}, valuesFromEnv), ((cypressConfig && cypressConfig.env) || {})) });
}
exports.default = extendWithFirebaseConfig;
