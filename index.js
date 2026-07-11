(function(u, y, a, w, d, b) {
    "use strict";

    var FormSwitchRow = y.Forms.FormSwitchRow;
    var ScrollView = vendetta.metro.common.ReactNative.ScrollView;
    var React = vendetta.metro.common.React;
    var after = b.after;
    var findByName = d.findByName;
    var storage = a.storage;
    var useProxy = w.useProxy;

    storage.hidden ??= false;

    function isRevengeSection(section) {
        if (!section || !section.label) return false;
        var lbl = section.label.toLowerCase();
        return lbl.includes("revenge") || lbl.includes("bunny") || lbl.includes("vendetta");
    }

    var patches = [];

    var C = {
        settings: function() {
            useProxy(storage);
            return React.createElement(ScrollView, null,
                React.createElement(FormSwitchRow, {
                    label: "Hide Revenge section",
                    subLabel: "Removes the Revenge section from Discord's Settings list.",
                    value: storage.hidden,
                    onValueChange: function(v) { storage.hidden = v; }
                })
            );
        },

        onLoad: function() {
            var OverviewScreen = findByName("UserSettingsOverviewScreen", false);
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
                                React.createElement(C.settings, { key: "stealth-revenge" })
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
