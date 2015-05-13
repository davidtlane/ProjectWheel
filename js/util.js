angular.module('myApp.util', [])
  .factory('util', function() {

		var zp2 = function (int) { return (int>9) ? int : '0'+int; };

		var cols = ["#1f77b4",
								"#ff7f0e",
								"#ffbb78",
								"#2ca02c",
								"#98df8a",
								"#d62728",
								"#ff9896",
								"#9467bd",
								"#c5b0d5",
								"#8c564b",
								"#c49c94",
								"#e377c2",
								"#f7b6d2",
								"#bcbd22",
								"#dbdb8d",
								"#17becf",
								"#9edae5"];

		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    var util = {};

		util.getPos = function (el) {
			for (var lx=0, ly=0; el != null; lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
				return {x: lx,y: ly};
		};

		util.fillSpace = function (e,h) {
			var t = e.offsetTop; console.log(t);
			return (h - t) + 'px';
		};

		util.formatDate = function (d) {
			return months[d.getMonth()]+', '+d.getDate();
		};

		util.formatDateL = function (d) {
			return months[d.getMonth()]+'-'+d.getDate()+'-'+d.getFullYear();
		};

		util.formatDateDiff = function (diff) {
			if (diff==0) return "Today";
			if (diff==1) return "Tomorrow";
			if (diff==-1) return "Yesterday";
			if (diff<-1) return -diff + " days ago";
			if (diff>1) return 'in ' + diff + " days";
		};

		util.taskColors = cols;

		util.blendRGB = function (rgb) {
			var r=[], g=[], b=[];
			var len = rgb.length;
			for (var i=0;i<len;i++) {
				r.push( parseInt(hex[i].slice(1,3),16) );
				g.push( parseInt(hex[i].slice(3,5),16) );
				b.push( parseInt(hex[i].slice(5,7),16) );
			}
			r = Math.round( r.reduce(function(a, b){return a+b;})/len );
			b = Math.round( b.reduce(function(a, b){return a+b;})/len );
			g = Math.round( g.reduce(function(a, b){return a+b;})/len );

			return "rgb("+r+","+g+","+b+")";
		};

		util.blendHex = function (hex) {
			var r=[], g=[], b=[];
			var len = hex.length;
			for (var i=0;i<len;i++) {
				r.push( parseInt(hex[i].slice(1,3),16) );
				g.push( parseInt(hex[i].slice(3,5),16) );
				b.push( parseInt(hex[i].slice(5,7),16) );
			}
			r = Math.round( r.reduce(function(a, b){return a+b;})/len );
			b = Math.round( b.reduce(function(a, b){return a+b;})/len );
			g = Math.round( g.reduce(function(a, b){return a+b;})/len );

			return "rgb("+r+","+g+","+b+")";
		};

		util.daydiff = function (str1,str2) {
				var d1 = moment(str1);
				var d2 = moment(str2);
				return d2.diff(d1,"days");
		};

		util.pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return d.dur; });

		util.dateToString = function (d) {
			return d.getFullYear()+'-'+zp2(1+d.getMonth())+'-'+zp2(d.getDate());
		};

		util.cross = function (a, b) {
			return a[0] * b[1] - a[1] * b[0];
		};

		util.dot = function (a, b) {
			return a[0] * b[0] + a[1] * b[1];
		};

    return util;
  });
