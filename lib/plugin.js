"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var extendWithFirebaseConfig_1 = tslib_1.__importDefault(require("./extendWithFirebaseConfig"));
var tasks = tslib_1.__importStar(require("./tasks"));
var firebase_utils_1 = require("./firebase-utils");
/**
 * Cypress plugin which attaches tasks used by custom commands
 * and returns modified Cypress config. Modified config includes
 * env setting with values of Firebase specific environment variables
 * such as GCLOUD_PROJECT, FIREBASE_DATABASE_EMULATOR_HOST,
 * FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST.
 * @param cypressOnFunc - on function from cypress plugins file
 * @param cypressConfig - Cypress config
 * @param adminInstance - firebase-admin instance
 * @param overrideConfig - Override config for firebase instance
 * @returns Extended Cypress config
 */
function pluginWithTasks(cypressOnFunc, cypressConfig, adminInstance, overrideConfig) {
    // Only initialize admin instance if it hasn't already been initialized
    if (adminInstance.apps && adminInstance.apps.length === 0) {
        (0, firebase_utils_1.initializeFirebase)(adminInstance, overrideConfig);
    }
    var tasksWithFirebase = Object.keys(tasks).reduce(function (acc, taskName) {
        acc[taskName] = function (taskSettings) {
            if (taskSettings && taskSettings.uid) {
                return tasks[taskName](adminInstance, taskSettings.uid, taskSettings);
            }
            var action = taskSettings.action, actionPath = taskSettings.path, _a = taskSettings.options, options = _a === void 0 ? {} : _a, data = taskSettings.data;
            return tasks[taskName](adminInstance, action, actionPath, options, data);
        };
        return acc;
    }, {});
    // Attach tasks to Cypress using on function
    cypressOnFunc('task', tasksWithFirebase);
    // Return extended config
    return (0, extendWithFirebaseConfig_1.default)(cypressConfig);
}
exports.default = pluginWithTasks;
