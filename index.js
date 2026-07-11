(function(u, y, a, w, d, b) {
    "use strict";

    var FormSwitchRow = y.Forms.FormSwitchRow;
    var FormSection = y.Forms.FormSection;
    var React = vendetta.metro.common.React;
    var ReactNative = vendetta.metro.common.ReactNative;
    var findByProps = d.findByProps;
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

    // Custom settings row component rendered by our injected key
    function StealthRevengeRow() {
        useProxy(storage);
        return React.createElement(FormSwitchRow, {
            label: "Show Revenge section",
            subLabel: "StealthRevenge — toggle to reveal the hidden Revenge section",
            value: !storage.hidden,
            onValueChange: function(v) { storage.hidden = !v; }
        });
    }

    var C = {
        settings: function() {
            useProxy(storage);
            return React.createElement(ReactNative.ScrollView, null,
                React.createElement(FormSwitchRow, {
                    label: "Hide Revenge section",
                    subLabel: "Hides Revenge from Settings. Unhide it from Voice & Video.",
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
                    var base = current;

                    // Always inject our toggle key into the Voice & Video section
                    var result = Object.assign({}, base, {
                        STEALTH_REVENGE_TOGGLE: {
                            type: "pressable",
                            title: function() { return "Show Revenge section"; },
                            useTitle: function() { return "Show Revenge section"; },
                            usePredicate: function() { return true; },
                            // Render our React component inline
                            render: StealthRevengeRow,
                            withArrow: false,
                            parent: "VOICE_VIDEO",
                            // put it in the VOICE_VIDEO section
                            section: "VOICE_VIDEO"
                        }
                    });

                    if (!storage.hidden) return result;

                    // Also hide Revenge keys when hidden is on
                    var keys = Object.keys(result);
                    for (var i = 0; i < keys.length; i++) {
                        var k = keys[i];
                        var kl = k.toLowerCase();
                        var isRevenge = kl.includes("bunny") ||
                            kl.includes("vendetta") ||
                            kl.includes("revenge") ||
                            k === "VendettaCustomPage" ||
                            k === "BUNNY_CUSTOM_PAGE";
                        if (isRevenge) {
                            result[k] = makeDummy(result[k]);
                        }
                    }

                    return result;
                },
                set: function(v) { current = v; }
            });

            // Also inject STEALTH_REVENGE_TOGGLE into the VOICE_VIDEO settings array
            var createListModule = findByProps("createList");
            if (createListModule) {
                patches.push(d.findByProps && (function() {
                    var after = b.after;
                    return after("createList", createListModule, function(args, ret) {
                        var config = args[0];
                        if (config && Array.isArray(config.sections)) {
                            for (var i = 0; i < config.sections.length; i++) {
                                var s = config.sections[i];
                                if (Array.isArray(s.settings) &&
                                    (s.settings.indexOf("INPUT_MODE") !== -1 ||
                                     s.settings.indexOf("VOICE_MODE") !== -1 ||
                                     (s.label || "").toLowerCase().includes("voice"))) {
                                    // Add our key to this section if not already there
                                    if (s.settings.indexOf("STEALTH_REVENGE_TOGGLE") === -1) {
                                        s.settings = s.settings.concat(["STEALTH_REVENGE_TOGGLE"]);
                                    }
                                }
                            }
                        }
                        return ret;
                    });
                })());
            }

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
