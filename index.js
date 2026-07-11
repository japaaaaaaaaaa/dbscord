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
                    subLabel: "Hides Revenge from Settings. Unhide it from Voice & Video.",
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

            // ── 2. Patch SettingsVoiceScreen to append our toggle ─────────────
            // We patch the render output directly — no key injection needed,
            // no toSettingListItems involvement, no crash.
            var VoiceScreen = findByName("SettingsVoiceScreen", false);

            if (VoiceScreen) {
                patches.push(after("default", VoiceScreen, function(_args, res) {
                    if (!res) return res;

                    var injected = false;

                    function StealthToggle() {
                        useProxy(storage);
                        return React.createElement(FormSwitchRow, {
                            label: "Show Revenge section",
                            subLabel: "StealthRevenge — tap to reveal hidden Revenge settings",
                            value: !storage.hidden,
                            onValueChange: function(v) { storage.hidden = !v; }
                        });
                    }

                    function inject(node) {
                        if (node == null || typeof node !== "object") return node;
                        if (Array.isArray(node)) return node.map(inject);

                        var typeName = (node.type && (node.type.displayName || node.type.name)) || "";

                        if (!injected && typeName === "ScrollView") {
                            injected = true;
                            var c = Object.assign({}, node);
                            c.props = Object.assign({}, node.props);
                            var kids = Array.isArray(node.props.children)
                                ? node.props.children
                                : node.props.children != null ? [node.props.children] : [];
                            c.props.children = kids.concat([
                                React.createElement(StealthToggle, { key: "stealth-toggle" })
                            ]);
                            return c;
                        }

                        if (node.props && node.props.children != null) {
                            var c = Object.assign({}, node);
                            c.props = Object.assign({}, node.props);
                            c.props.children = inject(node.props.children);
                            return c;
                        }

                        return node;
                    }

                    return inject(res);
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
