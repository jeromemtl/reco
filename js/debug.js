/* -------------------- CONFIGURATION DEBUG -------------------- */

const urlParams = new URLSearchParams(window.location.search);
const DEBUG = urlParams.has('debug');

function debugLog(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

function debugError(...args) {
    if (DEBUG) {
        console.error(...args);
    }
}

function debugWarn(...args) {
    if (DEBUG) {
        console.warn(...args);
    }
}

window.DEBUG = DEBUG;
window.debugLog = debugLog;
window.debugError = debugError;
window.debugWarn = debugWarn;

if (DEBUG) {
    console.log('🐛 Mode debug activé (paramètre ?debug dans l\'URL)');
}