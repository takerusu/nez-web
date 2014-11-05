///<reference path='../../typings/jstree/jstree.d.ts'/>
/// <reference path="index.ts"/>
var FileManager = (function () {
    function FileManager() {
        this.FTree = [
            { "text": "default", "id": "default", "children": [] }
        ];
        this.FIndex = [[]];
        this.FIndex["default"] = 0;
    }
    FileManager.prototype.ref = function () {
        return $('#sidebar').jstree(true);
    };
    FileManager.prototype.setFolder = function (sel, fname) {
        if (!this.ref().create_node(sel, { text: fname })) {
            alert("Error");
            return false;
        }
        this.ref().open_node(sel);
        return true;
    };
    FileManager.prototype.setFile = function (selectedPos, fname) {
        if (!this.ref().create_node(selectedPos, { text: fname, type: 'file' })) {
            alert("Error");
            return false;
        }
        this.ref().open_node(selectedPos);
        return true;
    };
    FileManager.prototype.getFile = function (obj) {
        var path = this.getCurrentPath("_");
    };
    FileManager.prototype.getDefaultNode = function () {
        return "default";
    };
    FileManager.prototype.getSelectedNode = function () {
        var selectedNodes = this.ref().get_selected();
        return selectedNodes[0];
    };
    FileManager.prototype.getCurrentType = function () {
        return this.ref().get_type(this.getSelectedNode());
    };
    FileManager.prototype.getCurrentPath = function (delim) {
        if (delim === void 0) { delim = "/"; }
        return this.ref().get_path(this.getSelectedNode(), delim);
    };
    FileManager.prototype.show = function () {
        console.log(this.FTree);
    };
    return FileManager;
})();
