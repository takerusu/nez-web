/* =============================================================================
	Calendar ver2.0
============================================================================= */
var Calendar = function() {
	/* -----------------------------------------------------
		settings
	----------------------------------------------------- */
	this.settings = {
		viewElement       : null,
		year              : null,
		month             : null,
		headerVisible     : true,
		controllerVisible : true,
		tableClass        : 'calendar',
		prevClass         : 'prev',
		nextClass         : 'next',
		sunClass          : 'sun',
		satClass          : 'sat',
		todayClass        : 'today',
		emptyBlockClass   : 'empty',
		prevText          : '&lt;&lt;',
		nextText          : '&gt;&gt;',
		emptyBlock        : '&nbsp;',
		weekFormat        : ['日', '月', '火', '水', '木', '金', '土'],
		titleFormat       : 'Y年m月'
	};

	/* -----------------------------------------------------
		set data
	----------------------------------------------------- */
	this.data = {
		year  : 0,
		month : 0,
		days  : 0,
		week  : 0,
		full  : 0,
		title : ''
	};

	this.initialize.apply(this, arguments);
	return this;
};

(function() {
	Calendar.prototype = {
		/* -------------------------------------------------
			initialize
		------------------------------------------------- */
		initialize : function(target, settings) {
			this.settings.viewElement = target;
			this.settings = this.extends(this.settings, settings);
			this.set_date();
			return this;
		},

		/* -------------------------------------------------
			set date
		------------------------------------------------- */
		set_date : function() {
			var toDate = new Date();
			this.data.year  = toDate.getFullYear();
			this.data.month = toDate.getMonth() + 1;
			this.data.days  = toDate.getDate();
			this.data.week  = toDate.getDay();
			this.data.full  = this.data.year + '';
			this.data.full += this.zeroformat(this.data.month, 2) + '';
			this.data.full += this.zeroformat(this.data.days, 2) + '';

			if (this.settings.year) {
				this.data.year  = this.settings.year;
			}
			if (this.settings.month) {
				this.data.month = this.settings.month;
			}
		},

		/* -------------------------------------------------
			set title
		------------------------------------------------- */
		set_title : function() {
			var replaceFormat = {
				'y' : String(this.data.year).substr(2, 2),
				'Y' : this.data.year,
				'm' : this.data.month,
				'M' : this.zeroformat(this.data.month, 2),
				'd' : this.data.days,
				'D' : this.zeroformat(this.data.month, 2),
				'w' : this.settings.weekFormat[this.data.week]
			};
			var date = this.settings.titleFormat;
			for (var k in replaceFormat) {
				date = date.replace(k, replaceFormat[k]);
			}
			this.data.title = date;
		},

		/* -------------------------------------------------
			next
		------------------------------------------------- */
		next : function(e) {
			this.move('next');
			this.view();
			this.cancelEvent(e);
			return false;
		},

		/* -------------------------------------------------
			prev
		------------------------------------------------- */
		prev : function(e) {
			this.move('prev');
			this.view();
			this.cancelEvent(e);
			return false;
		},

		/* -------------------------------------------------
			cancel event
		------------------------------------------------- */
		cancelEvent : function(e) {
			if (e) {
				if (e.returnValue) {
					e.returnValue = false;
				} else {
					e.preventDefault();
				}
			}
		},

		/* -------------------------------------------------
			move
		------------------------------------------------- */
		move : function(mode) {
			if (mode.match(/^(prev|next)$/)) {
				if (mode === 'prev') {
					this.data.month -= 1;
					if (this.data.month === 0) {
						this.data.year -= 1;
						this.data.month = 12;
					}
				} else if (mode === 'next') {
					this.data.month += 1;
					if (this.data.month === 13) {
						this.data.year += 1;
						this.data.month = 1;
					}
				}
			}
		},

		/* -------------------------------------------------
			view
		------------------------------------------------- */
		view : function() {
			if (this.settings.viewElement) {
				this.set_title();
				var count            = 0;
				var i                = 0;
				var j                = 0;
				var tableElement     = '';
				var empltyBlockClass = '';
				var classAry         = [];
				var classStr         = '';
				var cDate            = '';
				var cYear            = 0;
				var cMonth           = 0;
				var cDays            = 0;
				var cWeek            = 0;
				var cTotal           = 0;
				var weekLength       = this.settings.weekFormat.length;

				if (this.settings.emptyBlockClass !== '') {
					empltyBlockClass = ' class="' + this.settings.emptyBlockClass + '"';
				}

				var emptyBlockElement = '<td' + empltyBlockClass + '>' + this.settings.emptyBlock + '</td>';
				var tableElementClass = '';
				if (this.settings.tableClass !== '') {
					tableElementClass = ' class="' + this.settings.tableClass + '"';
				}
				tableElement += '<table' + tableElementClass + '>';
				if (this.settings.headerVisible) {
					tableElement += '<thead>';
					tableElement += '<tr>';
					if (this.settings.controllerVisible) {
						tableElement += '<td colspan="2"><a href="#" class="' + this.settings.prevClass + '">' + this.settings.prevText + '</a></td>';
						tableElement += '<th colspan="3">' + this.data.title + '</th>';
						tableElement += '<td colspan="2"><a href="#" class="' + this.settings.nextClass + '">' + this.settings.nextText + '</a></td>';
					} else {
						tableElement += '<th colspan="7">' + this.data.title + '</th>';
					}
					tableElement += '</tr>';
					tableElement += '</thead>';
				}
				tableElement += '<tbody>';
				tableElement += '<tr>';
				for (i = 0;i < weekLength;i++) {
					tableElement += '<th>' + this.settings.weekFormat[i] + '</th>';
				}
				tableElement += '</tr>';
				tableElement += '<tr>';
				for (i = 1; i <= 31; i++) {
					classAry = [];
					classStr = '';
					cDate    = new Date(this.data.year, this.data.month - 1, i);
					cYear    = cDate.getFullYear();
					cMonth   = cDate.getMonth() + 1;
					cDays    = cDate.getDate();
					cTotal   = 0;

					if (cYear === this.data.year && cMonth === this.data.month && cDays === i) {
						cTotal = cYear + '' + this.zeroformat(cMonth, 2) + '' + this.zeroformat(cDays, 2);
						cWeek  = cDate.getDay();

						if (cWeek === 0) {
							tableElement += '<tr>';
							count++;
							classAry.push(this.settings.sunClass);
						} else if (cWeek === 6) {
							classAry.push(this.settings.satClass);
						}

						if (i === 1 && cWeek !== 0) {
							count++;
							for(j = 1; j <= cWeek; j++) {
								tableElement += emptyBlockElement;
							}
						}

						if (this.data.full === cTotal) {
							classAry.push(this.settings.todayClass);
						}

						if (classAry.length >= 1) {
							classStr = ' class="' + classAry.join(' ') + '"';
						}

						tableElement += '<td' + classStr + '>' + i + '</td>';

						if (cWeek === 6) {
							tableElement += '</tr>';
						}
					}
				}
				if (cWeek !== 6) {
					var last = 6 - cWeek;
					for (i = 1; i <= last; i++) {
						tableElement += emptyBlockElement;
					}
					tableElement += '</tr>';
				}
				count = 6 - count;
				if (count !== 0) {
					for (i = 1;i <= count;i++) {
						tableElement += '<tr>';
						for (j = 0; j < 7; j++) {
							tableElement += emptyBlockElement;
						}
						tableElement += '</tr>';
					}
				}
				tableElement += '</tbody>';
				tableElement += '</table>';
				this.settings.viewElement.innerHTML = tableElement;
				if (this.settings.controllerVisible) {
					var _this = this;
					var prevElmt = this.getElementByClassName('a', 'prev');
					var nextElmt = this.getElementByClassName('a', 'next');
					this.addEvent(prevElmt, 'click', function(e) {_this.prev(e);});
					this.addEvent(nextElmt, 'click', function(e) {_this.next(e);});
				}
			}
			return this;
		},
		/* -------------------------------------------------
			add event
		------------------------------------------------- */
		addEvent : function(obj, type, func) {
			if (obj.addEventListener) {
				obj.addEventListener(type, func, false);
			} else if (obj.attachEvent) {
				obj.attachEvent('on' + type, func);
			}
			return obj;
		},

		/* -------------------------------------------------
			get element by class name
		------------------------------------------------- */
		getElementByClassName : function(el, cn) {
			var rElement;
			if (this.settings.viewElement) {
				var searchNodes = this.settings.viewElement.getElementsByTagName(el);
				for (var i = 0; i < searchNodes.length; i++) {
					if (searchNodes[i].className === cn) {
						rElement = searchNodes[i];
						break;
					}
				}
			}
			return rElement;
		},

		/* -------------------------------------------------
			extends
		------------------------------------------------- */
		extends : function e(t, s) {
			if (!t) {
				t = {};
			}
			if (!s) {
				return t;
			}
			for (var p in s) {
				t[p] = s[p];
			}
			return t;
		},

		/* -------------------------------------------------
			zero format
		------------------------------------------------- */
		zeroformat : function(v, n) {
			var vl = String(v).length;
			if (!n) {
				n = 1;
			}
			if (n > vl) {
				return (new Array((n - vl) + 1).join(0)) + v;
			} else {
				return v;
			}
		}
	};
})();
