const { after } = bunny.api.patcher;
const { findByName, findByProps } = bunny.metro;
const React = bunny.metro.common.React;
const { useProxy } = bunny.api.storage ?? {};
const storage = bunny.plugin.createStorage();

function isRevengeSection(section) {
    if (!section || !section.label) return false;
    const lbl = section.label.toLowerCase();
    return lbl.includes("revenge") || lbl.includes("bunny") || lbl.includes("vendetta");
}

function StealthToggleRow() {
    const [hidden, setHidden] = React.useState(storage.hidden ?? false);

    return React.createElement(bunny.metro.common.ReactNative.ScrollView, null,
        React.createElement(
            findByProps("FormSwitchRow").FormSwitchRow ?? findByName("FormSwitchRow"),
            {
                label: "Hide Revenge in Settings",
                subLabel: "Removes the Revenge section from the Settings list",
                value: hidden,
                onValueChange: function(v) {
                    storage.hidden = v;
                    setHidden(v);
                },
            }
        )
    );
}

const patches = [];

plugin = definePlugin({
    start: function() {
        if (storage.hidden === undefined) storage.hidden = false;

        // Patch 1: strip Revenge section from rendered settings tree
        const OverviewScreen = findByName("UserSettingsOverviewScreen", false);
        if (OverviewScreen) {
            patches.push(after("default", OverviewScreen, function(_args, res) {
                if (!storage.hidden) return res;

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
        const AppScreen = findByName("AppSettingsScreen", false) || findByName("AppearanceSettingsScreen", false);
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

    stop: function() {
        for (var i = 0; i < patches.length; i++) patches[i]();
        patches.length = 0;
    },

    SettingsComponent: StealthToggleRow,
});
