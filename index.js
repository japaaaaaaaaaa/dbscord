(function(u, components, plugin, storage, assets, metro, patcher, common) {
    "use strict";

    const { after } = patcher;
    const { findByName, findByProps } = metro;
    const React = common.React;
    const ReactNative = common.ReactNative;
    const { useProxy } = storage;
    const { Forms } = components;
    const { ScrollView } = ReactNative;

    plugin.storage.hidden ??= false;

    function isRevengeSection(section) {
        if (!section || !section.label) return false;
        const lbl = section.label.toLowerCase();
        return lbl.includes("revenge") || lbl.includes("bunny") || lbl.includes("vendetta");
    }

    function StealthToggleRow() {
        useProxy(plugin.storage);
        return React.createElement(Forms.FormSwitchRow, {
            label: "Hide Revenge in Settings",
            subLabel: "Removes the Revenge section from the Settings list",
            value: plugin.storage.hidden,
            onValueChange: function(v) { plugin.storage.hidden = v; }
        });
    }

    function Settings() {
        useProxy(plugin.storage);
        return React.createElement(ScrollView, null,
            React.createElement(Forms.FormSwitchRow, {
                label: "Hide Revenge section",
                subLabel: "Removes the Revenge section from Discord's Settings. Toggle it here or from App Settings.",
                value: plugin.storage.hidden,
                onValueChange: function(v) { plugin.storage.hidden = v; }
            })
        );
    }

    var patches = [];

    var C = {
        onLoad: function() {
            // Patch 1: strip Revenge section from the rendered settings tree
            var OverviewScreen = findByName("UserSettingsOverviewScreen", false);
            if (OverviewScreen) {
                patches.push(after("default", OverviewScreen, function(_args, res) {
                    if (!plugin.storage.hidden) return res;

                    function strip(node) {
                        if (node == null || typeof node !== "object") return node;
                        if (Array.isArray(node)) return node.map(strip).filter(Boolean);
                        if (node.props && node.props.label && isRevengeSection(node.props)) return null;
                        if (node.props && node.props.sections) {
                            var c = Object.assign({}, node);
                            c.props = Object.assign({}, node.props);
                            c.props.sections = node.props.sections.filter(function(s) { return !isRevengeSection(s); });
                            return c;
                        }
                        if (node.props && node.props.children != null) {
                            var c = Object.assign({}, node);
                            c.props = Object.assign({}, node.props);
                            c.props.children = strip(node.props.children);
                            return c;
                        }
                        return node;
                    }

                    return strip(res);
                }));
            }

            // Patch 2: inject toggle into App Settings / Appearance screen
            var AppScreen = findByName("AppSettingsScreen", false) || findByName("AppearanceSettingsScreen", false);
            if (AppScreen) {
                patches.push(after("default", AppScreen, function(_args, res) {
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
                                React.createElement(StealthToggleRow, { key: "stealth-revenge" })
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
        },

        settings: Settings
    };

    u.default = C;
    Object.defineProperty(u, "__esModule", { value: true });
    return u;

})({}, vendetta.ui.components, vendetta.plugin, vendetta.storage, vendetta.ui.assets, vendetta.metro, vendetta.patcher, vendetta.metro.common);
