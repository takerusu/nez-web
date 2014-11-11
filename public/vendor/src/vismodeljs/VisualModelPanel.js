var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var VisModelJS;
(function (VisModelJS) {
    var NodeViewEvent = (function (_super) {
        __extends(NodeViewEvent, _super);
        function NodeViewEvent() {
            _super.apply(this, arguments);
        }
        return NodeViewEvent;
    })(VisModelJS.VisModelEvent);
    VisModelJS.NodeViewEvent = NodeViewEvent;

    /**
    @class VisModelJS.VisualModelPanel
    */
    var VisualModelPanel = (function (_super) {
        __extends(VisualModelPanel, _super);
        function VisualModelPanel(placeHolder) {
            var _this = this;
            _super.call(this);
            this.OnScreenNodeMap = {};
            this.HiddenNodeMap = {};
            // We do not use FocusedView but FocusedLabel to make it modular.
            this.FoldingAnimationTask = new VisModelJS.AnimationFrameTask();
            if (!placeHolder) {
                throw new TypeError("placeHolder cannot be null.");
            }

            // Create Inner DOM
            this.RootElement = placeHolder;
            var rootStyle = this.RootElement.style;
            if (rootStyle.position == "static") {
                rootStyle.position = "relative";
            }
            rootStyle.overflow = "hidden";

            // Create SVG Layer
            this.SVGLayerBox = VisModelJS.Utils.createSVGElement("svg");
            this.makeItLayer(this.SVGLayerBox, "100%", "100%");

            this.SVGLayer = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayer.className.baseVal = "vismodel-svglayer";
            this.SVGLayerConnectorGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = VisModelJS.Utils.createSVGElement("g");

            this.SVGLayer.appendChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.appendChild(this.SVGLayerNodeGroup);

            this.SVGLayer.id = "svg-layer";
            this.SVGLayer.setAttribute("transform", "translate(0,0)");
            this.SVGLayerBox.appendChild(this.SVGLayer);

            this.RootElement.appendChild(this.SVGLayerBox);

            // Create HTML Layer
            this.EventMapLayer = document.createElement("div");
            this.ContentLayer = document.createElement("div");
            this.EventMapLayer.className = "vismodel-eventmaplayer";
            this.ContentLayer.className = "vismodel-contentlayer";

            this.makeItLayer(this.EventMapLayer, "100%", "100%");
            this.makeItLayer(this.ContentLayer, "0px", "0px");
            this.ContentLayer.style.pointerEvents = "none";

            this.RootElement.appendChild(this.EventMapLayer);
            this.RootElement.appendChild(this.ContentLayer);

            // End of DOM creation
            this.HiddenNodeBuffer = document.createDocumentFragment();

            this.Viewport = new VisModelJS.ViewportManager(this);
            this.LayoutEngine = new VisModelJS.VerticalTreeLayoutEngine();

            this.Viewport.addEventListener("cameramove", function () {
                _this.UpdateHiddenNodeList();
            });

            var clickEventIsHandledInViewport = false;
            var focused = false;
            document.addEventListener("click", function (event) {
                clickEventIsHandledInViewport = false;
                setTimeout(function () {
                    if (focused && !clickEventIsHandledInViewport) {
                        focused = false;
                    } else if (!focused && clickEventIsHandledInViewport) {
                        focused = true;
                    }
                }, 0);
            }, true);

            this.RootElement.addEventListener("click", function (event) {
                var Label = VisModelJS.Utils.getNodeLabelFromEvent(event);
                if (_this.IsActive()) {
                    _this.ChangeFocusedLabel(Label);
                }
                clickEventIsHandledInViewport = true;
                event.preventDefault();
                event.stopPropagation();
            });

            this.ContentLayer.addEventListener("dblclick", function (event) {
                var Label = VisModelJS.Utils.getNodeLabelFromEvent(event);
                if (Label) {
                    var node = _this.ViewMap[Label];
                    var nodeevent = new NodeViewEvent();
                    nodeevent.type = "dblclick";
                    nodeevent.target = _this;
                    nodeevent.node = node;
                    _this.dispatchEvent(nodeevent);
                    event.stopPropagation();
                    event.preventDefault();
                }
            });

            document.addEventListener("keydown", function (Event) {
                if (focused) {
                    _this.OnKeyDown(Event);
                }
            }, true);

            var DragHandler = function (e) {
                e.stopPropagation();
                e.preventDefault();
            };

            this.ActiveFlag = true;
        }
        VisualModelPanel.prototype.makeItLayer = function (element, width, height) {
            var style = element.style;
            style.position = "absolute";
            style.width = width;
            style.height = height;
            style.top = "0px";
            style.left = "0px";
        };

        VisualModelPanel.prototype.IsActive = function () {
            return this.ActiveFlag;
        };

        VisualModelPanel.prototype.OnKeyDown = function (Event) {
            var Label;
            var handled = true;
            switch (Event.keyCode) {
                case 27:
                    Event.preventDefault();
                    break;
                case 13:
                    Event.preventDefault();
                    break;
                case 72:
                case 37:
                    this.NavigateLeft();
                    Event.preventDefault();
                    break;
                case 74:
                case 40:
                    this.NavigateDown();
                    Event.preventDefault();
                    break;
                case 75:
                case 38:
                    var Moved = this.NavigateUp();
                    if (!Moved && this.FocusedLabel) {
                        this.NavigateParent();
                    }
                    Event.preventDefault();
                    break;
                case 76:
                case 39:
                    this.NavigateRight();
                    Event.preventDefault();
                    break;
                case 36:
                    this.NavigateHome();
                    Event.preventDefault();
                    break;
                case 187:
                    if (Event.shiftKey) {
                        this.Viewport.camera.scale += 0.1;
                    }
                    Event.preventDefault();
                    break;
                case 189:
                    if (Event.shiftKey) {
                        this.Viewport.camera.scale -= 0.1;
                    }
                    Event.preventDefault();
                    break;
                default:
                    handled = false;
                    break;
            }
            //if (handled) {
            //    Event.stopPropagation();
            //}
        };

        VisualModelPanel.prototype.OnActivate = function () {
            this.Viewport.isPointerEnabled = true;
        };

        VisualModelPanel.prototype.OnDeactivate = function () {
            this.Viewport.isPointerEnabled = false;
        };

        /**
        @method MoveToNearestNode
        @param {AssureNote.Direction} Dir
        */
        VisualModelPanel.prototype.MoveToNearestNode = function (Dir) {
            var NextNode = this.FindNearestNode(this.ViewMap[this.FocusedLabel], Dir);
            if (NextNode) {
                this.FocusAndMoveToNode(NextNode);
            }
            return !!NextNode;
        };

        VisualModelPanel.prototype.FocusAndMoveToNode = function (Node) {
            if (Node != null) {
                var NextNode = Node.constructor == String ? this.ViewMap[Node] : Node;
                if (NextNode != null) {
                    this.ChangeFocusedLabel(NextNode.label);
                    this.Viewport.camera.moveTo(NextNode.centerGx, NextNode.centerGy, this.Viewport.camera.scale, 50);
                }
            }
        };

        /**
        @method FindNearestNode
        @param {AssureNote.NodeView} CenterNode. If null is given, Camera position is used instead of the node.
        @param {AssureNote.Direction} Dir
        @return {AssureNote.NodeView} Found node. If no node is found, null is retured.
        */
        VisualModelPanel.prototype.FindNearestNode = function (CenterNode, Dir) {
            var RightLimitVectorX = 1;
            var RightLimitVectorY = 1;
            var LeftLimitVectorX = 1;
            var LeftLimitVectorY = 1;

            switch (Dir) {
                case 2 /* Right */:
                    LeftLimitVectorY = -1;
                    break;
                case 0 /* Left */:
                    RightLimitVectorX = -1;
                    RightLimitVectorY = -1;
                    LeftLimitVectorX = -1;
                    break;
                case 1 /* Top */:
                    RightLimitVectorY = -1;
                    LeftLimitVectorX = -1;
                    LeftLimitVectorY = -1;
                    break;
                case 3 /* Bottom */:
                    RightLimitVectorX = -1;
                    break;
            }
            var NearestNode = null;
            var CurrentMinimumDistanceSquere = Infinity;
            var CX = CenterNode ? CenterNode.centerGx : this.Viewport.camera.gx;
            var CY = CenterNode ? CenterNode.centerGy : this.Viewport.camera.gy;
            this.TopNodeView.traverseVisibleNode(function (Node) {
                var DX = Node.centerGx - CX;
                var DY = Node.centerGy - CY;
                var DDotR = DX * RightLimitVectorX + DY * RightLimitVectorY;
                var DDotL = DX * LeftLimitVectorX + DY * LeftLimitVectorY;
                if (DDotR > 0 && DDotL > 0) {
                    var DistanceSquere = DX * DX + DY * DY;
                    if (DistanceSquere < CurrentMinimumDistanceSquere) {
                        CurrentMinimumDistanceSquere = DistanceSquere;
                        NearestNode = Node;
                    }
                }
            });
            return NearestNode;
        };

        /**
        @method ChangeFocusedLabel
        @param {string} Label If label is null, there is no focused label.
        */
        VisualModelPanel.prototype.ChangeFocusedLabel = function (Label) {
            //Utils.UpdateHash(Label);
            if (Label == null) {
                var oldNodeView = this.ViewMap[this.FocusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.shape.removeColorStyle(VisModelJS.ColorStyle.Highlight);
                }
                this.FocusedLabel = null;
                return;
            }
            var nodeview = this.ViewMap[Label];
            if (nodeview != null) {
                var oldNodeView = this.ViewMap[this.FocusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.shape.removeColorStyle(VisModelJS.ColorStyle.Highlight);
                }
                this.FocusedLabel = Label;
                nodeview.shape.addColorStyle(VisModelJS.ColorStyle.Highlight);
            }
        };

        VisualModelPanel.prototype.GetFocusedLabel = function () {
            return this.FocusedLabel;
        };

        VisualModelPanel.prototype.InitializeView = function (NodeView) {
            this.TopNodeView = NodeView;
            this.ViewMap = {};
            this.TopNodeView.UpdateViewMap(this.ViewMap);
        };

        VisualModelPanel.prototype.Draw = function (Label, Duration, FixedNode) {
            var _this = this;
            var t0 = VisModelJS.Utils.getTime();
            this.Clear();
            var t1 = VisModelJS.Utils.getTime();

            //console.log("Clear: " + (t1 - t0));
            var TargetView = this.ViewMap[Label];

            if (TargetView == null) {
                TargetView = this.TopNodeView;
            }

            var FixedNodeGX0;
            var FixedNodeGY0;
            var FixedNodeDX;
            var FixedNodeDY;
            if (FixedNode) {
                FixedNodeGX0 = FixedNode.gx;
                FixedNodeGY0 = FixedNode.gy;
            }

            this.LayoutEngine.DoLayout(this, TargetView);

            this.ContentLayer.style.display = "none";
            this.SVGLayer.style.display = "none";

            //GSNShape.__Debug_Animation_SkippedNodeCount = 0;
            //GSNShape.__Debug_Animation_TotalNodeCount = 0;
            this.FoldingAnimationTask.cancel(true);

            VisModelJS.TreeNodeView.setGlobalPositionCacheEnabled(true);
            var FoldingAnimationCallbacks = [];

            var PageRect = this.Viewport.pageRectInGxGy;
            if (FixedNode) {
                FixedNodeDX = FixedNode.gx - FixedNodeGX0;
                FixedNodeDY = FixedNode.gy - FixedNodeGY0;
                if (FixedNodeDX > 0) {
                    PageRect.width += FixedNodeDX;
                } else {
                    PageRect.width -= FixedNodeDX;
                    PageRect.x += FixedNodeDX;
                }
                var Scale = this.Viewport.camera.scale;
                var Task = this.Viewport.createMoveTaskFunction(FixedNodeDX, FixedNodeDY, Scale, Duration);
                if (Task) {
                    FoldingAnimationCallbacks.push(Task);
                } else {
                    FoldingAnimationCallbacks.push(function () {
                        _this.UpdateHiddenNodeList();
                    });
                }
            } else {
                FoldingAnimationCallbacks.push(function () {
                    _this.UpdateHiddenNodeList();
                });
            }

            var t2 = VisModelJS.Utils.getTime();
            TargetView.updateNodePosition(FoldingAnimationCallbacks, Duration, PageRect);
            TargetView.clearAnimationCache();
            var t3 = VisModelJS.Utils.getTime();

            //console.log("Update: " + (t3 - t2));
            this.FoldingAnimationTask.startMany(Duration, FoldingAnimationCallbacks);

            var Shape = TargetView.shape;
            this.Viewport.camera.limitRect = new VisModelJS.Rect(Shape.GetTreeLeftLocalX() - 100, -100, Shape.GetTreeWidth() + 200, Shape.GetTreeHeight() + 200);

            this.TopNodeView.traverseVisibleNode(function (Node) {
                if (Node.isInRect(PageRect)) {
                    _this.OnScreenNodeMap[Node.label] = Node;
                } else {
                    _this.HiddenNodeMap[Node.label] = Node;
                    _this.HiddenNodeBuffer.appendChild(Node.shape.Content);
                    _this.HiddenNodeBuffer.appendChild(Node.shape.ShapeGroup);
                }
            });

            VisModelJS.TreeNodeView.setGlobalPositionCacheEnabled(false);
            this.ContentLayer.style.display = "";
            this.SVGLayer.style.display = "";
            //console.log("Animation: " + GSNShape.__Debug_Animation_TotalNodeCount + " nodes moved, " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount + " nodes skipped. reduce rate = " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount / GSNShape.__Debug_Animation_TotalNodeCount);
        };

        VisualModelPanel.prototype.ForceAppendAllOutOfScreenNode = function () {
            var _this = this;
            var UpdateArrow = function (Node) {
                if (Node.parent) {
                    var Arrow = Node.shape.ArrowPath;
                    if (Arrow.parentNode != _this.HiddenNodeBuffer) {
                        _this.HiddenNodeBuffer.appendChild(Arrow);
                    }
                }
            };
            for (var Label in this.HiddenNodeMap) {
                var Node = this.HiddenNodeMap[Label];
                delete this.HiddenNodeMap[Label];
                this.OnScreenNodeMap[Label] = Node;
                this.ContentLayer.appendChild(Node.shape.Content);
                this.SVGLayerNodeGroup.appendChild(Node.shape.ShapeGroup);
                UpdateArrow(Node);
            }
        };

        VisualModelPanel.prototype.UpdateHiddenNodeList = function () {
            var _this = this;
            VisModelJS.TreeNodeView.setGlobalPositionCacheEnabled(true);
            var PageRect = this.Viewport.pageRectInGxGy;
            var UpdateArrow = function (Node) {
                if (Node.parent) {
                    var Arrow = Node.shape.ArrowPath;
                    if (Node.isConnectorInRect(PageRect)) {
                        if (Arrow.parentNode != _this.SVGLayerConnectorGroup) {
                            _this.SVGLayerConnectorGroup.appendChild(Arrow);
                        }
                    } else {
                        if (Arrow.parentNode != _this.HiddenNodeBuffer) {
                            _this.HiddenNodeBuffer.appendChild(Arrow);
                        }
                    }
                }
            };
            for (var Label in this.OnScreenNodeMap) {
                var Node = this.OnScreenNodeMap[Label];
                if (!Node.isInRect(PageRect)) {
                    delete this.OnScreenNodeMap[Label];
                    this.HiddenNodeMap[Label] = Node;
                    this.HiddenNodeBuffer.appendChild(Node.shape.Content);
                    this.HiddenNodeBuffer.appendChild(Node.shape.ShapeGroup);
                }
                UpdateArrow(Node);
            }
            for (var Label in this.HiddenNodeMap) {
                var Node = this.HiddenNodeMap[Label];
                if (Node.isInRect(PageRect)) {
                    delete this.HiddenNodeMap[Label];
                    this.OnScreenNodeMap[Label] = Node;
                    this.ContentLayer.appendChild(Node.shape.Content);
                    this.SVGLayerNodeGroup.appendChild(Node.shape.ShapeGroup);
                }
                UpdateArrow(Node);
            }
            VisModelJS.TreeNodeView.setGlobalPositionCacheEnabled(false);
            ////console.log("Visible:Hidden = " + Object.keys(this.OnScreenNodeMap).length + ":" + Object.keys(this.HiddenNodeMap).length);
        };

        VisualModelPanel.prototype.Clear = function () {
            this.RootElement.style.display = "none";
            this.ContentLayer.innerHTML = "";
            this.SVGLayer.removeChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.removeChild(this.SVGLayerNodeGroup);
            this.SVGLayerConnectorGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayer.appendChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.appendChild(this.SVGLayerNodeGroup);
            this.HiddenNodeMap = {};
            this.OnScreenNodeMap = {};
            this.HiddenNodeBuffer = document.createDocumentFragment();
            this.RootElement.style.display = "";
        };

        VisualModelPanel.prototype.GetFocusedView = function () {
            if (this.ViewMap) {
                return this.ViewMap[this.FocusedLabel];
            }
            return null;
        };

        VisualModelPanel.prototype.NavigateUp = function () {
            return this.MoveToNearestNode(1 /* Top */);
        };
        VisualModelPanel.prototype.NavigateDown = function () {
            return this.MoveToNearestNode(3 /* Bottom */);
        };
        VisualModelPanel.prototype.NavigateLeft = function () {
            return this.MoveToNearestNode(0 /* Left */);
        };
        VisualModelPanel.prototype.NavigateRight = function () {
            return this.MoveToNearestNode(2 /* Right */);
        };
        VisualModelPanel.prototype.NavigateHome = function () {
            this.FocusAndMoveToNode(this.TopNodeView);
        };
        VisualModelPanel.prototype.NavigateParent = function () {
            if (this.FocusedLabel) {
                var Parent = this.ViewMap[this.FocusedLabel].parent;
                if (Parent) {
                    this.FocusAndMoveToNode(this.ViewMap[this.FocusedLabel].parent);
                    return;
                }
            }
            this.FocusAndMoveToNode(this.TopNodeView);
        };
        return VisualModelPanel;
    })(VisModelJS.EventTarget);
    VisModelJS.VisualModelPanel = VisualModelPanel;
})(VisModelJS || (VisModelJS = {}));
//# sourceMappingURL=VisualModelPanel.js.map
