"use strict";

const { after } = vendetta.patcher;
const { findByName, findByProps } = vendetta.metro;
const { React } = vendetta.metro.common;
const { storage } = vendetta.plugin;
const { useProxy } = vendetta.storage;
const { Forms } = vendetta.ui.components;

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
        onValueChange: (v) => { storage.hidden = v; },
    });
}

function Settings() {
    useProxy(storage);
    return React.createElement(
        vendetta.metro.common.ReactNative.ScrollView,
        null,
        React.createElement(Forms.FormSwitchRow, {
            label: "Hide Revenge section",
            subLabel: "Removes the Revenge section from Discord's Settings list. You can still access these settings from the plugin's own settings page.",
            value: storage.hidden ?? false,
            onValueChange: (v) => { storage.hidden = v; },
        })
    );
}

const patches = [];

export default {
    onLoad() {
        storage.hidden ??= false;

        // Patch 1: strip from rendered React tree
        const OverviewScreen = findByName("UserSettingsOverviewScreen", false);
        if (OverviewScreen) {
            const patch = after("default", OverviewScreen, (_args, res) => {
                if (!storage.hidden) return res;

                function strip(node) {
                    if (node == null || typeof node !== "object") return node;
                    if (Array.isArray(node)) return node.map(strip).filter(Boolean);

                    if (node.props?.label && isRevengeSection(node.props)) return null;

                    if (node.props?.sections) {
                        const clone = Object.assign({}, node);
                        clone.props = Object.assign({}, node.props);
                        clone.props.sections = node.props.sections.filter(s => !isRevengeSection(s));
                        return clone;
                    }

                    if (node.props?.children != null) {
                        const clone = Object.assign({}, node);
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
        if (SettingSections?.SETTING_RENDERER_CONFIG) {
            const original = SettingSections.SETTING_RENDERER_CONFIG;

            Object.defineProperty(SettingSections, "SETTING_RENDERER_CONFIG", {
                configurable: true,
                enumerable: true,
                get() {
                    if (!storage.hidden) return original;
                    const filtered = {};
                    for (const [key, val] of Object.entries(original)) {
                        if (!isRevengeSection({ label: key }) && !isRevengeSection(val)) {
                            filtered[key] = val;
                        }
                    }
                    return filtered;
                },
            });

            patches.push(() => {
                Object.defineProperty(SettingSections, "SETTING_RENDERER_CONFIG", {
                    configurable: true,
                    enumerable: true,
                    value: original,
                    writable: true,
                });
            });
        }

        // Patch 3: inject toggle into App Settings screen
        const AppScreen =
            findByName("AppSettingsScreen", false) ??
            findByName("AppearanceSettingsScreen", false);

        if (AppScreen) {
            const patch = after("default", AppScreen, (_args, res) => {
                let injected = false;

                function inject(node) {
                    if (node == null || typeof node !== "object") return node;
                    if (Array.isArray(node)) return node.map(inject);

                    const type = node.type?.displayName ?? node.type?.name ?? "";

                    if (!injected && type === "ScrollView") {
                        injected = true;
                        const clone = Object.assign({}, node);
                        clone.props = Object.assign({}, node.props);
                        const existing = Array.isArray(node.props.children)
                            ? node.props.children
                            : node.props.children != null
                            ? [node.props.children]
                            : [];
                        clone.props.children = [
                            ...existing,
                            React.createElement(StealthToggleRow, { key: "stealth-revenge" }),
                        ];
                        return clone;
                    }

                    if (node.props?.children != null) {
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

    onUnload() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },

    settings: Settings,
};
