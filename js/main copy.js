(function (window) {

	function Main(){
        console.log("intialize main");
        
        this.timeStart;
        this.timeEnd;
        this.ajaxUrl = "http://comcat.cr.usgs.gov/fdsnws/event/1/query";
        this.ajaxQueryData = { "starttime" : "", "orderby" : "time-asc", "format" : "geojson"};
        this.ajaxCallback = "eqfeed_callback";
        this.jqxhr;
        this.responseData;
        this.responseMetadata;
        this.responseFeatures;
        this.timeInt = 30000;
        this.svg;
        this.circleGroup;
        this.svgWidth = 1000;
        this.svgHeight = 645;
        this.marginTop = 40;
        this.marginLeft = 40;
        this.marginRight = 220;
        this.marginBottom = 20;
        this.xAxis;
        this.yAxis;
        this.xScale;
        this.yScale;
        this.plotRadius = 3;
        this.root = $("#wrapper");
        
	};

    Main.prototype.getData = function(){
        var instance = this;
        
        console.log(instance.jqxhr);
        console.log("get data");        
        instance.jqxhr = $.ajax({
            cache: true,
            data: instance.ajaxQueryData,
            dataType: "jsonp",
            jsonpCallback: instance.ajaxCallback,
            url: instance.ajaxUrl
        }).done(function(data){
            console.log("jqxhr done");
            instance.responseData = data;
            instance.responseMetadata = data.metadata;
            instance.responseFeatures = data.features;
            console.log("Raw data returned");
            console.log(instance.responseData); //?
            instance.jqxhr = undefined;

        }).fail(function(data){
            alert("load failed");
        });        
    };

    Main.prototype.getTime = function(){
        instance = this;

        var a,b,d;
        d = new Date();
        
        console.log(d.toISOString());
        instance.timeStart = d.getTime(); //x axis start range in ms
        console.log(instance.timeStart);
        console.log(d.toISOString(instance.timeStart));
        a = d.getUTCDate() -1;
        b = d.setUTCDate(a);
        instance.timeEnd = d.getTime(b); // x axis end range in ms
        console.log(instance.timeEnd);
        console.log(d.toISOString(instance.timeEnd));
        instance.ajaxQueryData.starttime = d.toISOString(d.setUTCDate(a)); //x axis start range in ISO format
        console.log(Date(b));
        console.log(instance.ajaxQueryData);
        
    };
    
    Main.prototype.polling = function(){
        var instance = this;
        
        console.log("polling data");
        setInterval(function(){
            console.log("setting interval");
            instance.getTime();
            instance.getData();

            instance.jqxhr.done(function(){        
                instance.VizUpdate();
                instance.VizEnter();
                instance.VizExit();
            });
        }, instance.timeInt);
    };
    
    Main.prototype.create = function(){
        var instance = this;
        
        console.log("create html");
        $("<h2/>").appendTo(instance.root);
        
    };
    
    Main.prototype.distributeContent = function(){
        var instance = this;
        
        console.log("distribute content");
        instance.root.find("h2").text(instance.responseMetadata.title);

    };
    
    Main.prototype.Viz = function(){
        var instance = this;
        //var xAxis = instance.createXAxis();
        //var yAxis = instance.createYAxis();
        console.log("Viz");
        
        instance.svg = d3.select("#wrapper")
            .append("svg")
            .attr("class", "chart")
            .attr("width", instance.svgWidth)
            .attr("height", instance.svgHeight)
            .append("g")
            .attr("width", instance.svgWidth - instance.marginLeft)
            .attr("height", instance.svgHeight - instance.marginTop)
            .attr('transform', 'translate(' + instance.marginLeft + ', ' + instance.marginTop + ')');

        //instance.createXAxis();
        //instance.createYAxis();
    };

    Main.prototype.createXAxis = function(){
        var instance = this;        
                
        var axis = d3.svg.axis()
            .scale(instance.xScale)
            .orient('bottom')
            .ticks(d3.time.hours, 4)
            .tickFormat(d3.time.format("%m/%d/%y - %H:00"))
            .tickSize(1)
            .tickPadding(8);

            instance.svg.append("g")
            .attr("class", "x axis")
            .attr('transform', 'translate(0,' + (instance.svgHeight - (instance.marginTop + instance.marginBottom + 1)) + ')')
            .call(axis);
            
    };
    
    Main.prototype.createXScale = function(){
        var instance = this;

        instance.xScale = d3.time.scale()
            .domain([instance.timeEnd, instance.timeStart])
            .range([0, instance.svgWidth - (instance.marginLeft + instance.marginRight)]);
        
    };

    Main.prototype.createYAxis = function(){
        var instance = this;
                
        var axis = d3.svg.axis()
            .scale(instance.yScale)
            .orient('left')
            .ticks(20)
            .tickSize(1)
            .tickPadding(4);

        instance.svg.append("g")
        .attr("class", "y axis")
        .attr('transform', 'translate(0, -' + instance.marginBottom + ')')
        .call(axis);
    };

    Main.prototype.createYScale = function(){
        var instance = this;

        instance.yScale = d3.scale.linear()
            .domain([0, 8])
            .range([instance.svgHeight - instance.marginTop, 0]);
    };
    
    Main.prototype.VizEnter = function(){
        var instance = this;
        
        console.log("Viz Enter");
        console.log(instance.circleGroup); //?
        instance.circleGroup.enter()
        .append("circle")
        .attr("cx", function(data){
            return instance.xScale(data.properties.time);
        })
        .attr("cy", function(data){
            return instance.yScale(data.properties.mag) - instance.marginBottom;
        })
        .attr("r", instance.plotRadius)
        .on("mouseover", function(data){
            var format = d3.time.format("%m/%d/%y - %X");
            var d = new Date(data.properties.time);
            var cx = d3.select(this).attr("cx");
            var cy = d3.select(this).attr("cy");
            
            instance.svg.append("g")
            .attr("class", "tip")
            .attr("transform", "translate(" + (parseFloat(d3.select(this).attr("cx")) + 4) + "," + (d3.select(this).attr("cy") - 12) + ")")            
            .append("polygon")
            .attr("fill", "#aaaaaa")
            .attr("stroke", "#000000")
            .attr("points", function(data){
                /*
                var x1,x2,x3,y1,y2,y3;
                
                x1 = instance.xScale(data.properties.time);
                x2 = instance.xScale(data.properties.time) + 12;
                x3 = instance.xScale(data.properties.time) + 180;
                
                y1 = instance.yScale(data.properties.mag) - instance.marginBottom;
                y2 = instance.yScale(data.properties.mag) - instance.marginBottom + 12;
                y3 = instance.yScale(data.properties.mag) - instance.marginBottom + 24;
                */
                return "180,0 180,28 12,28 0,14 12,0";   // x3 + "," + y1 + " " + x3 + "," + y3 + " " + x2 + "," + y3 + " " + x1 + "," + y2 + " " + x2 + "," + y1
            });
                        
            d3.select(".tip")
            .append("text")
            .text(format(d))
            .attr("fill", "#ffffff")
            .attr("transform", "translate(14,11)");
        
            d3.select(".tip")
            .append("text")
            .text(data.properties.place)
            .attr("fill", "#ffffff")
            .attr("transform", "translate(14,24)");

        })
        .on("mouseout", function(){
            d3.select(".tip").remove();
        });
    };
    
    Main.prototype.VizUpdate = function(){
        var instance = this;

        console.log("Viz Update");
        instance.circleGroup = instance.svg.selectAll("circle")
            .data(instance.responseFeatures)
            .text(function(d){
                return d;
            });

    };
    
    Main.prototype.VizExit = function(){
        var instance = this;
        
        console.log("Viz Exit");
        instance.circleGroup.exit().remove();
    };

	window.Main = Main;

} (window));
