var VisModelJS;
(function (VisModelJS) {
    var TreeNodeView = (function () {
        function TreeNodeView() {
            this.relativeX = 0;
            this.relativeY = 0;
            this.leftNodes = null;
            this.rightNodes = null;
            this.childNodes = null;
            this._shape = null;
            this._shouldReLayout = true;
            this.visible = true;
            this._folded = false;
        }
        Object.defineProperty(TreeNodeView.prototype, "folded", {
            get: function () {
                return this._folded;
            },
            set: function (value) {
                if (this._folded != value) {
                    this.shouldReLayout = true;
                }
                this._folded = value;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(TreeNodeView.prototype, "shouldReLayout", {
            get: function () {
                return this._shouldReLayout;
            },
            set: function (value) {
                if (!this._shouldReLayout && value && this.parent) {
                    this.parent.shouldReLayout = true;
                }
                this._shouldReLayout = value;
            },
            enumerable: true,
            configurable: true
        });

        //FixMe
        TreeNodeView.prototype.UpdateViewMap = function (viewMap) {
            viewMap[this.label] = this;
            if (this.leftNodes != null) {
                for (var i = 0; i < this.leftNodes.length; i++) {
                    this.leftNodes[i].UpdateViewMap(viewMap);
                }
            }
            if (this.rightNodes != null) {
                for (var i = 0; i < this.rightNodes.length; i++) {
                    this.rightNodes[i].UpdateViewMap(viewMap);
                }
            }
            if (this.childNodes != null) {
                for (var i = 0; i < this.childNodes.length; i++) {
                    this.childNodes[i].UpdateViewMap(viewMap);
                }
            }
        };

        TreeNodeView.prototype.appendChild = function (node) {
            if (this.childNodes == null) {
                this.childNodes = [];
            }
            this.childNodes.push(node);
            node.parent = this;
        };

        TreeNodeView.prototype.appendLeftNode = function (node) {
            if (this.leftNodes == null) {
                this.leftNodes = [];
            }
            this.leftNodes.push(node);
            node.parent = this;
        };

        TreeNodeView.prototype.appendRightNode = function (node) {
            if (this.rightNodes == null) {
                this.rightNodes = [];
            }
            this.rightNodes.push(node);
            node.parent = this;
        };

        Object.defineProperty(TreeNodeView.prototype, "shape", {
            get: function () {
                if (this._shape == null) {
                    this._shape = VisModelJS.ShapeFactory.CreateShape(this);
                }
                return this._shape;
            },
            set: function (value) {
                if (this._shape) {
                    this._shape.NodeView = null;
                }
                if (value) {
                    value.NodeView = this;
                }
                this._shape = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(TreeNodeView.prototype, "gx", {
            /**
            Global X: Scale-independent and transform-independent X distance from leftside of the top goal.
            @return always 0 if this is top goal.
            */
            get: function () {
                if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                    return TreeNodeView.globalPositionCache[this.label].x;
                }
                if (this.parent == null) {
                    return this.relativeX;
                }
                return this.parent.gx + this.relativeX;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(TreeNodeView.prototype, "gy", {
            /**
            Global Y: Scale-independent and transform-independent Y distance from top of the top goal.
            @eturn always 0 if this is top goal.
            */
            get: function () {
                if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                    return TreeNodeView.globalPositionCache[this.label].y;
                }
                if (this.parent == null) {
                    return this.relativeY;
                }
                return this.parent.gy + this.relativeY;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(TreeNodeView.prototype, "centerGx", {
            // Global center X/Y: Node center position
            get: function () {
                return this.gx + this._shape.GetNodeWidth() * 0.5;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(TreeNodeView.prototype, "centerGy", {
            get: function () {
                return this.gy + this._shape.GetNodeHeight() * 0.5;
            },
            enumerable: true,
            configurable: true
        });

        TreeNodeView.setGlobalPositionCacheEnabled = function (State) {
            if (State && TreeNodeView.globalPositionCache == null) {
                TreeNodeView.globalPositionCache = {};
            } else if (!State) {
                TreeNodeView.globalPositionCache = null;
            }
        };

        Object.defineProperty(TreeNodeView.prototype, "globalPosition", {
            /**
            Scale-independent and transform-independent distance from leftside of GSN.
            @return always (0, 0) if this is top goal.
            */
            get: function () {
                if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                    return TreeNodeView.globalPositionCache[this.label].clone();
                }
                if (this.parent == null) {
                    return new VisModelJS.Point(this.relativeX, this.relativeY);
                }
                var parentPos = this.parent.globalPosition;
                parentPos.x += this.relativeX;
                parentPos.y += this.relativeY;
                if (TreeNodeView.globalPositionCache != null) {
                    TreeNodeView.globalPositionCache[this.label] = parentPos.clone();
                }
                return parentPos;
            },
            enumerable: true,
            configurable: true
        });

        /**
        Append content elements of this node to layer fragments.
        */
        TreeNodeView.prototype.render = function (htmlLayerFlagment, svgLayerFlagment, svgConnectorFlagment) {
            this._shape.Render(htmlLayerFlagment, svgLayerFlagment, svgConnectorFlagment);
        };

        /**
        Try to reuse shape.
        */
        TreeNodeView.prototype.copyFlagsFromOldView = function (oldView) {
            if (oldView) {
                this._folded = oldView._folded;

                var isContentChanged = this.content != oldView.content;

                if (isContentChanged) {
                    this.shape.setColorStyle(oldView.shape.getColorStyle());
                } else {
                    this.shape = oldView.shape;
                }
            }
        };

        TreeNodeView.prototype.getConnectorPosition = function (dir, globalPosition) {
            var P = this._shape.GetConnectorPosition(dir);
            P.x += globalPosition.x;
            P.y += globalPosition.y;
            return P;
        };

        /**
        Update DOM node position by the position that layout engine caluculated
        */
        TreeNodeView.prototype.updateNodePosition = function (animationCallbacks, duration, screenRect, unfoldBaseNode) {
            var _this = this;
            duration = duration || 0;
            if (!this.visible) {
                return;
            }
            var updateSubNode = function (SubNode) {
                var base = unfoldBaseNode;
                if (!base && SubNode._shape.WillFadein()) {
                    base = _this;
                }
                if (base && duration > 0) {
                    SubNode._shape.SetFadeinBasePosition(base._shape.GetGXCache(), base._shape.GetGYCache());
                    SubNode.updateNodePosition(animationCallbacks, duration, screenRect, base);
                } else {
                    SubNode.updateNodePosition(animationCallbacks, duration, screenRect);
                }
            };

            var gp = this.globalPosition;
            this._shape.MoveTo(animationCallbacks, gp.x, gp.y, duration, screenRect);

            var directions = [3 /* Bottom */, 2 /* Right */, 0 /* Left */];
            var subNodeTypes = [this.childNodes, this.rightNodes, this.leftNodes];
            for (var i = 0; i < 3; ++i) {
                var p1 = this.getConnectorPosition(directions[i], gp);
                var arrowGoalDirection = VisModelJS.reverseDirection(directions[i]);
                this.forEachVisibleSubNode(subNodeTypes[i], function (SubNode) {
                    var p2 = SubNode.getConnectorPosition(arrowGoalDirection, SubNode.globalPosition);
                    updateSubNode(SubNode);
                    SubNode._shape.MoveArrowTo(animationCallbacks, p1, p2, directions[i], duration, screenRect);
                    SubNode.parentDirection = VisModelJS.reverseDirection(directions[i]);
                });
            }
        };

        TreeNodeView.prototype.forEachVisibleSubNode = function (subNodes, action) {
            if (subNodes != null && !this._folded) {
                for (var i = 0; i < subNodes.length; i++) {
                    if (subNodes[i].visible) {
                        if (action(subNodes[i]) === false) {
                            return false;
                        }
                    }
                }
            }
            return true;
        };

        TreeNodeView.prototype.forEachVisibleChildren = function (action) {
            this.forEachVisibleSubNode(this.childNodes, action);
        };

        TreeNodeView.prototype.forEachVisibleRightNodes = function (action) {
            this.forEachVisibleSubNode(this.rightNodes, action);
        };

        TreeNodeView.prototype.forEachVisibleLeftNodes = function (action) {
            this.forEachVisibleSubNode(this.leftNodes, action);
        };

        TreeNodeView.prototype.forEachVisibleAllSubNodes = function (action) {
            if (this.forEachVisibleSubNode(this.leftNodes, action) && this.forEachVisibleSubNode(this.rightNodes, action) && this.forEachVisibleSubNode(this.childNodes, action))
                return true;
            return false;
        };

        TreeNodeView.prototype.traverseVisibleNode = function (action) {
            action(this);
            this.forEachVisibleAllSubNodes(function (subNode) {
                subNode.traverseVisibleNode(action);
            });
        };

        TreeNodeView.prototype.forEachSubNode = function (subNodes, action) {
            if (subNodes != null) {
                for (var i = 0; i < subNodes.length; i++) {
                    if (action(subNodes[i]) === false) {
                        return false;
                    }
                }
            }
            return true;
        };

        TreeNodeView.prototype.forEachAllSubNodes = function (action) {
            if (this.forEachSubNode(this.leftNodes, action) && this.forEachSubNode(this.rightNodes, action) && this.forEachSubNode(this.childNodes, action))
                return true;
            return false;
        };

        TreeNodeView.prototype.traverseNode = function (action) {
            if (action(this) === false)
                return false;
            if (this.forEachAllSubNodes(function (subNode) {
                return subNode.traverseNode(action);
            }))
                return true;
            return false;
        };

        /**
        Clear position cache and enable to fading in when the node re-appearing.
        This method should be called after the node became invibible or the node never fade in.
        */
        TreeNodeView.prototype.clearAnimationCache = function (force) {
            if (force || !this.visible) {
                this.shape.ClearAnimationCache();
            }
            if (force || this._folded) {
                this.forEachAllSubNodes(function (SubNode) {
                    SubNode.clearAnimationCache(true);
                });
            } else {
                this.forEachAllSubNodes(function (SubNode) {
                    SubNode.clearAnimationCache(false);
                });
            }
        };

        Object.defineProperty(TreeNodeView.prototype, "hasSideNode", {
            get: function () {
                return (this.leftNodes != null && this.leftNodes.length > 0) || (this.rightNodes != null && this.rightNodes.length > 0);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(TreeNodeView.prototype, "hasChildren", {
            get: function () {
                return (this.childNodes != null && this.childNodes.length > 0);
            },
            enumerable: true,
            configurable: true
        });

        TreeNodeView.prototype.isInRect = function (target) {
            // While animation playing, cached position(visible position) != this.position(logical position)
            var gxCached = this._shape.GetGXCache();
            var gyCached = this._shape.GetGYCache();
            var pos;
            if (gxCached != null && gyCached != null) {
                pos = new VisModelJS.Point(gxCached, gyCached);
            } else {
                pos = this.globalPosition;
            }
            if (pos.x > target.x + target.width || pos.y > target.y + target.height) {
                return false;
            }
            pos.x += this._shape.GetNodeWidth();
            pos.y += this._shape.GetNodeHeight();
            if (pos.x < target.x || pos.y < target.y) {
                return false;
            }
            return true;
        };

        TreeNodeView.prototype.isConnectorInRect = function (target) {
            if (!this.parent) {
                return false;
            }
            var pa;
            var pb;
            if (this._shape.GetGXCache() != null && this._shape.GetGYCache() != null) {
                pa = this._shape.GetArrowP1Cache();
                pb = this._shape.GetArrowP2Cache();
            } else {
                pa = this.getConnectorPosition(this.parentDirection, this.globalPosition);
                pb = this.parent.getConnectorPosition(VisModelJS.reverseDirection(this.parentDirection), this.parent.globalPosition);
            }
            var pos = new VisModelJS.Point(Math.min(pa.x, pb.x), Math.min(pa.y, pb.y));
            if (pos.x > target.x + target.width || pos.y > target.y + target.height) {
                return false;
            }
            pos.x = Math.max(pa.x, pb.x);
            pos.y = Math.max(pa.y, pb.y);
            if (pos.x < target.x || pos.y < target.y) {
                return false;
            }
            return true;
        };

        /**
        @method FoldDeepSubGoals
        @param {NodeView} NodeView
        */
        TreeNodeView.prototype.foldDeepSubGoals = function (limitDepth) {
            if (limitDepth <= 0) {
                this.folded = true;
            } else {
                this.forEachVisibleChildren(function (SubNode) {
                    return SubNode.foldDeepSubGoals(limitDepth - 1);
                });
            }
        };
        TreeNodeView.globalPositionCache = null;
        return TreeNodeView;
    })();
    VisModelJS.TreeNodeView = TreeNodeView;
})(VisModelJS || (VisModelJS = {}));
//# sourceMappingURL=NodeView.js.map
