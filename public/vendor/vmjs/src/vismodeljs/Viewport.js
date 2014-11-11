var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var VisModelJS;
(function (VisModelJS) {
    var Pointer = (function () {
        function Pointer(x, y, id) {
            this.x = x;
            this.y = y;
            this.id = id;
        }
        Pointer.prototype.setPosition = function (x, y) {
            this.x = x;
            this.y = y;
        };
        return Pointer;
    })();
    VisModelJS.Pointer = Pointer;

    /**
    Controll scroll by mouse, touch and pen and zoom by wheel.
    @class VisModelJS.ScrollManager
    @for VisModelJS.ViewportManager
    */
    var ScrollManager = (function () {
        function ScrollManager() {
            this.currentX = 0;
            this.currentY = 0;
            this.dx = 0;
            this.dy = 0;
            this.mainPointerID = null;
            this.pointers = [];
            this.timer = 0;
            this.ANIMATE_THRESHOLD = 5;
            this.SPEED_MAX = 100;
            this.onDragged = function (dx, dy) {
            };
        }
        ScrollManager.prototype.startDrag = function (initialX, initialY) {
            this.currentX = initialX;
            this.currentY = initialY;
        };

        ScrollManager.prototype.updateDrag = function (currentX, currentY) {
            this.dx = currentX - this.currentX;
            this.dy = currentY - this.currentY;
            var speed = this.dx * this.dx + this.dy + this.dy;
            if (speed > this.SPEED_MAX * this.SPEED_MAX) {
                this.dx *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
                this.dy *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
            }

            this.currentX = currentX;
            this.currentY = currentY;
        };

        ScrollManager.prototype.getMainPointer = function () {
            return this.pointers[this.mainPointerID];
        };

        ScrollManager.prototype.isDragging = function () {
            return this.mainPointerID != null;
        };

        ScrollManager.prototype.stopAnimation = function () {
            clearInterval(this.timer);
            this.dx = 0;
            this.dy = 0;
        };

        ScrollManager.prototype.endDrag = function () {
            this.mainPointerID = null;
        };

        ScrollManager.prototype.onPointerEvent = function (e, viewport) {
            var _this = this;
            switch (e.type) {
                case "trackstart":
                    if (!this.pointers[e.pointerId]) {
                        this.pointers[e.pointerId] = new Pointer(e.clientX, e.clientY, e.pointerId);
                        e.preventDefault();
                        e.stopPropagation();
                        //Log(e);
                    }
                    break;
                case "trackend":
                    if (!this.pointers[e.pointerId]) {
                        return;
                    }
                    delete this.pointers[e.pointerId];
                    e.preventDefault();
                    e.stopPropagation();

                    break;
                case "track":
                    if (!this.pointers[e.pointerId]) {
                        return;
                    }
                    this.pointers[e.pointerId].setPosition(e.clientX, e.clientY);
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                default:
                    return;
            }

            var isTherePointer = Object.keys(this.pointers).length > 0;
            var hasDragJustStarted = isTherePointer && !this.isDragging();
            var hasDragJustEnded = !this.getMainPointer() && this.isDragging();

            if (isTherePointer) {
                if (hasDragJustStarted) {
                    this.stopAnimation();
                    this.timer = null;
                    var mainPointer = this.pointers[Object.keys(this.pointers)[0]];
                    this.mainPointerID = mainPointer.id;
                    this.startDrag(mainPointer.x, mainPointer.y);
                } else {
                    var mainPointer = this.getMainPointer();
                    if (mainPointer) {
                        this.updateDrag(mainPointer.x, mainPointer.y);
                        this.onDragged(this.dx, this.dy);
                    } else {
                        this.endDrag();
                    }
                }
            } else {
                if (hasDragJustEnded) {
                    if (this.timer) {
                        this.stopAnimation();
                        this.timer = null;
                    }
                    this.timer = setInterval(function () {
                        if (Math.abs(_this.dx) < _this.ANIMATE_THRESHOLD && Math.abs(_this.dy) < _this.ANIMATE_THRESHOLD) {
                            _this.stopAnimation();
                        }
                        _this.currentX += _this.dx;
                        _this.currentY += _this.dy;
                        _this.dx *= 0.95;
                        _this.dy *= 0.95;
                        _this.onDragged(_this.dx, _this.dy);
                    }, 16);
                }
                this.endDrag();
            }
        };

        ScrollManager.prototype.onMouseWheel = function (e, screen) {
            screen.camera.scale *= 1 + e.deltaY * 0.02;
        };
        return ScrollManager;
    })();
    VisModelJS.ScrollManager = ScrollManager;

    /**
    @class VisModelJS.ViewportManager
    */
    var ViewportManager = (function (_super) {
        __extends(ViewportManager, _super);
        function ViewportManager(panel) {
            var _this = this;
            _super.call(this);
            this.panel = panel;
            this.scrollManager = new ScrollManager();
            this.cameraGx = 0;
            this.cameraGy = 0;
            this.scale = 1.0;
            this.isPointerEnabled = true;
            this.cameraMoveTask = new VisModelJS.AnimationFrameTask();

            var _viewport = this;
            var __camera = {
                get gx() {
                    return _viewport.cameraGx;
                },
                set gx(value) {
                    var camera = this;
                    camera.setPosition(value, _viewport.cameraGy);
                },
                get gy() {
                    return _viewport.cameraGy;
                },
                set gy(value) {
                    var camera = this;
                    camera.setPosition(_viewport.cameraGx, value);
                },
                get scale() {
                    return _viewport.scale;
                },
                set scale(value) {
                    var camera = this;
                    _viewport.scale = value < camera.minScale ? camera.minScale : value > camera.maxScale ? camera.maxScale : value;
                    _viewport.updateAttr();
                },
                setPosition: function (gx, gy) {
                    this.setOffset(_viewport.cameraCenterPageX - gx * _viewport.scale, _viewport.cameraCenterPageY - gy * _viewport.scale);
                },
                setPositionAndScale: function (gx, gy, scale) {
                    _viewport.scale = scale;
                    this.setOffset(_viewport.cameraCenterPageX - gx * _viewport.scale, _viewport.cameraCenterPageY - gy * _viewport.scale);
                },
                get centerPageX() {
                    return _viewport.cameraCenterPageX;
                },
                set centerPageX(value) {
                    _viewport.cameraCenterPageX = value;
                },
                get centerPageY() {
                    return _viewport.cameraCenterPageY;
                },
                set centerPageY(value) {
                    _viewport.cameraCenterPageY = value;
                },
                setCenterPagePosition: function (pageX, pageY) {
                    _viewport.cameraCenterPageX = pageX;
                    _viewport.cameraCenterPageY = pageY;
                },
                limitRect: null,
                /**
                Move camera position relatively and change scale.
                @method Move
                @param {number} GX Scale-independent camera relative X difference.
                @param {number} GY Scale-independent camera relative Y difference.
                @param {number} Scale Scale of camera. 1.0 for 100%.
                @param {number} Duration Time for moving in millisecond.
                @async
                */
                move: function (gx, gy, scale, duration) {
                    this.moveTo(_viewport.cameraGx + gx, _viewport.cameraGy + gy, scale, duration);
                },
                /**
                Move camera position and scale one time.
                @method MoveTo
                @param {number} GX Scale-independent camera X position in GSN. 0 for leftside of topgoal.
                @param {number} GY Scale-independent camera Y position in GSN. 0 for top of topgoal.
                @param {number} Scale Scale of camera. 1.0 for 100%.
                @param {number} Duration Time for moving in millisecond.
                @async
                */
                moveTo: function (gx, gy, scale, duration) {
                    var Task = _viewport.createMoveToTaskFunction(gx, gy, scale, duration);
                    if (!Task) {
                        this.setPositionAndScale(gx, gy, scale);
                        return;
                    }
                    this.cameraMoveTask.start(duration, Task);
                },
                // private
                setOffset: function (pageX, pageY) {
                    _viewport.cameraGx = (_viewport.cameraCenterPageX - pageX) / _viewport.scale;
                    _viewport.cameraGy = (_viewport.cameraCenterPageY - pageY) / _viewport.scale;
                    this.limitPosition();
                    _viewport.updateAttr();
                },
                maxScale: 2.0,
                minScale: 0.2,
                limitPosition: function () {
                    var R = this.limitRect;
                    if (R) {
                        if (_viewport.cameraGx < R.x)
                            _viewport.cameraGx = R.x;
                        if (_viewport.cameraGy < R.y)
                            _viewport.cameraGy = R.y;
                        if (_viewport.cameraGx > R.x + R.width)
                            _viewport.cameraGx = R.x + R.width;
                        if (_viewport.cameraGy > R.y + R.height)
                            _viewport.cameraGy = R.y + R.height;
                    }
                },
                addOffset: function (pageX, pageY) {
                    _viewport.cameraGx -= pageX / _viewport.scale;
                    _viewport.cameraGy -= pageY / _viewport.scale;
                    this.limitPosition();
                    _viewport.updateAttr();
                },
                cameraMoveTask: new VisModelJS.AnimationFrameTask()
            };
            this._camera = __camera;

            this.scrollManager.onDragged = __camera.addOffset.bind(__camera);

            window.addEventListener("resize", function (e) {
                _this.updatePageRect();
            });
            this.updatePageSize();
            this.updatePageRect();
            this._camera.setCenterPagePosition(this.areaCenterX, this.areaCenterY);
            VisModelJS.Utils.setTransformOriginToElement(this.panel.ContentLayer, "left top");
            this.updateAttr();
            var onPointer = function (e) {
                if (_this.isPointerEnabled) {
                    _this.scrollManager.onPointerEvent(e, _this);
                }
            };

            ["trackstart", "trackend", "track"].forEach(function (name) {
                PolymerGestures.addEventListener(_this.panel.RootElement, name, onPointer);
            });

            var OnWheel = function (e) {
                if (_this.isPointerEnabled) {
                    e.preventDefault();
                    _this.scrollManager.onMouseWheel(e, _this);
                }
            };
            this.panel.RootElement.addEventListener('wheel', OnWheel);
        }
        Object.defineProperty(ViewportManager.prototype, "camera", {
            get: function () {
                return this._camera;
            },
            enumerable: true,
            configurable: true
        });

        ViewportManager.prototype.limitScale = function (scale) {
            return scale < this.camera.minScale ? this.camera.minScale : scale > this.camera.maxScale ? this.camera.maxScale : scale;
        };

        Object.defineProperty(ViewportManager.prototype, "offsetPageX", {
            get: function () {
                return this.cameraCenterPageX - this.cameraGx * this.scale;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ViewportManager.prototype, "offsetPageY", {
            get: function () {
                return this.cameraCenterPageY - this.cameraGy * this.scale;
            },
            enumerable: true,
            configurable: true
        });

        /**
        Calcurate PageX from GX
        @method PageXFromGX
        @param {number} GX Scale-independent X position in GSN.
        @return {number} PageX for given GX. It is depend on camera's position, scale and vanishing point.
        */
        ViewportManager.prototype.pageXFromGX = function (gx) {
            return this.cameraCenterPageX + (gx - this.cameraGx) * this.scale;
        };

        /**
        Calcurate PageY from GY
        @method PageYFromGY
        @param {number} GY Scale-independent Y position in GSN.
        @return {number} PageY for given GY. It is depend on camera's position, scale and vanishing point.
        */
        ViewportManager.prototype.pageYFromGY = function (gy) {
            return this.cameraCenterPageY + (gy - this.cameraGy) * this.scale;
        };

        /**
        Calcurate GX from PageX
        @method GXFromPageX
        @param {number} PageX X position in web page.
        @return {number} GX for given PageX. It is depend on camera's position, scale and vanishing point.
        */
        ViewportManager.prototype.gxFromPageX = function (pageX) {
            return (pageX - this.cameraCenterPageX) / this.scale + this.cameraGx;
        };

        /**
        Calcurate GY from PageY
        @method GYFromPageY
        @param {number} PageY Y position in web page.
        @return {number} GY for given PageY. It is depend on camera's position, scale and vanishing point.
        */
        ViewportManager.prototype.gyFromPageY = function (pageY) {
            return (pageY - this.cameraCenterPageY) / this.scale + this.cameraGy;
        };

        ViewportManager.prototype.convertRectGlobalXYFromPageXY = function (pageRect) {
            var x1 = this.gxFromPageX(pageRect.x);
            var y1 = this.gyFromPageY(pageRect.y);
            var x2 = this.gxFromPageX(pageRect.x + pageRect.width);
            var y2 = this.gyFromPageY(pageRect.y + pageRect.height);
            return new VisModelJS.Rect(x1, y1, x2 - x1, y2 - y1);
        };

        Object.defineProperty(ViewportManager.prototype, "pageRectInGxGy", {
            get: function () {
                var x1 = this.gxFromPageX(0);
                var y1 = this.gyFromPageY(0);
                var x2 = this.gxFromPageX(this._areaWidth);
                var y2 = this.gyFromPageY(this._areaHeight);
                return new VisModelJS.Rect(x1, y1, x2 - x1, y2 - y1);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ViewportManager.prototype, "areaWidth", {
            get: function () {
                return this._areaWidth;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ViewportManager.prototype, "areaHeight", {
            get: function () {
                return this._areaHeight;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ViewportManager.prototype, "areaCenterX", {
            get: function () {
                return this._areaWidth * 0.5;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ViewportManager.prototype, "areaCenterY", {
            get: function () {
                return this._areaHeight * 0.5;
            },
            enumerable: true,
            configurable: true
        });

        ViewportManager.prototype.moveCamera = function (gx, gy, scale) {
            this.scale += scale;
            this.cameraGx += gx;
            this.cameraGy += gy;
            this.updateAttr();
        };

        ViewportManager.prototype.createMoveTaskFunction = function (gx, gy, scale, duration) {
            return this.createMoveToTaskFunction(this.cameraGx + gx, this.cameraGy + gy, scale, duration);
        };

        ViewportManager.prototype.createMoveToTaskFunction = function (gx, gy, scale, duration) {
            var _this = this;
            scale = this.limitScale(scale);
            if (duration <= 0) {
                return null;
            }

            var VX = (gx - this.cameraGx) / duration;
            var VY = (gy - this.cameraGy) / duration;

            var S0 = this.scale;
            var ScaleRate = scale / S0;
            var DInv = 1 / duration;
            var ScaleFunction = function (t) {
                return S0 * Math.pow(ScaleRate, t * DInv);
            };

            if (VY == 0 && VX == 0 && (scale == S0)) {
                return null;
            }

            return (function (deltaT, currentTime, startTime) {
                var DeltaS = ScaleFunction(currentTime - startTime) - ScaleFunction(currentTime - deltaT - startTime);
                _this.moveCamera(VX * deltaT, VY * deltaT, DeltaS);
            });
        };

        ViewportManager.prototype.updatePageSize = function () {
            var rootRect = this.panel.RootElement.getBoundingClientRect();
            this._areaWidth = rootRect.width;
            this._areaHeight = rootRect.height;
        };

        ViewportManager.prototype.updatePageRect = function () {
            var cameraCenterXRate = this.cameraCenterPageX / this._areaWidth;
            var cameraCenterYRate = this.cameraCenterPageY / this._areaHeight;
            var cameraPX = this.pageXFromGX(this.cameraGx);
            var cameraPY = this.pageYFromGY(this.cameraGy);
            this.updatePageSize();
            this.camera.setCenterPagePosition(this._areaWidth * cameraCenterXRate, this._areaHeight * cameraCenterYRate);
            this.updateAttr();
        };

        ViewportManager.createTranformAttr = function (x, y, scale) {
            return "translate(" + x + " " + y + ") scale(" + scale + ")";
        };

        ViewportManager.createTransformStyle = function (x, y, scale) {
            return "translate(" + x + "px, " + y + "px) scale(" + scale + ") ";
        };

        ViewportManager.prototype.updateAttr = function () {
            var offsetX = this.offsetPageX;
            var offsetY = this.offsetPageY;
            if (!isNaN(offsetX) && !isNaN(offsetY)) {
                var attr = ViewportManager.createTranformAttr(offsetX, offsetY, this.scale);
                var style = ViewportManager.createTransformStyle(offsetX, offsetY, this.scale);
                this.panel.SVGLayer.setAttribute("transform", attr);
                VisModelJS.Utils.setTransformToElement(this.panel.ContentLayer, style);
            }
            var event = new VisModelJS.VisModelEvent();
            event.type = "cameramove";
            event.target = this;
            this.dispatchEvent(event);
        };
        return ViewportManager;
    })(VisModelJS.EventTarget);
    VisModelJS.ViewportManager = ViewportManager;
})(VisModelJS || (VisModelJS = {}));
//# sourceMappingURL=Viewport.js.map
