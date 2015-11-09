//
// SAGE2 application: ConferenceScheduler
// by: Vishal Doshi <vdoshi3@uic.edu>
//
// Copyright (c) 2015
//
//Git Curent Branch: sneha2


var ConferenceScheduler = SAGE2_App.extend( {
	init: function(data) {
		// Create div into the DOM
		this.SAGE2Init("div", data);
		// Set the background to black
		this.element.style.backgroundColor = 'black';

		//Create user interartion 
		this.userInteraction = {};

		// // move and resize callbacks
		// this.resizeEvents = "continuous";
		// this.moveEvents   = "continuous";

		// move and resize callbacks
		this.resizeEvents = "onfinish";
		this.moveEvents   = "onfinish";


		this.numberOfDays = 5;
		this.numberOfHalls = 3;
		this.numberOfSessions = 6;

		// this.themeNames = ["Robotics","Visualization","Neural Networks"];
		this.themeNames = [];
		this.array_days = [];
		this.array_dates = [];
		this.array_halls = [];
		this.array_sessions = [];

		// this.catagorizedStickies = {"Robotics":[],"Visualization":[],"Neural Networks":[]};
		this.catagorizedStickies = {};
		//Colors for Sticky
		// this.stickyColor = {"Robotics":"#FEBB32","Visualization":"#8EE13E", "Neural Networks":"#76CBC8"};
		this.stickyColor = {};

		//Grid variables
		this.numberOfRows = this.numberOfSessions;
		this.numberOfColumns =  this.numberOfDays * this.numberOfHalls;

		//Sticky variables
		this.numberOfThemes = 6;
		this.stickyReservoirRatio = 3;

		//Division ratio
		this.gridWRatio = 0.6;
		this.gridHRatio = 0.8;

		this.toggle = true;

		//Button Width and Height

		this.buttonW = 550;
		this.buttonH = 100;
		this.buttonwidth = 1000;
	

		//Post-it Width and Height
		this.postItW = 0;
		this.postItH = 0;
		this.padding = 0;
		this.filter = null;
		this.shadowColor = "black";
		this.shadowDepth = 4;
		this.stickyFontSize = 5;

		//Size of HolderCells
		this.holderW = 0;
		this.holderH = 0;


		//Get the Window height and width
		this.mainDivW = parseInt(this.element.style.width,  10);
		this.mainDivH = parseInt(this.element.style.height, 10);

		this.orgMainDivW = this.mainDivW;
		this.orgMainDivH = this.mainDivH;

		//Calculating SVG viewport width and height
		//UPDATE REQUIRED: make sure the aspect ratio when the the window is resized, and refreshed.
		this.paper_mainW = 4000; 
		this.paper_mainH = (this.paper_mainW * (this.mainDivH / this.mainDivW));

		this.paper_gridXEnd = this.paper_mainW * this.gridWRatio;
		this.paper_gridYEnd = this.paper_mainH * this.gridHRatio;

		//Default values of workzone. Will be updated on resize
		this.workablePixelW = this.orgMainDivW;
		this.offsetWorkZoneX = 0;
		this.workablePixelH = this.orgMainDivH;
		this.offsetWorkZoneY = 0;
		
		//
		// this.state.hello = data.state.hello;
		console.log("State:"+ JSON.stringify(data));
		// data.value = 10;
		// this.state.value = 10;
		// console.log("State:"+ this.state.hello);

		//Calling personal methods
		this.readConferenceInfo();
		// this.readPaperList();
	
		this.createSnapPaper();
		this.createPartitions();
		// this.intializeGrid();
		// this.intializeSticky();
		// this.intializeControl();

		this.SAGE2Sync(true);

		// SAGE2 Application Settings
		//
		// Control the frame rate for an animation application
		this.maxFPS = 2.0;
		// Not adding controls but making the default buttons available
		this.controls.finishedAddingControls();
		this.enableControls = true;
		
	},
		
//==> PLay Area
	readConferenceInfo: function(){
		var _this = this;
		readFile(this.resrcPath+"conferenceinfo.json", function(err,data){
			if (err) throw err;
			else{
			// console.log("ReadData"+ data);
			// console.log("numberOfThemes:"+data.numberOfThemes);
				_this.numberOfDays = data.numberOfDays;
				_this.numberOfHalls = data.numberOfHalls;
				_this.numberOfSessions = data.numberOfSessions;
				_this.numberOfThemes = data.numberOfThemes;
				_this.stickyColor = data.themes;
				_this.array_days = data.days;
				_this.array_dates = data.dates;
				_this.array_sessions = data.sessions;
				_this.array_halls = data.halls;
				console.log("StickyColor:"+ JSON.stringify(_this.stickyColor));
				for(var key in _this.stickyColor){
					_this.themeNames.push(key);
					//Creating empty arrays for holding catagorized sticky information
					_this.catagorizedStickies[key] = [];
				}
				console.log("catagorizedStickies:"+JSON.stringify(_this.catagorizedStickies));
				for(var i = 0; i< _this.array_sessions.length ; i++){
					console.log("Dates: " + i + ">"+ _this.array_sessions[i]);
				}
				_this.readPaperList();
				_this.intializeGrid();
				_this.intializeSticky();
				_this.intializeControl();

			}
  			// return data;
  		}, "JSON");
	},

	readPaperList: function(){
		var _this = this;
		readFile(this.resrcPath+"paperlist.json", function(err,data){
			if (err) throw err;
			else{
			// console.log("ReadData"+ data);
			_this.intializePostIts(data);
			}
  			// return data;
  		}, "JSON");
	},

	intializePostIts: function(paperlist){

		var longestPostItText = 0;
		if(paperlist != null){
			var postitinfo = [];

			// console.log("DATA"+ paperlist[1].date);
			for(var key = 0; key < paperlist.length ; key++){
				// console.log("From postit"+ paperlist[key]["Title"]);
				var currentPostItLength = 20; //Including length of "title:" and "speaker:"
				var title = paperlist[key]["Title"];
				var speaker = paperlist[key]["Speaker"];
				var theme = paperlist[key]["Theme"];

				currentPostItLength = title.length + speaker.length;
				if(currentPostItLength > longestPostItText){
					longestPostItText = currentPostItLength;
				}
				// console.log("Theme"+ theme);
				
				//Creating a sticky object and pushing into right catagory based on its theme.
				var newSticky = {};
				newSticky['title'] = title;
				newSticky['speaker'] = speaker;

				this.catagorizedStickies[theme].push(newSticky);
				// console.log("Objects"+JSON.stringify(newSticky));

			}
			this.longestPostItText = longestPostItText;
			this.drawPostIts(postitinfo);

			//Printing stickies on console
			// for (var key in this.catagorizedStickies) {
 		// 		// console.log(a[key][Object.keys(a[key])[0]].p); // 81.25
 		// 		for(var k = 0; k< this.catagorizedStickies[key].length;k++)
 		// 			console.log("Theme Objects "+JSON.stringify(this.catagorizedStickies[key][k]));
			// }
			
		}

	},

	drawPostIts: function(postitinfo){
		//Getting ends of grid section
		var paper_gridXEnd = this.paper_gridXEnd;
		var paper_gridYEnd = this.paper_gridYEnd;

		//Getting svg bounds
		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		//Getting the size of sticky section
		var paper_stickyW = (paper_mainW - paper_gridXEnd) * 0.8;
		var paper_stickyH = paper_mainH * 0.8;

		//Creating table
		//Varibles for looping
		var sticky_offsetX = (paper_stickyW * 0.1);
		var sticky_offsetY = (paper_stickyH * 0.1);

		//Creating table
		//Varibles for looping
		var i;
		var j;

		//Holds the width and height of cell

		var oldCellW = paper_stickyW/(this.stickyReservoirRatio+1); //Calculating the width of theme cell
		var cellW = oldCellW;
		// var cellH = paper_stickyH/this.numberOfThemes;
		var cellH = parseInt(Math.min(paper_stickyH/this.numberOfThemes,cellW*1.5),10);
		var stickyReservoirW = cellW * (this.stickyReservoirRatio);

		//Holds location where the rectangle has to be created
		var cellX = paper_gridXEnd+sticky_offsetX+cellW;
		var cellY = sticky_offsetY;
		console.log("CellX:"+cellX+" : CellY: "+cellY);
		
		//Create an array of stickies
		this.array_sticky = [];
		//Create Array of Sticky objects
		this.sticky_object_array = [];

		var sticky_x1;
		var sticky_y1;
		var sticky_x2;
		var sticky_y2;
		var array_sticky = this.array_sticky;
		var counter = 0;


		//Post-it Width and Height
		var postItW = Math.min(stickyReservoirW/5,cellH/3) ;
		var postItH = postItW;

		//Updating the postit values
		this.postItW = postItW;
		this.postItH = postItH;
		// console.log(this.postItW + "&&&&" + this.postItH);

		//Gap between 2 stickies
		var padding = postItW * 0.3;
		console.log("padding:"+padding);
		this.padding = padding;

		//Finding the text size
		this.stickyFontSize = Math.floor(Math.sqrt((postItW * postItH * 0.5)/(this.longestPostItText)));
		console.log("longestPostItText:"+this.longestPostItText + "this.stickyFontSize:"+this.stickyFontSize);
		//Wrapping point 
		var wrapAt = paper_mainW - sticky_offsetX - padding - postItW;
		
		var stickyColor;

		//Creating Filter for shadow
		var f = this.paper_main.filter(Snap.filter.blur(padding/2,padding/4));
		this.filter = f;
		this.g_allSticky = this.paper_main.g();
		this.g_allSticky.attr({id: "g_allSticky"});
		

		for(var theme in this.catagorizedStickies){
			var cellActualY = cellY;
			console.log("==>"+theme);
			stickyColor = this.stickyColor[theme];
			for(var k = 0 ; k < this.catagorizedStickies[theme].length;k++){
				

				
				//Check if going out of bound
				if(cellX+postItW> wrapAt){
					cellX = paper_gridXEnd+sticky_offsetX+cellW;
					// cellY += cellH/2 - padding/2;
					cellY = sticky_y2;
				}

				//Intializing x1,x2, y1, y2 of sticky
				sticky_x1 =  cellX+padding;
				sticky_y1 =  cellY+padding;
				sticky_x2 =  sticky_x1+this.postItW;
				sticky_y2 =  sticky_y1+ this.postItH;

				//Pushing array of sticky info 
				array_sticky.push([sticky_x1,sticky_y1,sticky_x2,sticky_y2,parseFloat('0.0'),parseFloat('0.0')]);

				//Creating default transform property
				var defaultTransform = 'translate('+array_sticky[counter][4]+','+array_sticky[counter][5]+')';
				var defaultMatrix = 'matrix(1,0,0,1,'+array_sticky[counter][4]+','+array_sticky[counter][5]+')';

				//Creating innerHTML for the sticky
				var title =  "<strong>Title:</strong> "+ this.catagorizedStickies[theme][k]['title'];
				var author = "<strong>Speaker:</strong> "+ this.catagorizedStickies[theme][k]['speaker'];
				var htmlText = '<div xmlns="http://www.w3.org/1999/xhtml" style="color:black; font-size: '+this.stickyFontSize+'px">'
									+ title + '<br><br>' + author+ '</div>';

				//creating a group for group all elements of a sticky
				var g_sticky = this.paper_main.g().attr({
					id: "g_sticky"+counter,
					x: array_sticky[counter][0],
					y: array_sticky[counter][1],
					transform : defaultMatrix,
					tX:0, tY:0,
					stickyColor : stickyColor,
					htmlText: htmlText
				});
				// var svg_sticky = this.paper_main.svg(array_sticky[counter][0],array_sticky[counter][1],this.postItW+(padding/3),this.postItH+(padding/3)).attr({transform : defaultTransform});

				//Creating Sticky Shadow
				var sticky_shadow = this.paper_main.rect(array_sticky[counter][0]+(padding/this.shadowDepth),array_sticky[counter][1]+(padding/this.shadowDepth),this.postItW,this.postItH).attr({
					fill: this.shadowColor,
					filter: f
				});
				//Creating a sticky
				var sticky_1= this.paper_main.rect(array_sticky[counter][0],array_sticky[counter][1],this.postItW,this.postItH).attr({
					fill: stickyColor,
					transform : defaultMatrix
				});
				
				//Creating within  and svg
				// //Creating Sticky Shadow
				// var sticky_shadow = g_sticky.rect((padding/3),(padding/3),this.postItW,this.postItH).attr({fill: "gray", filter: f});
				// //Creating a sticky
				// var sticky_1= g_sticky.rect(0,0,this.postItW,this.postItH).attr({fill: stickyColor, transform : defaultTransform});
				// // console.log("Sticky Created at: "+array_sticky[counter][0] +": "+ array_sticky[counter][1] );





				// console.log("Sticky Created at: "+array_sticky[counter][0] +": "+ array_sticky[counter][1] );
				// var title = "Title: "+ this.catagorizedStickies[theme][k]['title'];
				// var sticky_text_title = this.paper_main.text(array_sticky[counter][0]+(padding/3),array_sticky[counter][1]+(padding/3),title).attr({fill: "Green", "font-size": "0.2em"});  
				// var fobjectSVG = '<svg x='+(array_sticky[counter][0]+(padding/3))+' y='+(array_sticky[counter][1]+(padding/3))+' width='+this.postItW+' height='+this.postItH+'><text fill="red">HI</text></svg>';
				// var svg_rect = svg_sticky.rect(0,0,10,10).attr({fill: "Green"});
				// var frag = Snap.parse(fobjectSVG);

				// var g = this.paper_main.append( frag );

				//Add sticky and shadow to group.
				g_sticky.add(sticky_shadow);
				g_sticky.add(sticky_1);
				// g_sticky.add(svg_sticky);
				


				//Creating a foreignObject which will have HTML wrappable text
				var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject'); //Create a path in SVG's namespace
					newElement.setAttribute('x', (array_sticky[counter][0]+(padding/3)));
       				newElement.setAttribute('y', (array_sticky[counter][1]+(padding/3)));
       				newElement.setAttribute('width',(this.postItW - (2*padding/3)));
       				newElement.setAttribute('height',(this.postItH - (2*padding/3)));

					newElement.innerHTML = htmlText;
				var nodeFobj = 	g_sticky.append(newElement);

				
				// g_sticky.add(frag);
				// g_sticky.add(sticky_text_title);
				// g_sticky.add(nodeFobj);

				// console.log("Following SVG Group is created: "+ JSON.stringify(g_sticky));
				//Pushing into sticky group object
				this.sticky_object_array.push(g_sticky);

				this.g_allSticky.add(g_sticky);

				// Move x, y
				cellX = sticky_x2;

				
				// console.log("cellX for next sticky of same theme:"+cellX);
				//Increase the counter
				counter++;
			}
			//Change themeReservoir
			//Reset X
			cellX = paper_gridXEnd+sticky_offsetX+cellW;
			cellY= cellActualY+cellH;
		}
		
	},


	createSnapPaper: function(){
		//Getting Main Window Pixel Value
		var mainDivW = this.mainDivW;
		var mainDivH = this.mainDivH;

		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		//Creating a snap paper.
		this.paper_main= new Snap(paper_mainW,paper_mainH).attr({ 
			viewBox: "0 0 "+ paper_mainW.toString()+ " "+ paper_mainH,
  			width:   mainDivW,
  			//height:  parseInt(2.6*grid, 10) // DONOT DELETE For future reference
  			height:  mainDivH,
  			// preserveAspectRatio: "xMinYMin meet" //For top left. Default is center.
  			// preserveAspectRatio: 'none'
		});

		//Add the snap container to the div
		this.element.appendChild(this.paper_main.node);
		// this.state.hello = "This will be saved in state!";
		// data.state.hello = this.state.hello;
	},

	createPartitions: function(){
		//Getting ends of grid section
		var paper_gridXEnd = this.paper_gridXEnd;
		var paper_gridYEnd = this.paper_gridYEnd;

		//Getting svg bounds
		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		//Drawing Rectangles for each section

		//Section 1: Grid
		this.rect_grid = this.paper_main.rect(0,0,paper_gridXEnd,paper_gridYEnd).attr({
			fill:        "rgba(68, 48, 255, 0.15)",
			stroke:      "rgba(68, 48, 255, 0.80)",
			strokeWidth: 3
		});

		//Section 2: Sticky
		this.rect_sticky = this.paper_main.rect(paper_gridXEnd,0,paper_mainW -paper_gridXEnd,paper_mainH).attr({
			fill:        "rgba(68, 48, 255, 0.15)",
			stroke:      "rgba(68, 48, 255, 0.80)",
			strokeWidth: 3
		});

		//Section 3: Control
		this.rect_control = this.paper_main.rect(0,paper_gridYEnd,paper_gridXEnd,paper_mainH - paper_gridYEnd).attr({
			fill:        "rgba(68, 48, 255, 0.15)",
			stroke:      "rgba(68, 48, 255, 0.80)",
			strokeWidth: 3
		});

		//Testing how gropping works
		this.g_partition = this.paper_main.g();
		this.g_partition.attr({ id: 'g_partition'});
		this.g_partition.add(this.rect_grid, this.rect_sticky, this.rect_control);

	},

	intializeGrid: function(){
		//Getting ends of grid section
		var paper_gridXEnd = this.paper_gridXEnd;
		var paper_gridYEnd = this.paper_gridYEnd;

		//Getting svg bounds
		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		var paper_tableX1 = paper_gridXEnd * 0.2;
		var paper_tableX2 = paper_gridXEnd *(1-0.05);
		var paper_tableY1 = paper_gridYEnd * 0.30;
		var paper_tableY2 = paper_gridYEnd*(1-0.05);

		var paper_tableW = paper_tableX2 - paper_tableX1;
		var paper_tableH = paper_tableY2 - paper_tableY1;


		//Creating table
		//Varibles for looping
		var i;
		var j;

		var cellW = paper_tableW/this.numberOfDays;
		var cellH = parseInt(Math.min(paper_tableH/this.numberOfRows, paper_tableW/this.numberOfColumns),10);
		cellW = cellH * this.numberOfHalls;
		// var cellH = paper_tableH/this.numberOfRows;

		//Creating group of headers
		this.g_gridHeaders = this.paper_main.g();
		this.g_gridHeaders.attr({ id: 'g_gridHeaders'});
		//Height of Day Headers
		var dayH = cellW*0.25;

		var cellX = paper_tableX1;
		var cellY = paper_tableY1 - cellH - dayH;

		//Find length of the partition line
		var partitionLength = cellY+dayH+(cellH*(this.numberOfRows+1));

		//Printing Day1, Day2 etc.
		for(var k = 0;k<this.numberOfDays;k++){
			var dayPartition = this.paper_main.line(cellX, cellY,cellX,partitionLength).attr({ stroke:"rgba(68, 48, 255, 0.80)", strokeWidth: 4});
			var headRect = this.paper_main.rect(cellX, cellY, cellW, dayH).attr({
				fill:        "rgba(68, 48, 255, 0.15)",
				stroke:      "rgba(68, 48, 255, 0.80)",
				strokeWidth: 3
				});
			var dayText = this.paper_main.text(cellX+(cellW*0.5),cellY+(dayH*0.5),"Day "+(k+1)+": "+this.array_days[k]+", "+this.array_dates[k]).attr({fill: "Green", "text-anchor" : "middle"});
			//Add header to the group
			this.g_gridHeaders.add(headRect);
			this.g_gridHeaders.add(dayPartition);
			this.g_gridHeaders.add(dayText);
			cellX += cellW;
		}
		//Drawing the last line and add it to the group
		var dayPartition = this.paper_main.line(cellX, cellY,cellX,partitionLength).attr({ stroke:"rgba(68, 48, 255, 0.80)", strokeWidth: 4});
		this.g_gridHeaders.add(dayPartition);


		//Holds the width and height of cell
		// cellW = paper_tableW/this.numberOfColumns;
		cellW = cellH;

		//UNCOMMENT 
		// cellH = parseInt(Math.min(paper_tableH/this.numberOfRows, cellW),10);

		var sessionW = cellW*2;



		cellX = paper_tableX1-sessionW;
		cellY = paper_tableY1;

		//Session
		for(var k = 0;k<this.numberOfSessions;k++){
			
			var sessionRect = this.paper_main.rect(cellX, cellY, sessionW, cellH).attr({
				fill:        "rgba(68, 48, 255, 0.15)",
				stroke:      "rgba(68, 48, 255, 0.80)",
				strokeWidth: 3
				});
			var sessionText = this.paper_main.text(cellX+(sessionW*0.5),cellY+(cellH*0.7),this.array_sessions[k]).attr({fill: "Green", "text-anchor" : "middle"});
			//Add header to the group
			this.g_gridHeaders.add(sessionRect);
			this.g_gridHeaders.add(sessionText);
			cellY += cellH;
		}
		
		//Halls
		//Holds location where the rectangle has to be created
		cellX = paper_tableX1;
		cellY = paper_tableY1-cellH;


		//Start the loop to print hall names
		for(var k = 0; k< this.numberOfColumns; k++){
			var hallRect = this.paper_main.rect(cellX, cellY, cellW, cellH).attr({
				fill:        "rgba(68, 48, 255, 0.15)",
				stroke:      "rgba(68, 48, 255, 0.80)",
				strokeWidth: 3
				});
			// var hallText = this.paper_main.text(cellX+(cellW*0.5),cellY+(cellH*0.7),"Hall "+(((k)%this.numberOfHalls)+1)).attr({fill: "Green", "text-anchor" : "middle", fontFamily: "Tahoma, Geneva, sans-serif"});
			var hallText = this.paper_main.text(cellX+(cellW*0.5),cellY+(cellH*0.7),this.array_halls[k%this.numberOfHalls]).attr({fill: "Green", "text-anchor" : "middle", fontFamily: "Tahoma, Geneva, sans-serif"});
			//Add header to the group
			this.g_gridHeaders.add(hallRect);
			this.g_gridHeaders.add(hallText);
			cellX += cellW;
		}

		//Print image rect
		var imgW = sessionW;
		var imgH = dayH+cellH;
		var imgX = paper_tableX1 - imgW;
		var imgY = paper_tableY1 - imgH;
		var imgRect = this.paper_main.rect(imgX, imgY, imgW, imgH).attr({
				fill:        "rgba(68, 48, 255, 0.15)",
				// stroke:      "rgba(68, 48, 255, 0.80)",
				stroke: "rgba(68, 48, 255, 0.80)",
				strokeWidth: 3
				});
		this.g_gridHeaders.add(imgRect);


		//Holds location where the rectangle has to be created
		cellX = paper_tableX1;
		cellY = paper_tableY1;

		//Set the global Holder Size
		this.holderW = cellW;
		this.holderH = cellH;

		//Create a group for grid cell
		this.g_gridcells = this.paper_main.g();
		this.g_gridcells.attr({ id : 'g_gridcells'})

		//Creating array of holders
		this.holder_object_array = [];
		var defaultTransform = 'translate(0,0)';
		var defaultMatrix = 'matrix(1,0,0,1,0,0)';
		var cellCounter = 0;
		//Loop that creates rectangles
		for(i = 0;i<this.numberOfRows;i++){
			for(j=0;j<this.numberOfColumns;j++ ){
				//For reference : Paper.rect(x,y,width,height,[rx],[ry])
				var cellRect = this.paper_main.rect(cellX, cellY, cellW, cellH).attr({
					id: "Holder_"+cellCounter,
					fill:        "rgba(68, 48, 255, 0.15)",
					stroke:      "rgba(68, 48, 255, 0.80)",
					strokeWidth: 2,
					transform: defaultMatrix,
					holdsSticky: ""
				});
				//Add the cell to group
				this.g_gridcells.add(cellRect);
				//Pusing the rect in holder
				this.holder_object_array.push(cellRect);
				//Update value of the x-coordinate
				cellX +=cellW;
				//Increase the counter value
				cellCounter++;
			}
			//Update value of the y-coordinate
			cellY += cellH;
			//Reset Value of x-coordinate
			cellX = paper_tableX1;
		}//End of loop that creates rectangles

	},

	intializeSticky: function(){
		//Getting ends of grid section
		var paper_gridXEnd = this.paper_gridXEnd;
		var paper_gridYEnd = this.paper_gridYEnd;

		//Getting svg bounds
		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		//Getting the size of sticky section
		var paper_stickyW = (paper_mainW - paper_gridXEnd) * 0.8;
		var paper_stickyH = paper_mainH * 0.8;

		//Creating table
		//Varibles for looping
		var sticky_offsetX = (paper_stickyW * 0.1);
		var sticky_offsetY = (paper_stickyH * 0.1);

		//Holds the width and height of cell

		var oldCellW = paper_stickyW/(this.stickyReservoirRatio+1); //Calculating the width of theme cell
		var cellW = oldCellW;
		// var cellH = paper_stickyH/this.numberOfThemes;
		var cellH = parseInt(Math.min(paper_stickyH/this.numberOfThemes,cellW*1.5),10);
		var stickyReservoirW = cellW * (this.stickyReservoirRatio);

		//Holds location where the rectangle has to be created
		var cellX = paper_gridXEnd + sticky_offsetX;
		var cellY = sticky_offsetY;

		//Creating group for theme headers
		this.g_themeHeaders = this.paper_main.g();
		this.g_themeHeaders.attr({ id: 'g_themeHeaders'});

		//Creating Theme headers
		for(var k = 0; k<this.numberOfThemes;k++){
			var themeRect = this.paper_main.rect(cellX, cellY, cellW, cellH).attr({
				fill:        "rgba(68, 48, 255, 0.15)",
				stroke:      "rgba(68, 48, 255, 0.80)",
				strokeWidth: 3
				});
			var  themeText = this.paper_main.text(cellX+(cellW*0.5),cellY+(cellH*0.5),this.themeNames[k]).attr({fill: "Green", "text-anchor" : "middle"});
			this.g_themeHeaders.add(themeRect);
			this.g_themeHeaders.add(themeText);
			cellY += cellH;
		}

		//Theme Reservoir Creation

		//Moving the X to right
		cellX += cellW;

		//Moving the Y back to top
		cellY = sticky_offsetY;

		//Changing the width of Theme Pool
		cellW = stickyReservoirW; 

		//Creating group for theme Reservoir
		this.g_themeReservoir = this.paper_main.g();
		this.g_themeReservoir.attr({id:'g_themeReservoir'});
		//Creating Theme Reservoirs
		for(var k = 0; k<this.numberOfThemes;k++){
			var themeRect = this.paper_main.rect(cellX, cellY, cellW, cellH).attr({
				fill:        "rgba(68, 48, 255, 0.15)",
				stroke:      "rgba(68, 48, 255, 0.80)",
				strokeWidth: 3
				});
			this.g_themeReservoir.add(themeRect)
			cellY += cellH;
		}

	},

	intializeControl: function(){
		//Getting ends of grid section
		var paper_gridXEnd = this.paper_gridXEnd;
		var paper_gridYEnd = this.paper_gridYEnd;

		//Getting svg bounds
		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		//Getting size of control section
		var paper_controlW = paper_gridXEnd;
		var paper_controlH = paper_mainH - paper_gridYEnd;

//		var g_button1 = this.paper_main.g();
//		var g_button2 = this.paper_main.g();
//		var g_button3 = this.paper_main.g();
	
		
		this.button_floorPlan = this.paper_main.rect(20,paper_gridYEnd+50,this.buttonW,this.buttonH).attr({
			fill: "#330099",
			stroke: "#ffffff"
		
		});

		this.text_floorPlan = this.paper_main.text(250,paper_gridYEnd+120, "View Floor plan").attr({fill: "Green", 'font-size':"50" ,"text-anchor" : "middle"});
		
		
//		this.g_button1.add(button_floorPlan);
		
		this.button_roomInfo = this.paper_main.rect(650,paper_gridYEnd+50,this.buttonW,this.buttonH).attr({
			fill: "#330099",
			stroke: "#ffffff"
		
		});
		
		this.text_floorPlan = this.paper_main.text(930,paper_gridYEnd+120, "View Room Information").attr({fill: "Green", 'font-size':"50" ,"text-anchor" : "middle"});
		
//		this.g_button2.add(button_roomInfo);

		this.button_displayDate = this.paper_main.rect(1300,paper_gridYEnd+50,this.buttonwidth,this.buttonH).attr({
			fill: "#330099",
			stroke: "#ffffff"
		
		});	
		var d= new Date();
		
		this.text_floorPlan = this.paper_main.text(1700,paper_gridYEnd+120, "Today is" +" "+ d.toDateString()).attr({fill: "Green", 'font-size':"50" ,"text-anchor" : "middle"});
		

//		this.g_button3.add(button_displayDate);		


	},

//<== Play Area ends

	load: function(date) {
		console.log('ConferenceScheduler> Load with state value', this.state.value);
		console.log("State:"+ JSON.stringify(data));
		this.refresh(date);
	},

	draw: function(date) {
		console.log('ConferenceScheduler> Draw with state value', this.state.value);
	},

	resize: function(date) {

		//Get the Window height and width
		var mainDivW = parseInt(this.element.style.width,  10);
		var mainDivH = parseInt(this.element.style.height, 10);

		//Calculating SVG viewport width and height
		//UPDATE REQUIRED: make sure the aspect ratio when the the window is resized, and refreshed.
		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		//Resizing the snap grid paper
		this.paper_main.attr({
  			width: mainDivW,
  			height: mainDivH
  		});

  		//Updating main window width and height 
		this.mainDivW = mainDivW;
		this.mainDivH = mainDivH;


		this.updatePositionTracker();

		//Refreshing
		this.refresh(date);
	},
	move: function(date) {
		this.refresh(date);
	},

	quit: function() {
		// Make sure to delete stuff (timers, ...)
	},

//==> Play Area
	// findStickyId: function(paperX,paperY){
	// 	var array_sticky_size = this.array_sticky.length;
	// 	console.log("Array length:"+array_sticky_size);
	// 	var i;
	// 	var result = null;
	// 	var array_sticky = this.array_sticky;
	// 	for(i=0;i<array_sticky_size;i++){
	// 		if(paperX >= array_sticky[i][0] && paperX < array_sticky[i][2] && paperY >= array_sticky[i][1] && paperY < array_sticky[i][3]){
	// 			result = i;
	// 			break;
	// 		}
	// 	}
	// 	return result;
	// },

	findStickyId: function(paperX,paperY){
		var result = null;
		var postItW = this.postItW;
		var postItH = this.postItH;
	
		for (var key in this.sticky_object_array) {
 			// console.log(">%^^^^$#%"+ JSON.stringify(this.sticky_object_array[key]));

 			//Get X and Y co-ordinates
 			var sticky_X = parseFloat(this.sticky_object_array[key].attr("x"));
 			var sticky_Y = parseFloat(this.sticky_object_array[key].attr("y"));

 			//Get Tranform values
			var transformString = this.sticky_object_array[key].attr().transform;
			// console.log("Total Rect sticky tranform matrix:"+transformString);
			// var tXY = transformString.split(',');
			// var tX = parseFloat(tXY[0].slice(1),10);
			// var tY = parseFloat(tXY[1],10);
			// console.log("TX:"+tX+"TY: "+tY);


			var currentMatrix = transformString.slice(7,-1).split("\,");
			// console.log("currentMatrix:" +currentMatrix);
     
      		for(var i=0; i<currentMatrix.length; i++) {
      			currentMatrix[i] = parseFloat(currentMatrix[i]);
      			// console.log("HI:"+ i+ " ->"+ JSON.stringify(currentMatrix[i]));
     		}

     		var scaleX = currentMatrix[0];
			var scaleY = currentMatrix[3];

   			// var tX = currentMatrix[4];
			// var tY = currentMatrix[5];
			var tX = parseFloat(this.sticky_object_array[key].attr("tX"));
 			var tY = parseFloat(this.sticky_object_array[key].attr("tY"));
			// console.log("TX:"+tX+"TY: "+tY);



			//Find resulting co ordinates by adding location and translation
			var rX = sticky_X+tX;
			var rY = sticky_Y+tY;
			


			//Find if the mouse click was on sticky
			if(paperX >= rX && paperX < rX+(postItW*scaleX) && paperY >= rY && paperY < rY+(postItH*scaleY)){
				result = key;
				break;
			}
			// console.log("**VSD**"+transformString);
			// console.log("tsdX:"+tX+ "tsdY: "+tY);

 		}

		return result;
	},


	findHolderId: function(paperX,paperY){
		var result = null;
		var holderW = this.holderW;
		var holderH = this.holderH;
		for (var key in this.holder_object_array) {
 			// console.log(">%^^^^$#%"+ JSON.stringify(this.sticky_object_array[key]));

 			//Get X and Y co-ordinates
 			var holder_X = parseFloat(this.holder_object_array[key].attr("x"));
 			var holder_Y = parseFloat(this.holder_object_array[key].attr("y"));
 			var holdsSticky = this.holder_object_array[key].attr("holdsSticky");
 			console.log("holdsSticky:"+holdsSticky);
 			//Get Tranform values
			var transformString = this.holder_object_array[key].attr().transform;
			// console.log("Total Rect holder tranform matrix:"+transformString);
			// var tXY = transformString.split(',');
			// var tX = parseFloat(tXY[0].slice(1),10);
			// var tY = parseFloat(tXY[1],10);

			// console.log("TX:"+tX+"TY: "+tY);

			var currentMatrix = transformString.slice(7,-1).split("\,");
			// console.log("currentMatrix:" +currentMatrix);
     
      		for(var i=0; i<currentMatrix.length; i++) {
      			currentMatrix[i] = parseFloat(currentMatrix[i]);
      			// console.log("HI:"+ i+ " ->"+ JSON.stringify(currentMatrix[i]));
     		}

     		var tX = currentMatrix[4];
			var tY = currentMatrix[5];
			// console.log("TX:"+tX+"TY: "+tY);


			//Find resulting co ordinates by adding location and translation
			var rX = holder_X+tX;
			var rY = holder_Y+tY;

			//Find if the mouse click was on sticky
			if(paperX >= rX && paperX < rX+holderW && paperY >= rY && paperY < rY+holderH){
				// console.log("Found Sticky");
				// if(holdsSticky == null){
					// console.log("FALSE");
					if(holdsSticky != null){ console.log("Holds Following sticky:"+holdsSticky);}
					result = key;
				// }
				break;
			}
			// console.log("**VSD**"+transformString);
			// console.log("tsdX:"+tX+ "tsdY: "+tY);

 		}

		return result;
	},


	updatePositionTracker: function() {

		var mainDivW = this.mainDivW;
		var mainDivH = this.mainDivH;
	
		var orgMainDivW = this.orgMainDivW;
		var orgMainDivH = this.orgMainDivH;


		//Can remove this, but keep it, incase of any bug in future
		// this.paper_gridXEnd = this.paper_mainW * this.gridWRatio;
		// this.paper_gridYEnd = this.paper_mainH * this.gridHRatio;
		
		//Getting ends of grid section
		var paper_gridXEnd = this.paper_gridXEnd;
		var paper_gridYEnd = this.paper_gridYEnd;

		//Getting svg bounds
		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		//Getting the size of sticky section
		var paper_stickyW = paper_mainW - paper_gridXEnd;
		var paper_stickyH = paper_mainH;

		//Getting size of control
		var paper_controlW = paper_gridXEnd;
		var paper_controlH = paper_mainH - paper_gridYEnd;

		// var x = position.x;
		// var y = position.y;

		var workablePixelW;
		var workablePixelH;

		var originalHWRatio = orgMainDivH/orgMainDivW;

		var newHWRatio = mainDivH/mainDivW;

		var offsetWorkZoneX = 0;
		var offsetWorkZoneY = 0;

		if(newHWRatio<originalHWRatio){
			// console.log("Width has Black Patch");
			var newHtoOldHRatio = mainDivH/orgMainDivH;

			workablePixelW = orgMainDivW*newHtoOldHRatio;
			workablePixelH = mainDivH;

			var offsetPixelX = (mainDivW - workablePixelW)/2;
			offsetWorkZoneX = (offsetPixelX/workablePixelW) * paper_mainW;
			offsetWorkZoneY = 0;
		}
		else if(newHWRatio>originalHWRatio){
			// console.log("Height has Black Patch");
			var newWtoOldWRatio = mainDivW/orgMainDivW;

			workablePixelW = mainDivW;
			workablePixelH = orgMainDivH*newWtoOldWRatio;
			
			var offsetPixelY = (mainDivH - workablePixelH)/2;
			offsetWorkZoneX = 0;
			offsetWorkZoneY = (offsetPixelY/workablePixelH) * paper_mainH;
		}
		else{
			console.log("No Black Patch");
			workablePixelW = mainDivW;
			workablePixelH = mainDivH;
		}

		//Update the global values
		this.workablePixelW = workablePixelW;
		this.offsetWorkZoneX = offsetWorkZoneX;
		this.workablePixelH = workablePixelH;
		this.offsetWorkZoneY = offsetWorkZoneY;

	},



//End of Play Area



	event: function(eventType, position, user, data, date) {
		var emptyArray = [0,0,0,0];

		var mainDivW = this.mainDivW;
		var mainDivH = this.mainDivH;
		//=>Added
		var orgMainDivW = this.orgMainDivW;
		var orgMainDivH = this.orgMainDivH;

		var offsetW = ((mainDivW - orgMainDivW)/2)/mainDivW * paper_mainW;
		var offsetH = ((mainDivH - orgMainDivH)/2)/mainDivH * paper_mainH;

		this.paper_gridXEnd = this.paper_mainW * this.gridWRatio;
		this.paper_gridYEnd = this.paper_mainH * this.gridHRatio;
		//<==
		//Getting ends of grid section
		var paper_gridXEnd = this.paper_gridXEnd;
		var paper_gridYEnd = this.paper_gridYEnd;

		//Getting svg bounds
		var paper_mainW = this.paper_mainW;
		var paper_mainH = this.paper_mainH;

		//Getting the size of sticky section
		var paper_stickyW = paper_mainW - paper_gridXEnd;
		var paper_stickyH = paper_mainH;

		//Getting size of control
		var paper_controlW = paper_gridXEnd;
		var paper_controlH = paper_mainH - paper_gridYEnd;

		var x = position.x;
		var y = position.y;

		//Gett the work zone and offset
		var workablePixelW = this.workablePixelW;
		var workablePixelH = this.workablePixelH;

		var offsetWorkZoneX = this.offsetWorkZoneX;
		var offsetWorkZoneY = this.offsetWorkZoneY;


		//Converting real co-ordinates to paper co-ordinates
		var paperX = ((x/workablePixelW) * paper_mainW) - offsetWorkZoneX;
		var paperY = ((y/workablePixelH) * paper_mainH) - offsetWorkZoneY;

		// //Converting real co-ordinates to paper co-ordinates
		//This works in case the aspect ratio will be locked. i.e. No Black area in width or height
		// var paperX = (x/mainDivW) * paper_mainW;
		// var paperY = (y/mainDivH) * paper_mainH;

		//Creating a new user object if it doesnot exists
		if (this.userInteraction[user.id] === undefined) {
			this.userInteraction[user.id] = {dragging: false, position: {x: 0, y: 0, tX: 0, tY: 0}, stickyId: null,stickyPast: emptyArray};
		}

		if (eventType === "pointerPress" && (data.button === "left")) {
			// console.log("Width:=>"+mainDivW);
			this.paper_main.rect(paperX,paperY,10,10).attr({id: 'touch', stroke: 'Green', fill: 'rgba(12,13,44,0.1)'});

			console.log("Mouse Clicked at: ("+paperX+"),("+paperY+") User:"+ JSON.stringify(user));

			// console.log("User:"+JSON.stringify(user));


			// if( paperX >= 0 && paperX < paper_gridXEnd && paperY>=0 && paperY<=paper_gridYEnd){ // Grid Section
			// 	console.log("Clicked in Grid Section("+ x + ","+ y +")");
			// 	// var holderId = this.findHolderId(paperX,paperY);
			// 	// console.log("Returned: "+ holderId);
			// 	// // if(stickyId != null){
			// 	// // console.log("")}
			// }
			// else if(paperX >= paper_gridXEnd && paperX < paper_mainW && paperY>=0 && paperY<=paper_mainH){ // Sticky Section
				//Grid section or sticky section
			if(( paperX >= 0 && paperX < paper_gridXEnd && paperY>=0 && paperY<=paper_gridYEnd) ||  (paperX >= paper_gridXEnd && paperX < paper_mainW && paperY>=0 && paperY<=paper_mainH)){
				console.log("Clicked in Sticky Section("+ x+ ","+ y +")");

				var stickyId = this.findStickyId(paperX,paperY);
				console.log("Returned: "+ stickyId);
				if(stickyId != null){
					console.log("Not Null");
					var holderId = this.findHolderId(paperX,paperY);
					console.log("Returned: "+ holderId);

					if(holderId != null){
						var hoS = this.holder_object_array[holderId].attr("holdsSticky");
						if( hoS != null){
							this.holder_object_array[holderId].attr({
								holdsSticky: ""
							});
						}
					}
					this.userInteraction[user.id].dragging = true;
					// this.userInteraction[user.id].position.x = position.x; //DONOT DELETE X  and Y from user were never used.
					// this.userInteraction[user.id].position.y = position.y;
					this.userInteraction[user.id].position.x = paperX;
					this.userInteraction[user.id].position.y = paperY;
					this.userInteraction[user.id].stickyId = stickyId;

					//Get X and Y co-ordinates
 					var sticky_X = parseFloat(this.sticky_object_array[stickyId].attr("x"));
 					var sticky_Y = parseFloat(this.sticky_object_array[stickyId].attr("y"));
//-------->
 					var transX = parseFloat(this.sticky_object_array[stickyId].attr("tX")) - this.postItW;
 					var transY = parseFloat(this.sticky_object_array[stickyId].attr("tY")) - this.postItH;

	//------>^^^^^
		//Creating default transform property
				var shadowColor = user.color;
				var padding = this.padding; 
				
				// var defaultMatrix = 'matrix(1,0,0,1,'+transX+','+transY+')';
				var defaultMatrix = 'matrix(1,0,0,1,0,0)';
				var stickyColor = this.sticky_object_array[stickyId].attr("stickyColor");
				var f = this.filter;
				var htmlText = this.sticky_object_array[stickyId].attr("htmlText");
				console.log("HTML TEXT:"+htmlText);
				//creating a group for group all elements of a sticky
				var g_sticky = this.paper_main.g().attr({
					id: "g_sticky"+stickyId,
					x: sticky_X,
					y: sticky_Y,
					transform : defaultMatrix,
					tX:transX, tY:transY,
					stickyColor: stickyColor,
					htmlText: htmlText
				});
				
				// var svg_sticky = this.paper_main.svg(array_sticky[counter][0],array_sticky[counter][1],this.postItW+(padding/3),this.postItH+(padding/3)).attr({transform : defaultTransform});

				//Creating Sticky Shadow
				var sticky_shadow = this.paper_main.rect(sticky_X+(padding/this.shadowDepth),sticky_Y+(padding/this.shadowDepth),this.postItW,this.postItH).attr({
					fill: this.shadowColor,
					filter: f
				});
				//Creating a sticky
				var sticky_1= this.paper_main.rect(sticky_X,sticky_Y,this.postItW,this.postItH).attr({
					fill: stickyColor,
					transform : defaultMatrix
				});
				
			
				//Add sticky and shadow to group.
				g_sticky.add(sticky_shadow);
				g_sticky.add(sticky_1);
				// var title =  "<strong>Title:</strong> "+ this.catagorizedStickies[theme][k]['title'];
				// var author = "<strong>Speaker:</strong> "+ this.catagorizedStickies[theme][k]['speaker'];
				// var htmlText = '<div xmlns="http://www.w3.org/1999/xhtml" style="color:black; font-size: 5px">'
				// 					+ title + '<br><br>' + author+ '</div>';


				//Creating a foreignObject which will have HTML wrappable text
				var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject'); //Create a path in SVG's namespace
					newElement.setAttribute('x', (sticky_X+(padding/3)));
       				newElement.setAttribute('y', (sticky_Y+(padding/3)));
       				newElement.setAttribute('width',(this.postItW - (2*padding/3)));
       				newElement.setAttribute('height',(this.postItH - (2*padding/3)));

					newElement.innerHTML = htmlText;
				var nodeFobj = 	g_sticky.append(newElement);

			
				this.sticky_object_array[stickyId].remove();
				delete this.sticky_object_array[stickyId];

				this.sticky_object_array[stickyId] = g_sticky;
				this.g_allSticky.add(g_sticky);

				
	//<------^^^^^

					var scaleX = 2;
					var scaleY = 2;
					var myMatrix = new Snap.Matrix();
					myMatrix.scale(scaleX,scaleY);            // play with scaling before and after the rotate 
					// myMatrix.translate((((transX-sticky_X) - ((transX-sticky_X)/3))),0);
					// myMatrix.translate(scaTraX,0);
					myMatrix.translate(-(sticky_X-(sticky_X/scaleX))+(transX/scaleX),-(sticky_Y-(sticky_Y/scaleY))+(transY/scaleY));

						this.sticky_object_array[stickyId].attr({
						transform: myMatrix
						});
						console.log("ATTribute:"+ this.sticky_object_array[stickyId].attr().transform);

//<-------



 					//Get Tranform values
					// var transformString = this.sticky_object_array[stickyId].attr("transform")+'';
					// var tXY = transformString.split(',');
					// var tX = parseFloat(tXY[0].slice(1),10);
					// var tY = parseFloat(tXY[1],10);

					//Get Tranform values
					var transformString = this.sticky_object_array[stickyId].attr().transform;
					// console.log("Total Rect holder tranform matrix:"+transformString);

					var currentMatrix = transformString.slice(7,-1).split("\,");
					console.log("currentMatrix:" +currentMatrix);
     
      				for(var i=0; i<currentMatrix.length; i++) {
      					currentMatrix[i] = parseFloat(currentMatrix[i]);
      					// console.log("HI:"+ i+ " ->"+ JSON.stringify(currentMatrix[i]));
     				}

     				var tX = currentMatrix[4];
					var tY = currentMatrix[5];
					// console.log("TX:"+tX+"TY: "+tY);



					this.userInteraction[user.id].stickyPast[0] = sticky_X;
					this.userInteraction[user.id].stickyPast[1] = sticky_Y;
					this.userInteraction[user.id].stickyPast[2] = tX;
					this.userInteraction[user.id].stickyPast[3] = tY;
					// //Get Tranform values
					// var transformString = this.sticky_object_array[stickyId].attr("transform")+'';
					// var tXY = transformString.split(',');
					// var tX = parseFloat(tXY[0].slice(1),10);
					// var tY = parseFloat(tXY[1],10);



					// console.log("User: ->"+ JSON.stringify(this.userInteraction[user.id]));
					// console.log("****"+transformString);
					// console.log("tX:"+tX+ "tY: "+tY);


					// this.userInteraction[user.id].position.tX = tX;
					// this.userInteraction[user.id].position.tY = tY;

					// this.sticky_array[stickyId][4] =tX;
					// this.sticky_array[stickyId][5] = tY;


				}
				//Printing All users
				// for(key in this.userInteraction){
				// 	console.log("User: "+ key + "->"+ JSON.stringify(this.userInteraction[key]));
				// }

			}
			else if(paperX >= 0 && paperX < paper_controlW && paperY >=paper_gridYEnd && paperY <=paper_mainH){ // Control Section
				console.log("Clicked in Control Section("+ x + ","+ y +")");
				
				// var offsetY = 0.15 * paper_controlH; //0.15 is half of 0.3 which is 1 - 0.70
				if(paperX >= 20 && paperX < this.buttonW+20 && paperY >= 50+paper_gridYEnd  && paperY < paper_gridYEnd+this.buttonH+50){
					console.log("ButtonClicked ("+ paperX + ","+ paperY +")");
					console.log(5+6);
		
	
					var xS = this.sticky_object_array[12].attr("x");
					var yS = this.sticky_object_array[12].attr("y");
					console.log("xS:"+xS);
					console.log("yS:"+yS);


					if(this.toggle == true){
					this.image_floorPlan = this.paper_main.image(this.resrcPath +"info.png",(this.paper_mainW/4),(this.paper_mainH/4),(this.paper_mainW/2),(this.paper_mainH/2));
						

						this.toggle = false;
					}
					else{
					this.image_floorPlan.remove();		
					this.toggle = true;
					}
					// this.sticky_object_array[12].attr({
					// 	transform: 'translate(-'+xS+',0)'
					// });
					// console.log("Modified: ===>"+ JSON.stringify(this.sticky_object_array[12]));
					console.log("done");
				}

if(paperX >= 650 && paperX < this.buttonW+650 && paperY >= 50+paper_gridYEnd  && paperY < paper_gridYEnd+this.buttonH+50){
					console.log("ButtonClicked ("+ paperX + ","+ paperY +")");
					console.log(5+6);
		
	
					var xS = this.sticky_object_array[12].attr("x");
					var yS = this.sticky_object_array[12].attr("y");
					console.log("xS:"+xS);
					console.log("yS:"+yS);


					if(this.toggle == true){
					this.image_floorPlan = this.paper_main.image(this.resrcPath +"info.png",(this.paper_mainW/4),(this.paper_mainH/4),(this.paper_mainW/2),(this.paper_mainH/2));
						

						this.toggle = false;
					}
					else{
					this.image_floorPlan.remove();		
					this.toggle = true;
					}
					// this.sticky_object_array[12].attr({
					// 	transform: 'translate(-'+xS+',0)'
					// });
					// console.log("Modified: ===>"+ JSON.stringify(this.sticky_object_array[12]));
					console.log("done");
				}






 
			} 
			else{
				console.log("Clicked outside zone");
			}


		}
		// else if (eventType === "pointerMove" && this.dragging) {
		else if (eventType === "pointerMove") {
			// console.log("moving pointer");
			if(this.userInteraction[user.id].dragging){
				console.log("Dragging");
				var sid = this.userInteraction[user.id].stickyId;
				var stickyPast = this.userInteraction[user.id].stickyPast;
				//Get X and Y co-ordinates
 				var sticky_X = stickyPast[0];
 				var sticky_Y = stickyPast[1];

 			// 	//Get Tranform values
				// var tX = stickyPast[2];
				// var tY = stickyPast[3];

				// //Find old coordinates by adding location and translation
				// var rX = sticky_X+tX;
				// var rY = sticky_Y+tY;

				// console.log("RX:"+rX+" : RY: "+ rY);






				// var sid = this.userInteraction[user.id].stickyId;
				// var sOldX = this.array_sticky[sid][0]; //Get X coordinate of the sticky's location
				// var sOldY = this.array_sticky[sid][1]; //Get Y coordinate of the sticky's location

				// var tOldX = this.array_sticky[sid][4];
				// var tOldY = this.array_sticky[sid][5];

				// console.log("TransX:"+ transX+" TransY: "+transY);
				var transX = paperX - sticky_X - this.postItW;
				var transY = paperY - sticky_Y- this.postItH;


				// this.array_sticky[sid][4] = transX;
				// this.array_sticky[sid][5] = transY;

				// //Get translate property of the sticky
				// var attr1 =  this.sticky_object_array[sid].attr("transform")+'';
				// console.log("<><><>:"+attr1);
				// var tOldXY = attr1.split(',');
				// var tOldX = parseInt(tOldXY[0].slice(1),10);
				// var tOldY = parseInt(tOldXY[1],10);
				// console.log("solx:"+sOldX+" solY: "+sOldY);
				console.log("Vishaltranx:"+transX+" TolY: "+transY);


				// console.log("Old X:"+sidOldX+" Old Y:"+sidOldY+" New X: " + paperX + " New Y: "+ paperY );
				// console.log("Translate X:" + transX + " Translate Y:"+ transY);
				var myMatrix = new Snap.Matrix();
				// myMatrix.scale(scaleX,scaleY);            // play with scaling before and after the rotate 
					// myMatrix.translate((((transX-sticky_X) - ((transX-sticky_X)/3))),0);
					// myMatrix.translate(scaTraX,0);
				myMatrix.translate(transX,transY);
					// myMatrix.translate(0,transY);


				this.sticky_object_array[sid].attr({
					transform: myMatrix
				});



				// this.sticky_object_array[sid].attr({
				// 		transform: 'translate('+transX+','+transY+')'
				// 	});
				// console.log("GROUP OBJECT"+JSON.stringify(this.sticky_object_array[sid].parent().attr('transform')));
				// console.log("StickyRECT OBJECT"+JSON.stringify(this.sticky_object_array[sid].attr('transform')));
			}
		}
		else if (eventType === "pointerRelease" && (data.button === "left")) {
			if(this.userInteraction[user.id].dragging){
				//Update the new coordinates of the sticky
				var sid = this.userInteraction[user.id].stickyId;
				// this.array_sticky[sid][0] = paperX;
				// this.array_sticky[sid][1] = paperY;
				// this.array_sticky[sid][2] = paperX + this.postItW; //Updateing X2 and Y2
				// this.array_sticky[sid][3] = paperY + this.postItH;
				var holderId = this.findHolderId(paperX-this.postItW,paperY-this.postItH);
				console.log("Returned: "+ holderId);
				
				if(holderId == null){
					
					// this.sticky_object_array[sid].attr({
					// 	transform: 'translate(0,0)'
					// });
					var myMatrix = new Snap.Matrix();
					myMatrix.translate(0,0);
					this.sticky_object_array[sid].attr({
						transform: myMatrix,
						tX: 0,
						tY: 0
					});

				}
				else{
					var hoS = this.holder_object_array[holderId].attr("holdsSticky");
					if(hoS != null){
						console.log("Holds Sticky: "+hoS);
						var myMatrix = new Snap.Matrix();
						myMatrix.translate(0,0);
						this.sticky_object_array[sid].attr({
							transform: myMatrix,
							tX: 0,
							tY: 0
						});
					}
					else{
						var stickyPast = this.userInteraction[user.id].stickyPast;
						//Get X and Y co-ordinates
	 					var sticky_X = stickyPast[0];
	 					var sticky_Y = stickyPast[1];
						var hX = parseFloat(this.holder_object_array[holderId].attr("x"));
						var hY = parseFloat(this.holder_object_array[holderId].attr("y"));
						var transX = hX - sticky_X;
						var transY = hY - sticky_Y;
						console.log("transX: "+transX);
						console.log("transY: "+transY);


						var scaleX = this.holderW/this.postItW;
						console.log("Scale X Ratio:"+scaleX);

						var scaleY = this.holderH/this.postItH;
						console.log("Scale Y Ratio:"+scaleY);

						// var scaTraX = (transX-sticky_X) - ((transX-sticky_X)/3);
						console.log("Sticky X:"+sticky_X);
						var scaTraX = transX - ((sticky_X)/3);
						// console.log("scaTraX:"+scaTraX);
						//Translate and Scale 
						// this.sticky_object_array[sid].attr({
						// 	transform: 'scale('+scaTraX+',1) translate('+scaTraX+','+transY+')'
						// });

						// //Working
						// this.sticky_object_array[sid].attr({
						// 	transform: 'scale(2,1) translate('+((transX-sticky_X) - ((transX-sticky_X)/2))+','+transY+')'
						// });


						// this.sticky_object_array[sid].attr({
						// 	transform: 'scale(3,1) translate('+(transX-((sticky_X)-(sticky_X/3)))+','+transY+')'
						// });

						// this.sticky_object_array[sid].attr({
						// 	transform: 'translate('+transX+','+transY+')'
						// }); //DONOT DELETE . this works if scaling of sticky not required.



						var myMatrix = new Snap.Matrix();
						myMatrix.scale(scaleX,scaleY);            // play with scaling before and after the rotate 
						// myMatrix.translate((((transX-sticky_X) - ((transX-sticky_X)/3))),0);
						// myMatrix.translate(scaTraX,0);
						myMatrix.translate(-(sticky_X-(sticky_X/scaleX))+(transX/scaleX),-(sticky_Y-(sticky_Y/scaleY))+(transY/scaleY));
						// myMatrix.translate(0,transY);


						this.sticky_object_array[sid].attr({
							transform: myMatrix,
							// Updating tX and tY on the group
							tX: transX,
							tY: transY
						});

						console.log("ATTR:"+this.sticky_object_array[sid].attr().transform);
						this.holder_object_array[holderId].attr({
							holdsSticky: sid
						});
						console.log("HOLDER:"+this.holder_object_array[holderId].attr("holdsSticky"));

						// console.log("HOLDER: "+ )

					}

				}



				console.log("Mouse Before: ->"+ JSON.stringify(this.userInteraction[user.id]));
				this.userInteraction[user.id].dragging = false;
				this.userInteraction[user.id].stickyId = null;
				this.userInteraction[user.id].stickyPast = emptyArray;
				// this.userInteraction[user.id].stickyId[1] = '0';
				// this.userInteraction[user.id].stickyId[2] = '0';
				// this.userInteraction[user.id].stickyId[3] = '0';
				//console.log("Dropped Sticky at: "+this.array_sticky[sid][0]+" , "+this.array_sticky[sid][1]+" And Translate at : " + this.array_sticky[sid][4] + " , " + this.array_sticky[sid][5]);
				console.log("Mouse Released: ->"+ JSON.stringify(this.userInteraction[user.id]));
			}
		}

		// Scroll events for zoom
		else if (eventType === "pointerScroll") {

			var stickyId = this.findStickyId(paperX,paperY);
				console.log("Returned: "+ stickyId);
				if(stickyId != null){
					console.log("Not Null");
					var xS = this.sticky_object_array[stickyId].attr("x");
					var yS = this.sticky_object_array[stickyId].attr("y");
					console.log("xS:"+xS);
					console.log("yS:"+yS);


					if(this.toggle == true){
						var myMatrix = new Snap.Matrix();
						myMatrix.scale(3.5,1);            // play with scaling before and after the rotate 
						// myMatrix.translate(-(xS-(xS/2)),0);
						myMatrix.translate(-(xS-(xS/3.5))+(-10),0);
						// myMatrix.translate(10,0);

						this.sticky_object_array[stickyId].attr({
						transform: myMatrix
						});
						console.log("ATTribute:"+ this.sticky_object_array[stickyId].attr().transform);
						this.toggle = false;
					}
					else{
						var myMatrix = new Snap.Matrix();
						myMatrix.scale(1,1);
						myMatrix.translate(0,0); //Not required

						this.sticky_object_array[stickyId].attr({
						transform: myMatrix
						});
						console.log("ATTribute:"+ JSON.stringify(this.sticky_object_array[stickyId]));
						var child = document.getElementById("g_sticky12").childNodes;
						console.log("ATTribute:"+ JSON.stringify(child));
						this.toggle = true;
					}
					
				}

		}
		else if (eventType === "widgetEvent"){
		}
		else if (eventType === "keyboard") {
			if (data.character === "m") {
				console.log("Pressed M");
				this.state.val2 = 10;
				// this.refresh(date);
			}
			else if (data.character === "z") {
				var stickyId = this.findStickyId(paperX,paperY);
				console.log("Returned: "+ stickyId);
				if(stickyId != null){
					console.log("Not Null");
					
					//Get X and Y co-ordinates
 					var sticky_X = parseFloat(this.sticky_object_array[stickyId].attr("x"));
 					var sticky_Y = parseFloat(this.sticky_object_array[stickyId].attr("y"));
					var transX = parseFloat(this.sticky_object_array[stickyId].attr("tX"));
 					var transY = parseFloat(this.sticky_object_array[stickyId].attr("tY"));
					var scaleX = 2;
					var scaleY = 2;
					var myMatrix = new Snap.Matrix();
					myMatrix.scale(scaleX,scaleY);            // play with scaling before and after the rotate 
					// myMatrix.translate((((transX-sticky_X) - ((transX-sticky_X)/3))),0);
					// myMatrix.translate(scaTraX,0);
					myMatrix.translate(-(sticky_X-(sticky_X/scaleX))+(transX/scaleX),-(sticky_Y-(sticky_Y/scaleY))+(transY/scaleY));

						this.sticky_object_array[stickyId].attr({
						transform: myMatrix
						});
						console.log("ATTribute:"+ this.sticky_object_array[stickyId].attr().transform);

			}
		}
	}
		else if (eventType === "specialKey") {
			if (data.code === 37 && data.state === "down") { // left
				this.refresh(date);
			}
			else if (data.code === 38 && data.state === "down") { // up
				this.refresh(date);
			}
			else if (data.code === 39 && data.state === "down") { // right
				this.refresh(date);
			}
			else if (data.code === 40 && data.state === "down") { // down
				this.refresh(date);
			}
		}
	}
});
