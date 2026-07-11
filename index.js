(function(u, y, a, w, d, b) {
    "use strict";

    var FormSwitchRow = y.Forms.FormSwitchRow;
    var React = vendetta.metro.common.React;
    var ReactNative = vendetta.metro.common.ReactNative;
    var after = b.after;
    var findByName = d.findByName;
    var findByProps = d.findByProps;
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
            // Primary method: patch createList which builds the sections array
            var createListModule = findByProps("createList");
            if (createListModule) {
                patches.push(after("createList", createListModule, function(args, ret) {
                    if (!storage.hidden) return ret;
                    var config = args[0];
                    if (config && config.sections && Array.isArray(config.sections)) {
                        config.sections = config.sections.filter(function(s) {
                            return !isRevengeSection(s);
                        });
                    }
                    return ret;
                }));
            }

            // Fallback: patch SettingsOverviewScreen render
            var OverviewScreen = findByName("SettingsOverviewScreen", false);
            if (OverviewScreen) {
                patches.push(after("default", OverviewScreen, function(_args, res) {
                    if (!storage.hidden) return res;

                    // Find the node with a sections prop and filter it
                    function stripSections(node) {
                        if (node == null || typeof node !== "object") return node;
                        if (Array.isArray(node)) return node.map(stripSections).filter(Boolean);
                        if (node.props && Array.isArray(node.props.sections)) {
                            var c = Object.assign({}, node);
                            c.props = Object.assign({}, node.props);
                            c.props.sections = node.props.sections.filter(function(s) {
                                return !isRevengeSection(s);
                            });
                            return c;
                        }
                        if (node.props && node.props.children != null) {
                            var c = Object.assign({}, node);
                            c.props = Object.assign({}, node.props);
                            c.props.children = stripSections(node.props.children);
                            return c;
                        }
                        return node;
                    }

                    return stripSections(res);
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
