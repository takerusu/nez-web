var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Debug = {};

var PegNodeShape = (function (_super) {
    __extends(PegNodeShape, _super);
    function PegNodeShape() {
        _super.apply(this, arguments);
    }
    PegNodeShape.prototype.PrepareHTMLContent = function () {
        if (this.Content == null) {
            var div = document.createElement("div");
            this.Content = div;

            div.id = this.NodeView.Label;
            div.setAttribute("data-nodelabel", this.NodeView.Label);

            if (this.NodeView.Label) {
                var h4 = document.createElement("h4");
                h4.textContent = "#" + this.NodeView.Label.split("#")[1];
                div.appendChild(h4);
            }
            if (this.NodeView.Content) {
                var p = document.createElement("p");
                p.innerText = this.NodeView.Content.trim();
                div.appendChild(p);
            }
            this.UpdateHtmlClass();
        }
    };

    PegNodeShape.prototype.PrepareSVGContent = function () {
        _super.prototype.PrepareSVGContent.call(this);
        this.BodyRect = VisModelJS.Utils.createSVGElement("rect");
        this.ShapeGroup.appendChild(this.BodyRect);
        if (this.NodeView.IsFolded()) {
            this.ShapeGroup.appendChild(PegNodeShape.ModuleSymbolMaster.cloneNode());
        }
    };

    PegNodeShape.prototype.FitSizeToContent = function () {
        this.BodyRect.setAttribute("width", this.GetNodeWidth().toString());
        this.BodyRect.setAttribute("height", this.GetNodeHeight().toString());
        if (this.NodeView.Children == null && !this.NodeView.IsFolded()) {
            var x = (this.GetNodeWidth() / 2).toString();
            var y = (this.GetNodeHeight() + 20).toString();
        }
    };

    PegNodeShape.prototype.UpdateHtmlClass = function () {
        this.Content.className = "node node-peg";
    };
    PegNodeShape.ModuleSymbolMaster = (function () {
        var Master = VisModelJS.Utils.createSVGElement("rect");
        Master.setAttribute("width", "80px");
        Master.setAttribute("height", "13px");
        Master.setAttribute("y", "-13px");
        return Master;
    })();
    return PegNodeShape;
})(VisModelJS.Shape);

var PegShapeFactory = (function (_super) {
    __extends(PegShapeFactory, _super);
    function PegShapeFactory() {
        _super.apply(this, arguments);
    }
    PegShapeFactory.prototype.CreateShape = function (Node) {
        return new PegNodeShape(Node);
    };
    return PegShapeFactory;
})(VisModelJS.ShapeFactory);

var sampleData = {
    tag: "JSON",
    value: [
        {
            tag: "KeyValue",
            value: [
                {
                    tag: "String",
                    value: "name"
                },
                {
                    tag: "String",
                    value: "taro"
                }
            ]
        },
        {
            tag: "KeyValue",
            value: [
                {
                    tag: "String",
                    value: "id"
                },
                {
                    tag: "Integer",
                    value: "1"
                }
            ]
        },
        {
            tag: "KeyValue",
            value: [
                {
                    tag: "String",
                    value: "friends"
                },
                {
                    tag: "List",
                    value: [
                        {
                            tag: "String",
                            value: "yamada"
                        },
                        {
                            tag: "String",
                            value: "kondo"
                        }
                    ]
                }
            ]
        }
    ]
};

var createNodeViewFromP4DJson = function () {
    var i = 0;
    return function (json) {
        var node = new VisModelJS.NodeView();
        node.Label = (i++).toString() + "#" + json.tag;
        if (json.value) {
            if (json.value.constructor.name == "Array") {
                json.value.forEach(function (json) {
                    node.AppendChild(createNodeViewFromP4DJson(json));
                });
            } else {
                node.Content = json.value.toString();
            }
        }
        return node;
    };
}();

$(function () {
    //Browser detection
    var UA = VisModelJS.Utils.UserAgant;
    if (!UA.isBlink() && !UA.isWebkit() && !UA.isGecko()) {
        alert('Not supported browser. Use Chrome/Safari/FireFox.');
        return;
    }

    VisModelJS.ShapeFactory.SetFactory(new PegShapeFactory());

});
//# sourceMappingURL=app.js.map
