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

    var patches = [];

    var C = {
        settings: function() {
            useProxy(storage);
            return React.createElement(ReactNative.ScrollView, null,
                React.createElement(FormSwitchRow, {
                    label: "Hide Revenge section",
                    subLabel: "Check debug logs for section labels if not working",
                    value: storage.hidden,
                    onValueChange: function(v) { storage.hidden = v; }
                })
            );
        },

        onLoad: function() {
            var createListModule = findByProps("createList");
            if (createListModule) {
                patches.push(after("createList", createListModule, function(args, ret) {
                    var config = args[0];
                    if (config && config.sections && Array.isArray(config.sections)) {
                        // Log ALL section labels so we know what to filter
                        console.log("[StealthRevenge] All sections:", JSON.stringify(
                            config.sections.map(function(s) { return { label: s.label, title: s.title, settings: s.settings }; })
                        ));
                        if (!storage.hidden) return ret;
                        config.sections = config.sections.filter(function(s) {
                            var lbl = (s.label || s.title || "").toLowerCase();
                            return !lbl.includes("revenge") && !lbl.includes("bunny") && !lbl.includes("vendetta");
                        });
                    }
                    return ret;
                }));
            }

            var OverviewScreen = findByName("SettingsOverviewScreen", false);
            if (OverviewScreen) {
                patches.push(after("default", OverviewScreen, function(_args, res) {
                    // Walk tree looking for sections prop and log it
                    function walk(node) {
                        if (node == null || typeof node !== "object") return;
                        if (Array.isArray(node)) { node.forEach(walk); return; }
                        if (node.props && Array.isArray(node.props.sections)) {
                            console.log("[StealthRevenge] OverviewScreen sections:", JSON.stringify(
                                node.props.sections.map(function(s) { return { label: s.label, title: s.title }; })
                            ));
                        }
                        if (node.props && node.props.children) walk(node.props.children);
                    }
                    walk(res);
                    return res;
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
