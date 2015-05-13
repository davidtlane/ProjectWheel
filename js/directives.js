angular.module('myApp')

.directive('myTabs', ['$compile', '$window', function ($compile, $window) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {

			scope.scrollLeftDown = function () {
				moveLeft();
				timeout_id = setTimeout(function(){scope.scrollLeftDown();}, 50);
				scope.scrollLeftUp = function () {
					clearTimeout(timeout_id);
				};
			};

			scope.scrollRightDown = function () {
				moveRight();
				timeout_id = setTimeout(function(){scope.scrollRightDown();}, 50);
				scope.scrollRightUp = function () {
					clearTimeout(timeout_id);
				};
			};

      angular.element($window).on('load resize', function(event) {
				handleSize(element[0]);
      });

			scope.$watch("projectsList", function(){handleSize(element[0])}, true);

			function scrollColors () {
				scope.rightColor = ( canMoveRight() ) ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)';
				scope.leftColor = ( canMoveLeft() ) ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)';
			}

			function canMoveLeft () {
				var tabs = scope.tabList.children;
				var L = tabs.length;
				var rect = scope.tabList.getBoundingClientRect();
				var rect2 = tabs[L-1].getBoundingClientRect();
				if (rect2.right<scope.wrapper.clientWidth) return false;
				else return true;
			}

			function canMoveRight () {
				var rect = scope.tabList.getBoundingClientRect();
				if (rect.left>=0) return false;
				else return true;
			}

			function moveLeft () {
				if (scope.projectsList.length===0) return;
				var rect = scope.tabList.getBoundingClientRect();
				if (canMoveLeft()) scope.tabList.style.left = rect.left-5+'px';
				scrollColors();
			}

			function moveRight () {
				if (scope.projectsList.length===0) return;
				var rect = scope.tabList.getBoundingClientRect();
				if (canMoveRight()) scope.tabList.style.left = rect.left+5+'px';
				scrollColors();
			}

			function handleSize (el) {
				if (scope.projectsList.length===0) return;
				var w = el.clientWidth,
						bw = el.children[0].clientWidth;
				scope.wrapper = el.children[1];
				scope.tabList = scope.wrapper.children[0];
				scope.tabList.style.width = (5*w)+'px';
				scope.wrapper.style.width = (w-bw-10)+'px';
				scrollColors();
			}

		}
	};
}])

.directive('myNodes', ['$compile', '$window', function ($compile, $window) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {

			scope.$watch("cp.name", drawWheel, true);
			scope.$watch("cp.update", drawWheel, true);
			scope.$watch("cp.rotate", rotateTasks, true);
			scope.$watch("cp.curTaskID", highlightTask, true);
			scope.$watch("cp.curDateID", highlightDate, true);

      angular.element($window).on('resize', function(event) {
				handleSize(element[0]);
				drawWheel();
      });

			function handleSize (el) {
        scope.svgHeight(el);
				var h = el.clientWidth*1.0 -70;
				scope.taskListEl.style.maxHeight = h+'px';
			}

			function arrayEquiv (a,b) {
				if (a === b) return true;
				if (a == null || b == null) return false;
				if (a.length != b.length) return false;
				a.sort(function(x,y){return y-x;});
				b.sort(function(x,y){return y-x;});
				for (var i = 0; i < a.length; i++) {
					if (a[i] !== b[i]) return false;
				}
				return true;
			}

			function highlightTask () {
				if (!scope.cp) return; if (scope.cp.tasks.length===0) return;
				var id = scope.cp.curTaskID;
				var tasks = scope.cp.tasks;
				var cur = tasks.filter(function(e){return (e!=null && e.id==id);});
				var fam = cur[0].family;
				d3.selectAll(".taskArc").each(function(d,i){
					if ( arrayEquiv(d.family,fam) ) {
						d3.select("#drawArea").insert(function(){
							return d3.select("#taskArc"+d.id)[0][0]
						}, function(){
							return d3.select("#taskArc"+id)[0][0]
						});
					}
				});
				d3.selectAll(".taskPath").style("stroke-width",'0px');
				d3.select("#taskPath"+id).style("stroke-width",'2px');
			}

			function highlightDate () {
				if (!scope.cp) return;
				var id = scope.cp.curDateID;
				d3.selectAll(".dateArcPath").style("fill", "rgb(220,220,220)");
				d3.select("#dateArcPath"+id).style("fill", "rgb(110,110,130)");
				d3.select("#dateText").text(id+1);
			}

			function rotateTasks () {
				if (!scope.cp) return;
				if (scope.cp.tasks==[]) return;
				for (var i=0; i<scope.cp.tasks.length; i++) {
					var task = scope.cp.tasks[i];
					if (task!=null) {
						var rotate = task.start*360/scope.cp.length;
						d3.select("#taskArc"+i).attr("transform", "rotate("+rotate+")");
					}
				}
			}

			function drawWheel () {

				var w = element[0].clientWidth;
				var h = w;

				var rx = w/2;
				var ry = h/2;
				var radius = rx - 10;

				var circleRadius = 0.15 * radius;
	
				var timePastColors = d3.scale.ordinal()
		  		.range(["rgba(180,0,180,1)", "rgba(0,0,0,0)"]);

				var timeArcRadii = [0.15,0.20],
						dateArcRadii = [0.20,1.00],
						taskArcRadii = [0.30,0.90];

				var dateArc = d3.svg.arc()
						.outerRadius(radius * dateArcRadii[1])
						.innerRadius(radius * dateArcRadii[0]);

				var timeArc = d3.svg.arc()
						.outerRadius(radius * timeArcRadii[1])
						.innerRadius(radius * timeArcRadii[0]);

				var pie = d3.layout.pie()
					.sort(null)
					.value(function(d) { return d.dur; });

				d3.select("#drawArea").remove();

				var svg = d3.select("#svg").append("g");

				svg
					.attr("id","drawArea")
					.attr("transform", "translate(" + rx + "," + ry + ")");

				if (!scope.cp) return;

				var len = scope.cp.length;
				var dates = scope.cp.getDates();
				var timeData = scope.cp.getTimeData();
				var dateArcs = svg.selectAll(".dateArc").data(pie(dates)).enter().append("g");

				dateArcs
					//.attr("filter", "url(#dateArcFilter)")
					.attr("class", "dateArc");

				var datePaths = dateArcs.append("path");

				datePaths
					.attr("d", dateArc)
					.attr("class", "dateArcPath")
					.attr("ng-mousedown", function(d,i) { return "dateDown("+i+")"; })
					.attr("id",function(d,i) { return "dateArcPath"+i;} );

				var timeArcs = svg.selectAll(".timeArc").data(pie(timeData)).enter().append("g");

				timeArcs
					.attr("class", "timeArc");

				var timePath = timeArcs.append("path");

				timePath
					.attr("d", timeArc)
					.attr("class", "timePastPath")
					.attr("id",function(d,i) { return "timePastPath"+i;} )
					.style("fill", function(d) { return timePastColors(d.data.name); });

				var cirlce = svg.append("circle")
					.attr("class", "circle")
					.attr({cx: "0", cy: "0", r: circleRadius});

				svg.append("text")
					.attr("x", 0)
					.attr("y", 0)
					.attr("dy", "0.4em")
					.attr("text-anchor", "middle")
					.attr("id", "dateText");

				if (scope.cp.numTasks()==0) return

				var taskData = scope.cp.tasks.filter(function(e){return (e!=null);});

				taskData.sort(function(a,b){
					return b.family.length - a.family.length;
				});

				var families = [];
				for (var i=0; i<taskData.length; i++) {
					var task = taskData[i];
					for (var j=0; j<task.family.length; j++) {
						if (families.indexOf(task.family[j])==-1) families.push(task.family[j]);
					}
				}

				families.sort(function(a,b){return a-b;});

				var nc = families.length;
				var cw = (taskArcRadii[1]-taskArcRadii[0])/nc; // column width
				var nt = taskData.length;
				var tw = (taskArcRadii[1]-taskArcRadii[0])/nt;
				var taskArc = d3.svg.arc()
					.outerRadius(function(d,i){
						var maxF = Math.max.apply(null, d.family);
						var idx = families.indexOf(maxF);
//						return radius*( taskArcRadii[0] + tw*(nt-i) );
						return radius*( taskArcRadii[0] + cw*(idx+1) );
					})
					.innerRadius(function(d,i){
						var minF = Math.min.apply(null, d.family);
						var idx = families.indexOf(minF);
//						return radius*( taskArcRadii[0] + cw*(0) );
						return radius*( taskArcRadii[0] + cw*(idx) );
					});

				var arcs = svg.selectAll(".taskArc").data(taskData).enter().append("g");

				arcs
					.attr("class", "taskArc")
					.attr("id", function(d) { return "taskArc"+d.id; })
					.attr("transform", function (d) { return "rotate(" + (d.start*360/len) + ")"; });

				var paths =	arcs.append("path");

				paths
					.attr("class", "taskPath")
					.attr("id",function(d) { return "taskPath"+d.id; })
					.attr("d", taskArc)
					.attr("ng-mousedown", function(d) { return "taskDown($event,"+d.id+")"; })
					.style("fill", function(d) { return d.color;	})
					.style("fill-opacity", 0.95);
					

				element.removeAttr("my-nodes");
				$compile(element)(scope);

			}

		}
	};
}]);


