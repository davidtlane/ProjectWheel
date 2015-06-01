


startApp();

function startApp() {

var app = angular.module('myApp', ['ui.bootstrap','myApp.projectAPI','myApp.util']);

app.controller('app-ctrl', function($scope, $document, $modal, projectAPI, util) {

	var projects = {},
			dragState = false;

	$scope.svgDiv = document.getElementById("svg-div");
	$scope.tabList = document.getElementById("tab-list");
	$scope.taskList = document.getElementById("task-list");

	$scope.removeProjectModal = function () {
		var modalInstance = $modal.open({
			templateUrl: 'removeProjectModal.html',
			controller: 'removeProjectModalCtrl',
			backdrop: 'static',
			resolve: { globalScope: function(){return $scope.cp.name;} }
		});
		modalInstance.result.then(
			function(pn){removeProject(pn)}, function(){}
		);
	};

	$scope.newProjectModal = function () {
		var modalInstance = $modal.open({
			templateUrl: 'newProjectModal.html',
			controller: 'newProjectModalCtrl',
			backdrop: 'static',
			resolve: { globalScope: function(){return angular.copy($scope.projectsList);} }
		});
		modalInstance.result.then(
			function(np){createProject(np)}, function(){}
		);
	};

	$scope.editProjectModal = function () {
		var modalInstance = $modal.open({
			templateUrl: 'editProjectModal.html',
			controller: 'editProjectModalCtrl',
			backdrop: 'static',
			resolve: { globalScope: function(){return angular.copy($scope.cp);} }
		});
		modalInstance.result.then(
			function(et){editProject(et)}, function(){}
		);
	};

	$scope.projectsList = [];

	$scope.filterTasks = function (e) {return (e!=null);};

	$scope.isActive = function (x) {
		return x == $scope.cp.name;
	};

	$scope.noProjects = function () {
		return ( !localStorage.projects || localStorage.projects=="{}")
	}

	$scope.noTasks = function () {
		return ( $scope.cp && $scope.cp.numTasks()==0 )
	}

	$scope.hidePanel = function () {
		return ( !$scope.cp || $scope.cp.numTasks()==0 )
	}

	$scope.curDateFormat = function () {
		if (!$scope.cp) return;
		var dates = $scope.cp.getDates();
		var dateID = $scope.cp.curDateID;
		var name = util.formatDateL(dates[dateID].date);
		var diff = util.formatDateDiff(dates[dateID].diff);
		return {name:name, diff:diff};
	};

	$scope.curTaskFormat = function () {
		if (!$scope.cp || $scope.cp.tasks.length==0) return;
		var dates = $scope.cp.getDates();
		var task = $scope.cp.tasks[$scope.cp.curTaskID];
		var start = util.formatDateL(dates[task.start].date);
		var startDiff = util.formatDateDiff(dates[task.start].diff);
		var end = util.formatDateL(dates[task.end-1].date);
		var endDiff = util.formatDateDiff(dates[task.end-1].diff);
		return {start:start, startDiff:startDiff, end:end, endDiff:endDiff};
	};

	$scope.tabClick = function (pname) {
		if (localStorage.curProjectName != pname) switchProject(pname);
	};

	$scope.setBGColor = function (x) {
		return { backgroundColor: x };
	};

	$scope.dateDown = function (id) {
		$scope.cp.curDateID = id;
	};

	$scope.changeCurTaskID = function (id) { $scope.cp.curTaskID = id; };

	$scope.taskDown = function (ev,id) {
		if (!dragState) {
			ev.preventDefault();
			svgPos = util.getPos($scope.svgDiv);
			$scope.cp.curTaskID = id;
			svgRad = $scope.svgDiv.clientWidth/2;
			dragPos0 = [ev.pageX-svgRad-svgPos.x, ev.pageY-svgRad-svgPos.y];
			moved = 0;
			dragState = true;
		}
	};

	$scope.taskMove = function (ev) {
		if (dragState) {
			ev.preventDefault();
			var dragPos1 = [ev.pageX-svgRad-svgPos.x, ev.pageY-svgRad-svgPos.y];
			var dragAngle = Math.atan2(util.cross(dragPos0, dragPos1), util.dot(dragPos0, dragPos1)) * 180 / Math.PI;
			var unitAngle = 360/$scope.cp.length;
			var move = Math.round(dragAngle/unitAngle);
			var offset = move - moved;
			if (offset!=0) {
				moved = move;
				$scope.cp.moveTask($scope.cp.curTaskID, offset);
			}
		}
	};

	$scope.taskUp = function () {
		if (dragState) {
			dragState = false;
			saveProject();
		}
	};

	function switchProject (pname) {
		localStorage.curProjectName = pname;
		$scope.cp = projects[pname];
	}

	function initProjects () {
		projects = JSON.parse(localStorage.projects);
		var methods = new projectAPI.ProjectMethods();
		for (x in projects) {
			projects[x].__proto__ = methods;
			$scope.projectsList.push(x);
		}
		switchProject(localStorage.curProjectName);
	}

	function saveProject () {
		projects[$scope.cp.name] = $scope.cp;
		localStorage.projects = JSON.stringify(projects);
	}

	function createProject (np) {
		var name = np.name,
				start = util.dateToString(np.start),
				end = util.dateToString(np.end),
				period = 1;

		var proj = new projectAPI.Project(name, start, end, period);
		var methods = new projectAPI.ProjectMethods();
		proj.__proto__ = methods;
		$scope.projectsList.push(name);

		projects[name] = proj;
		localStorage.projects = JSON.stringify(projects);
		switchProject(name);
	}

	 function editProject (editedTasks) {
		$scope.cp.tasks = editedTasks;
		$scope.cp.update++;
		saveProject();
	}

	function removeProject (pn) {
		delete projects[pn];
		localStorage.projects = JSON.stringify(projects);
		var idx = $scope.projectsList.indexOf(pn);
		$scope.projectsList.splice(idx,1);
		if ($scope.projectsList.length>0) {
			switchProject($scope.projectsList[0]);
		} else {
			localStorage.curProjectName = null;
			delete $scope.cp;
		}
	}

	if (!$scope.noProjects()) initProjects();

});

	angular.module(['ui.bootstrap'])
		.controller('removeProjectModalCtrl', function ($scope, $modalInstance, globalScope) {

		$scope.pn = globalScope;

		$scope.ok = function () {
			$modalInstance.close($scope.pn);
		};

		$scope.cancel = function () {
		  $modalInstance.dismiss('cancel');
		};

	});

	angular.module(['ui.bootstrap'])
		.controller('newProjectModalCtrl', function ($scope, $modalInstance, globalScope) {

		$scope.ok = function () {
			var name = $scope.newProjectName,
					start = $scope.newProjectStart,
					end = $scope.newProjectEnd,
					period = $scope.newProjectPeriod;
			if (name && end>start) {
				$modalInstance.close({name:name, start:start, end:end, period:period});
		  }
		};

		$scope.cancel = function () {
		  $modalInstance.dismiss('cancel');
		};

	});

	angular.module(['ui.bootstrap'])
		.controller('editProjectModalCtrl', function ($scope, $modalInstance, globalScope) {

		$scope.cp = globalScope;

		$scope.opt1 = ""; $scope.opt2 = "";

		$scope.filterTasks = function (e) { return (e!=null); };
		$scope.filterTasksDeps = function (e) { return (e!=null && e.children.length>0 ); };

		$scope.setDep = function (opt1, opt2) {
			var tid1=-1, tid2=-1;
			$scope.cp.tasks.filter($scope.filterTasks).forEach(function(e,i,a){
				if (e.name==opt1) tid1 = e.id;
				if (e.name==opt2) tid2 = e.id;
			});
			if (tid1!=-1 && tid2!=-1) $scope.cp.addDependency (tid1,tid2);
		};

		$scope.ok = function () {
			$modalInstance.close($scope.cp.tasks);
		};

		$scope.cancel = function () {
		  $modalInstance.dismiss('cancel');
		};

	});

}


