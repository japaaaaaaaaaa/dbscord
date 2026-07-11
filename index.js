(function(u, y, a, w, d, b) {
    "use strict";

    var FormSwitchRow = y.Forms.FormSwitchRow;
    var React = vendetta.metro.common.React;
    var ReactNative = vendetta.metro.common.ReactNative;
    var findByProps = d.findByProps;
    var storage = a.storage;
    var useProxy = w.useProxy;

    storage.hidden ??= false;

    var patches = [];

    // A dummy renderer config entry that makes the row invisible
    // It needs a "parent" so toSettingListItems doesn't crash
    function makeDummy(orig) {
        return Object.assign({}, orig, {
            // usePredicate returning false hides the row without removing it
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
                    subLabel: "Removes the Revenge section from Discord's Settings list.",
                    value: storage.hidden,
                    onValueChange: function(v) { storage.hidden = v; }
                })
            );
        },

        onLoad: function() {
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

                        if (isRevenge) {
                            // Return a dummy that hides the row but keeps the key
                            // so toSettingListItems can still read .parent etc.
                            result[k] = makeDummy(current[k]);
                        } else {
                            result[k] = current[k];
                        }
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
