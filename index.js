(function() {
    const { after } = revenge.patcher ?? vendetta.patcher;
    const { findByName, findByProps } = revenge.metro ?? vendetta.metro;
    const React = revenge.metro.common?.React ?? vendetta.metro.common.React;
    const { storage } = revenge.plugin ?? vendetta.plugin;
    const { useProxy } = revenge.storage ?? vendetta.storage;
    const { Forms } = revenge.ui?.components ?? vendetta.ui.components;

    function isRevengeSection(section) {
        if (!section || !section.label) return false;
        const lbl = section.label.toLowerCase();
        return lbl.includes("revenge") || lbl.includes("bunny") || lbl.includes("vendetta");
    }

    function StealthToggleRow() {
        useProxy(storage);
        return React.createElement(Forms.FormSwitchRow, {
            label: "Hide Revenge in Settings",
            subLabel: "Removes the Revenge section from the Settings list",
            value: storage.hidden ?? false,
            onValueChange: function(v) { storage.hidden = v; },
        });
    }

    function Settings() {
        useProxy(storage);
        const ReactNative = revenge.metro.common?.ReactNative ?? vendetta.metro.common.ReactNative;
        return React.createElement(
            ReactNative.ScrollView,
            null,
            React.createElement(Forms.FormSwitchRow, {
                label: "Hide Revenge section",
                subLabel: "Removes the Revenge section from Discord's Settings list. You can still access these settings from the plugin's own settings page.",
                value: storage.hidden ?? false,
                onValueChange: function(v) { storage.hidden = v; },
            })
        );
    }

    const patches = [];

    module.exports = {
        onLoad: function() {
            if (storage.hidden === undefined) storage.hidden = false;

            // Patch 1: strip Revenge section from rendered settings tree
            const OverviewScreen = findByName("UserSettingsOverviewScreen", false);
            if (OverviewScreen) {
                const patch = after("default", OverviewScreen, function(_args, res) {
                    if (!storage.hidden) return res;

                    function strip(node) {
                        if (node == null || typeof node !== "object") return node;
                        if (Array.isArray(node)) return node.map(strip).filter(Boolean);
                        if (node.props && node.props.label && isRevengeSection(node.props)) return null;
                        if (node.props && node.props.sections) {
                            var clone = Object.assign({}, node);
                            clone.props = Object.assign({}, node.props);
                            clone.props.sections = node.props.sections.filter(function(s) { return !isRevengeSection(s); });
                            return clone;
                        }
                        if (node.props && node.props.children != null) {
                            var clone = Object.assign({}, node);
                            clone.props = Object.assign({}, node.props);
                            clone.props.children = strip(node.props.children);
                            return clone;
                        }
                        return node;
                    }

                    return strip(res);
                });
                patches.push(patch);
            }

            // Patch 2: filter SETTING_RENDERER_CONFIG
            const SettingSections = findByProps("SETTING_RENDERER_CONFIG");
            if (SettingSections && SettingSections.SETTING_RENDERER_CONFIG) {
                const original = SettingSections.SETTING_RENDERER_CONFIG;
                Object.defineProperty(SettingSections, "SETTING_RENDERER_CONFIG", {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                        if (!storage.hidden) return original;
                        const filtered = {};
                        for (const key of Object.keys(original)) {
                            const val = original[key];
                            if (!isRevengeSection({ label: key }) && !isRevengeSection(val)) {
                                filtered[key] = val;
                            }
                        }
                        return filtered;
                    },
                });
                patches.push(function() {
                    Object.defineProperty(SettingSections, "SETTING_RENDERER_CONFIG", {
                        configurable: true,
                        enumerable: true,
                        writable: true,
                        value: original,
                    });
                });
            }

            // Patch 3: inject toggle into App Settings / Appearance screen
            const AppScreen =
                findByName("AppSettingsScreen", false) ||
                findByName("AppearanceSettingsScreen", false);

            if (AppScreen) {
                const patch = after("default", AppScreen, function(_args, res) {
                    let injected = false;

                    function inject(node) {
                        if (node == null || typeof node !== "object") return node;
                        if (Array.isArray(node)) return node.map(inject);

                        const typeName = (node.type && (node.type.displayName || node.type.name)) || "";

                        if (!injected && typeName === "ScrollView") {
                            injected = true;
                            const clone = Object.assign({}, node);
                            clone.props = Object.assign({}, node.props);
                            const existing = Array.isArray(node.props.children)
                                ? node.props.children
                                : node.props.children != null
                                ? [node.props.children]
                                : [];
                            clone.props.children = existing.concat([
                                React.createElement(StealthToggleRow, { key: "stealth-revenge" })
                            ]);
                            return clone;
                        }

                        if (node.props && node.props.children != null) {
                            const clone = Object.assign({}, node);
                            clone.props = Object.assign({}, node.props);
                            clone.props.children = inject(node.props.children);
                            return clone;
                        }

                        return node;
                    }

                    return inject(res);
                });
                patches.push(patch);
            }
        },

        onUnload: function() {
            for (const unpatch of patches) unpatch();
            patches.length = 0;
        },

        settings: Settings,
    };
})();
