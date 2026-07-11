(function(u, y, a, w, d, b) {
    "use strict";

    var FormSwitchRow = y.Forms.FormSwitchRow;
    var React = vendetta.metro.common.React;
    var ReactNative = vendetta.metro.common.ReactNative;
    var after = b.after;
    var findByProps = d.findByProps;
    var findByName = d.findByName;
    var storage = a.storage;
    var useProxy = w.useProxy;

    storage.hidden ??= false;

    var patches = [];

    function makeDummy(orig) {
        return Object.assign({}, orig, {
            usePredicate: function() { return false; },
            predicate: function() { return false; }
        });
    }

    var C = {
        settings: function() {
            useProxy(storage);
            return React.createElement(ReactNative.ScrollView, null,
                React.createElement(FormSwitchRow, {
                    label: "Hide Revenge section",
                    subLabel: "To unhide: open Voice & Video (will crash) then disable plugin from crash screen.",
                    value: storage.hidden,
                    onValueChange: function(v) { storage.hidden = v; }
                })
            );
        },

        onLoad: function() {
            // ── 1. Hide Revenge rows ──────────────────────────────────────────
            var settingConstants = findByProps("SETTING_RENDERER_CONFIG");
            if (!settingConstants) return;

            var orig = settingConstants.SETTING_RENDERER_CONFIG;
            var current = orig;

            Object.defineProperty(settingConstants, "SETTING_RENDERER_CONFIG", {
                configurable: true,
                enumerable: true,
                get: function() {
                    if (!storage.hidden) return current;
                    var result = {};
                    var keys = Object.keys(current);
                    for (var i = 0; i < keys.length; i++) {
                        var k = keys[i];
                        var kl = k.toLowerCase();
                        var isRevenge = kl.includes("bunny") ||
                            kl.includes("vendetta") ||
                            kl.includes("revenge") ||
                            k === "VendettaCustomPage" ||
                            k === "BUNNY_CUSTOM_PAGE";
                        result[k] = isRevenge ? makeDummy(current[k]) : current[k];
                    }
                    return result;
                },
                set: function(v) { current = v; }
            });

            patches.push(function() {
                Object.defineProperty(settingConstants, "SETTING_RENDERER_CONFIG", {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: orig
                });
            });

            // ── 2. Crash Voice & Video on purpose ────────────────────────────
            // Only crashes when hidden is ON, so you can open Voice & Video
            // normally when Revenge is visible (plugin disabled).
            var createListModule = findByProps("createList");
            if (createListModule) {
                patches.push(after("createList", createListModule, function(args, ret) {
                    if (!storage.hidden) return ret;
                    var config = args[0];
                    if (config && Array.isArray(config.sections)) {
                        // Check if this is the voice screen by looking for voice-related keys
                        var isVoice = config.sections.some(function(s) {
                            return Array.isArray(s.settings) && s.settings.some(function(k) {
                                return k === "INPUT_MODE" || k === "VOICE_MODE" ||
                                    k === "VIDEO_BACKGROUND" || k === "NOISE_CANCELLATION" ||
                                    k === "ECHO_CANCELLATION" || k === "NOISE_SUPPRESSION";
                            });
                        });
                        if (isVoice) {
                            // Intentional crash — null dereference
                            null.stealthRevengeCrashToDisable;
                        }
                    }
                    return ret;
                }));
            }
        },

        onUnload: function() {
            patches.forEach(function(p) { p && p(); });
            patches = [];
        }
    };

    u.default = C;
    Object.defineProperty(u, "__esModule", { value: true });
    return u;

})({}, vendetta.ui.components, vendetta.plugin, vendetta.storage, vendetta.metro, vendetta.patcher);
