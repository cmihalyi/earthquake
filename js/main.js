(function (window) {

	function Main(){
        console.log("intialize main");
        
        this.timeStart;
        this.timeEnd;
        this.timeRange = 2;  //time window graphed number is in hours
        this.ajaxUrl = "http://comcat.cr.usgs.gov/fdsnws/event/1/query";
        this.ajaxQueryData = { "starttime" : "", "orderby" : "time-asc", "format" : "geojson"};
        this.ajaxCallback = "eqfeed_callback";
        this.jqxhr;
        this.responseData;
        this.responseMetadata;
        this.responseFeatures;
        this.requestInterval = 7500;
        this.svg;
        this.circleGroup;
        this.svgWidth = 1240;
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
            //console.log(instance.responseData);
            instance.jqxhr = undefined;

        }).fail(function(data){
            alert("load failed");
        });        
    };

    Main.prototype.getTime = function(){
        instance = this;

        var a,b,d;
        d = new Date();
        instance.timeEnd = d.getTime(); //x axis end range in ms
        //console.log("instance.timeEnd - ms:  " + instance.timeEnd);
        //console.log("instance.timeEnd - ISO String:  " + d.toISOString(instance.timeEnd));
        //console.log("current hour:  " + d.getUTCHours());
        //console.log("current hour - ISO String:  " + d.toISOString(d.getUTCHours()));
        //console.log("previous hour - hours:  " + (d.getUTCHours() - 4));
        //console.log("previous hour - ISO String:  " + d.toISOString(d.setUTCHours(d.getUTCHours() - 4)));
   
        
        //a = d.getUTCDate() -1;
        //b = d.setUTCDate(a);
        instance.timeStart = d.getTime(d.setUTCHours(d.getUTCHours() - instance.timeRange)); // x axis start range in ms

        //console.log("instance.timeStart - ms:  " + instance.timeStart);
        //console.log("instance.timeStart - ISO String:  " + d.toISOString(instance.timeStart));
        instance.ajaxQueryData.starttime = d.toISOString(instance.timeStart); //x axis start range in ISO format
        //console.log("instance.ajaxQueryData.starttime:  " + instance.ajaxQueryData.starttime);
        //console.log("instance.ajaxQueryData:  " + instance.ajaxQueryData);
        
    };
    
    Main.prototype.polling = function(){
        var instance = this;
        
        console.log("polling data");
        setInterval(function(){
            console.log("setting interval");
            instance.getTime();
            instance.getData();

            instance.jqxhr.done(function(){
                instance.createXScale();
                instance.updateXAxis();
                instance.dataJoin();
                instance.vizEnter();
                instance.vizUpdate();
                instance.vizExit();
            });
        }, instance.requestInterval);
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
    
    Main.prototype.createXScale = function(){
        var instance = this;

        instance.xScale = d3.time.scale()
            .domain([instance.timeStart, instance.timeEnd])
            .range([0, instance.svgWidth - (instance.marginLeft + instance.marginRight)]);
        
    };

    Main.prototype.createYScale = function(){
        var instance = this;

        instance.yScale = d3.scale.linear()
            .domain([0, 10])
            .range([instance.svgHeight - instance.marginTop, 0]);
    };

    Main.prototype.createXAxis = function(){
        var instance = this;        
                
        instance.xAxis = d3.svg.axis()
            .scale(instance.xScale)
            .orient('bottom')
            .ticks(d3.time.minutes, 30)
            .tickFormat(d3.time.format("%m/%d/%y - %H:%M"))
            .tickSize(5, 1)
            .tickPadding(6);

            instance.svg.append("g")
            .attr("class", "x axis")
            .attr('transform', 'translate(0,' + (instance.svgHeight - (instance.marginTop + instance.marginBottom)) + ')')
            .call(instance.xAxis);
            
    };
    
    Main.prototype.updateXAxis = function(){
        var instance = this;
        
        instance.xAxis
        .scale(instance.xScale)
        .ticks(d3.time.minutes, 30)
        .tickFormat(d3.time.format("%m/%d/%y - %H:%M"));
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

    Main.prototype.dataJoin = function(){
        //chart.selectAll("rect").data(data, function(d) { return d.time; });
        console.log("Data Join");
        var instance = this;
        
        instance.circleGroup = instance.svg.selectAll("circle")
        .data(instance.responseFeatures);
     };

    Main.prototype.viz = function(){
        var instance = this;
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

    };

    Main.prototype.vizEnter = function(){
        /*
        rect.enter().insert("rect", "line")
        .attr("x", function(d, i) { return x(i) - .5; })
        .attr("y", function(d) { return h - y(d.value) - .5; })
        .attr("width", w)
        .attr("height", function(d) { return y(d.value); });
        */
        var instance = this;
        console.log("Viz Enter");
        
        instance.circleGroup
        .enter()
        .append("circle")
        .classed("enter", true)
        .attr("fill", "steelblue")
        .attr("cx", function(data){
            return instance.xScale(data.properties.time);
        })
        .attr("cy", function(data){
            return instance.yScale(data.properties.mag) - instance.marginBottom;
        })
        .attr("r", 3)
        .on("mouseover", function(data){
        
            var format = d3.time.format("%m/%d/%y - %X");
            var d = new Date(data.properties.time);
            
            instance.svg.append("g")
            .attr("class", "tip")
            .attr("transform", "translate(" + (parseFloat(d3.select(this).attr("cx")) + 4) + "," + (d3.select(this).attr("cy") - 14) + ")")            
            .append("polygon")
            .attr("fill", "#aaaaaa")
            .attr("stroke", "#000000")
            .attr("points", function(data){
                return "180,0 180,28 12,28 0,14 12,0";   // x3 + "," + y1 + " " + x3 + "," + y3 + " " + x2 + "," + y3 + " " + x1 + "," + y2 + " " + x2 + "," + y1
            });
            
            d3.select(this)
            .transition()
            .ease("linear")
            .duration(500)
            .attr("r", instance.plotRadius * 2);
                        
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
            d3.select(this)
            .transition()
            .ease("linear")
            .duration(500)
            .attr("r", instance.plotRadius);
            
            d3.select(".tip").remove();
        });        
    };
    
    Main.prototype.vizUpdate = function(){
        //rect.transition().duration(1000).attr("x", function(d, i) { return x(i) - .5; });
        var instance = this;
        console.log("Viz Update");
        
        instance.circleGroup
        .classed("update", true)
        .transition()
        .ease("linear")
        .duration(1000)
        .attr("cx", function(data){
            return instance.xScale(data.properties.time);
        });
    };
    
    Main.prototype.vizExit = function(){
        //rect.exit().remove();
        var instance = this;
        console.log("Viz Exit");
        
        instance.circleGroup.exit().remove();
    };

	window.Main = Main;

} (window));
