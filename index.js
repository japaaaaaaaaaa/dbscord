(function(u, y, a, w, d, b) {
    "use strict";

    var FormSwitchRow = y.Forms.FormSwitchRow;
    var React = vendetta.metro.common.React;
    var ReactNative = vendetta.metro.common.ReactNative;
    var after = b.after;
    var findByProps = d.findByProps;
    var storage = a.storage;
    var useProxy = w.useProxy;

    storage.hidden ??= false;

    // Known keys that Revenge puts in its settings section
    var REVENGE_KEYS = [
        "VendettaCustomPage", "BUNNY_CUSTOM_PAGE",
        "BUNNY_PLUGINS", "BUNNY_THEMES", "BUNNY_SETTINGS",
        "VENDETTA_PLUGINS", "VENDETTA_THEMES", "VENDETTA_SETTINGS",
        "REVENGE_PLUGINS", "REVENGE_THEMES", "REVENGE_SETTINGS",
        "BUNNY_CUSTOM", "REVENGE_CUSTOM"
    ];

    function isRevengeSection(section) {
        if (!section) return false;
        // Check label/title string
        var lbl = (section.label || section.title || "").toLowerCase();
        if (lbl.includes("revenge") || lbl.includes("bunny") || lbl.includes("vendetta")) return true;
        // Check if any settings key belongs to revenge
        if (Array.isArray(section.settings)) {
            for (var i = 0; i < section.settings.length; i++) {
                var key = section.settings[i];
                if (REVENGE_KEYS.indexOf(key) !== -1) return true;
                // Also check key string patterns
                var kl = key.toLowerCase();
                if (kl.includes("bunny") || kl.includes("vendetta") || kl.includes("revenge")) return true;
            }
        }
        return false;
    }

    var patches = [];

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
            // Patch SETTING_RENDERER_CONFIG to remove Revenge keys
            var settingConstants = findByProps("SETTING_RENDERER_CONFIG");
            if (settingConstants) {
                var orig = settingConstants.SETTING_RENDERER_CONFIG;
                var current = orig;

                Object.defineProperty(settingConstants, "SETTING_RENDERER_CONFIG", {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                        if (!storage.hidden) return current;
                        var filtered = {};
                        var keys = Object.keys(current);
                        for (var i = 0; i < keys.length; i++) {
                            var k = keys[i];
                            var kl = k.toLowerCase();
                            if (!kl.includes("bunny") && !kl.includes("vendetta") && !kl.includes("revenge")) {
                                filtered[k] = current[k];
                            }
                        }
                        return filtered;
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
            }

            // Patch createList to filter sections array
            var createListModule = findByProps("createList");
            if (createListModule) {
                patches.push(after("createList", createListModule, function(args, ret) {
                    if (!storage.hidden) return ret;
                    var config = args[0];
                    if (config && Array.isArray(config.sections)) {
                        config.sections = config.sections.filter(function(s) {
                            return !isRevengeSection(s);
                        });
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
