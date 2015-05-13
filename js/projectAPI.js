angular.module('myApp.projectAPI', ['myApp.util'])
  .factory('projectAPI', function(util) {

		arrayDel = function (arr,val) {
			var idx = arr.indexOf(val);
			if (idx!=-1) arr.splice(idx,1);
		};

    var api = {};

		api.Project = function (name, start, end, period) {
			this.name = name;
			this.start = start;
			this.end = end;
			this.period = period;
			this.tasks = [];
			this.curTaskID = 0;
			this.curDateID = 0;
			this.update = 0;
			this.rotate = 0;
			this.length = util.daydiff(start,end)+1;
		};

    api.ProjectMethods = function() {
    
    	this.setCurTaskID = function() {
    		for (var i=0;i<this.tasks.length; i++) {
    			if (this.tasks[i]!=null) {
    				this.curTaskID=i;
    				return;
    			}
    		}
    	};
    
			this.addTask = function (name, duration) {
				var tid = this.tasks.length;
				if (duration>0 && duration<=this.length) {
					var task = {name:name, duration:duration, children:[], parents:[], id:tid}
					task.startAngle = 0;
					task.endAngle = (duration/this.length)*2*Math.PI;
					task.padAngle = 0;
					task.value = duration;
					this.tasks[tid] = task;
					this.updateTask(tid);
					return 1; //success flag
				} else {
					return 0; //error flag
				}
			};

			this.addDependency = function (tid1, tid2) {
				if (tid1==tid2) return;
				if (this.tasksRelated(tid1,tid2)) return;
				if ( this.maxStart(tid1) >= this.minEnd(tid2) ) {
					this.tasks[tid1].children.push(tid2);
					this.tasks[tid2].parents.push(tid1);
					this.updateTasks();
					return 1;
				} else {
					return 0;
				}
			};

			this.removeTask = function (tid) {
				var task = this.tasks[tid];
				var p = task.parents, c = task.children;
				for (var i=0; i<p.length; i++) {
					this.removeDependency(p[i],tid)
				}
				for (var i=0; i<c.length; i++) {
					this.removeDependency(tid,c[i])
				}
				if (this.curTaskID==tid) this.setCurTaskID();
				this.tasks[tid]=null;
			};

			this.removeDependency = function (tid1,tid2) {
				arrayDel(this.tasks[tid1].children, tid2);
				arrayDel(this.tasks[tid2].parents, tid1);
				this.updateTasks();
			};

			this.numTasks = function () {
				var num=0, t;
				for (var i=0;i<this.tasks.length;i++) {
					if (this.tasks[i]!=null) num++;
				}
				return num;
			};

			this.getTaskDuration = function (tid) {
				return this.tasks[tid].duration;
			};

			this.maxEnd = function (tid) {
				var pars = this.tasks[tid].parents;
				var len = this.length;
				if (pars.length==0) {
					return len;
				} else {
					var end=len;
					for (var i=0; i<pars.length; i++) {
						end = Math.min(end, this.maxStart(pars[i]));
					}
					return end;
				}
			};

			this.maxStart = function (tid) {
				return this.maxEnd(tid) - this.getTaskDuration(tid);
			};

			this.minStart = function (tid) {
				var chrn = this.tasks[tid].children;
				if (chrn.length==0) {
					return 0;
				} else {
					var start=0;
					for (var i=0; i<chrn.length; i++) {
						start = Math.max(start, this.minEnd(chrn[i]));
					}
					return start;
				}
			};

			this.minEnd = function (tid) {
				return this.minStart(tid) + this.getTaskDuration(tid);
			};

			this.getTaskFamily = function(tid) {
				var pars = this.tasks[tid].parents;
				var family = [];
				if (pars.length==0) {
					family.push(tid);
				} else {
					for (var i=0; i<pars.length; i++) {
						var parentFamily = this.getTaskFamily(pars[i]);
						for (var j=0; j<parentFamily.length; j++) {
							if (family.indexOf(parentFamily[j])==-1) family.push(parentFamily[j]);
						}
					}
				}
				return family;
			};

			this.tasksRelated = function (tid1,tid2) {
				var f1 = this.tasks[tid1].family;
				var f2 = this.tasks[tid2].family;
				for (var i=0; i<f1.length; i++) {
					for (var j=0; j<f2.length; j++) {
						if (f1[i]==f2[j]) {
							return true;
						}
					}
				}
				return false;
			};

			this.getDates = function () {
				var startDate = new Date(this.start);
				var endDate = new Date(this.end);
				var now = new Date();
				now.setHours(0,0,0,0);
				var offset = endDate.getTimezoneOffset();
				startDate.setMinutes(startDate.getMinutes()+offset);
				endDate.setMinutes(endDate.getMinutes()+offset);
				var dateDiff = endDate.getTime()-startDate.getTime();
				if (dateDiff<0) return;
				var dates = [];
				var i=0;
				while (dateDiff>0) {
					var d = new Date(this.end);
					d.setMinutes(d.getMinutes()+offset);
					d.setDate(endDate.getDate()-i*this.period);
					var diff = Math.round((d.getTime()-now.getTime())/(1000 * 3600 * 24));
					dates.push({date:d, dur:1, diff:diff});
					dateDiff = d.getTime() - startDate.getTime();
					i++;
				}
				dates.reverse();
				return dates;
			};

			this.getTimeData = function () {
				var T0 = (new Date(this.start+' 00:00:00')).getTime();
				var T1 = (new Date(this.end+' 23:59:59')).getTime();
				var TX = (new Date()).getTime();
				return [	{name:"past", dur:Math.max(0,TX-T0)},
									{name:"future", dur:Math.abs(T1-TX)} ];
			};

			this.taskFinished = function (tid) { return (this.curDateID>this.tasks[tid].end-1); }

			this.taskMsg = function (tid) {
				var task = this.tasks[tid];
				var start = this.curDateID - task.start;
				var end = this.curDateID - (task.end-1);
				if (end==0) return 'Finish '+task.name;
				if (end>0) return task.name+' finished';
				if (start==0) return 'Start '+task.name;
				if (start<0) return task.name+' not started';
				if (start>0) return 'Continue '+task.name;
				return
			};

			this.getColor = function (tid) {
				var colors = [];
				var pars = this.tasks[tid].parents;
				for (var k=0; k<pars.length; k++) {
					colors.push(util.taskColors[pars[k]%util.taskColors.length]);
				}
				colors.push(util.taskColors[tid]);
				return util.blendHex(colors);
			};

			this.updateTasks = function () {
				for (var i=0; i<this.tasks.length; i++) {
					var task = this.tasks[i];
					if (task!=null) this.updateTask(task.id);
				}
			};

			this.updateTask = function (tid) {
				var task = this.tasks[tid];
				task.maxStart = this.maxStart(tid);
				task.maxEnd = this.maxEnd(tid);
				task.minStart = this.minStart(tid);
				task.minEnd = this.minEnd(tid);
				if (!task.start) {
					task.start = task.maxStart;
					task.end = task.maxEnd;
				}
				if (task.start > task.maxStart) {
					task.start = task.maxStart;
					task.end = task.maxEnd;
				}
				if (task.start < task.minStart) {
					task.start = task.minStart;
					task.end = task.minEnd;
				}
				task.family = this.getTaskFamily(tid);
				task.color = this.getColor(tid);
			};

			this.moveTask = function (id,move) {
				var tasks = this.tasks;
				var task = tasks[id];
				var children = task.children,
						parents = task.parents;
				if (task.start+move <= task.maxStart && task.start+move >= task.minStart) {
					task.start += move;
					task.end += move;
					for (var i=0; i<children.length; i++) {
						var overlap = task.start - tasks[children[i]].end;
						if (overlap<0) this.moveTask(children[i], move);
					}
					for (var i=0; i<parents.length; i++) {
						var overlap = task.end - tasks[parents[i]].start;
						if (overlap>0) this.moveTask(parents[i], move);
					}
					this.rotate++;
				}
			};

    };

    return api;
  });
  
  
