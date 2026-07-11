(function(u, y, a, w, d, b) {
    "use strict";

    var FormSwitchRow = y.Forms.FormSwitchRow;
    var FormSection = y.Forms.FormSection;
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

    // Injected at bottom of Voice & Video — lets you UN-hide
    function ShowRevengeToggle() {
        useProxy(storage);
        return React.createElement(ReactNative.View, null,
            React.createElement(FormSection, { title: "StealthRevenge" },
                React.createElement(FormSwitchRow, {
                    label: "Show Revenge section",
                    subLabel: "Turn off to reveal the Revenge section in settings",
                    value: !storage.hidden,
                    onValueChange: function(v) { storage.hidden = !v; }
                })
            )
        );
    }

    var C = {
        // Plugin settings page — lets you HIDE
        settings: function() {
            useProxy(storage);
            return React.createElement(ReactNative.ScrollView, null,
                React.createElement(FormSwitchRow, {
                    label: "Hide Revenge section",
                    subLabel: "When on, the Revenge section is removed from Settings. Unhide from Voice & Video.",
                    value: storage.hidden,
                    onValueChange: function(v) { storage.hidden = v; }
                })
            );
        },

        onLoad: function() {
            // ── 1. Hide Revenge rows via SETTING_RENDERER_CONFIG ──────────────
            var settingConstants = findByProps("SETTING_RENDERER_CONFIG");
            if (settingConstants) {
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
            }

            // ── 2. Inject "Show Revenge" toggle at bottom of Voice & Video ────
            var VoiceVideoScreen = findByName("VoiceAndVideoSettingsScreen", false)
                || findByName("VoiceVideoSettingsScreen", false)
                || findByName("VoiceAndVideoSettings", false);

            if (VoiceVideoScreen) {
                patches.push(after("default", VoiceVideoScreen, function(_args, res) {
                    if (!res || !res.props) return res;

                    var injected = false;

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
                                React.createElement(ShowRevengeToggle, { key: "stealth-show-toggle" })
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
