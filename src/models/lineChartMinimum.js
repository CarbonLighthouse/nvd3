nv.models.lineChart = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var lines = nv.models.line()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend()
        , interactiveLayer = nv.interactiveGuideline()
        , tooltip = nv.models.tooltip()
        , lines2 = nv.models.line()
        , x2Axis = nv.models.axis()
        , y2Axis = nv.models.axis()
        , brush = d3.svg.brush()
        ;

    var margin = {top: 30, right: 20, bottom: 50, left: 60}
        , margin2 = {top: 0, right: 20, bottom: 20, left: 60}
        , color = nv.utils.defaultColor()
        , width = null
        , height = null
        , showLegend = true
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , useInteractiveGuideline = false
        , x
        , y
        , x2
        , y2
        , focusEnable = false
        , focusShowAxisY = false
        , focusShowAxisX = true
        , focusHeight = 50
        , brushExtent = null
        , state = nv.utils.state()
        , defaultState = null
        , noData = null
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'brush', 'stateChange', 'changeState', 'renderEnd')
        , duration = 250
        ;

    // set options on sub-objects for this chart
    xAxis.orient('bottom').tickPadding(7);
    yAxis.orient(rightAlignYAxis ? 'right' : 'left');


    //============================================================
    // Private Variables
    //------------------------------------------------------------



    function chart(selection) {

        selection.each(function(data) {
            var container = d3.select(this);
            nv.utils.initSVG(container);
            var availableWidth = nv.utils.availableWidth(width, container, margin),
                availableHeight1 = nv.utils.availableHeight(height, container, margin) - (focusEnable ? focusHeight : 0),
                availableHeight2 = focusHeight - margin2.top - margin2.bottom;

            chart.container = this;

            // Setup Scales
            x = lines.xScale();
            y = lines.yScale();
            x2 = lines2.xScale();
            y2 = lines2.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-lineChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-lineChart').append('g');
            var g = wrap.select('g');


            var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
            focusEnter.append('g').attr('class', 'nv-background').append('rect');
            // focusEnter.append('g').attr('class', 'nv-x nv-axis');
            // focusEnter.append('g').attr('class', 'nv-y nv-axis');
            focusEnter.append('g').attr('class', 'nv-linesWrap');
            // focusEnter.append('g').attr('class', 'nv-interactive');

            var contextEnter = gEnter.append('g').attr('class', 'nv-context');
            contextEnter.append('g').attr('class', 'nv-background').append('rect');
            // contextEnter.append('g').attr('class', 'nv-x nv-axis');
            // contextEnter.append('g').attr('class', 'nv-y nv-axis');
            contextEnter.append('g').attr('class', 'nv-linesWrap');
            // contextEnter.append('g').attr('class', 'nv-brushBackground');
            contextEnter.append('g').attr('class', 'nv-x nv-brush');

/*****************************/
            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            lines
                .width(availableWidth)
                .height(availableHeight1)
                .color(data.map(function(d,i) {
                    return d.color || color(d, i);

                }).filter(function(d,i) { return !data[i].disabled; }));
/**************************/



            // Setup Main (Focus) Axes

                xAxis
                    .scale(x)
                    ._ticks(nv.utils.calcTicksX(availableWidth/100, data) )
                    .tickSize(-availableHeight1, 0);


                yAxis
                    .scale(y)
                    ._ticks( nv.utils.calcTicksY(availableHeight1/36, data) )
                    .tickSize( -availableWidth, 0);

            //============================================================
            // Update Axes
            //============================================================
/********************/
            function updateXAxis() {
              if(showXAxis) {
                g.select('.nv-focus .nv-x.nv-axis')
                  .transition()
                  .duration(duration)
                  .call(xAxis)
                ;
              }
            }

            function updateYAxis() {
              if(showYAxis) {
                g.select('.nv-focus .nv-y.nv-axis')
                  .transition()
                  .duration(duration)
                  .call(yAxis)
                ;
              }
            }
/****************************/
            



                lines2
                    .defined(lines.defined())
                    .width(availableWidth)
                    .height(availableHeight2)
                    .color(data.map(function(d,i) {
                        return d.color || color(d, i);
                    }).filter(function(d,i) { return !data[i].disabled; }));
    
                g.select('.nv-context')
                    .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')')
                    .style('display', focusEnable ? 'initial' : 'none')
                ;
    
                var contextLinesWrap = g.select('.nv-context .nv-linesWrap')
                    .datum(data.filter(function(d) { return !d.disabled; }))
                    ;
                    
                d3.transition(contextLinesWrap).call(lines2);
                
            
                // Setup Brush
                brush
                    .x(x2)
                    .on('brush', function() {
                        onBrush();
                    });
    

    



    
                var gBrush = g.select('.nv-x.nv-brush')
                    .call(brush);
   /*(******)*/
                gBrush.selectAll('rect')
                    .attr('height', availableHeight2);
/*************/
    
                onBrush();

    
                // Setup Secondary (Context) Axes
                if (focusShowAxisX) {
                  x2Axis
                      .scale(x2)
                      ._ticks( nv.utils.calcTicksX(availableWidth/100, data) )
                      .tickSize(-availableHeight2, 0);
      
                  g.select('.nv-context .nv-x.nv-axis')
                      .attr('transform', 'translate(0,' + y2.range()[0] + ')');
                  d3.transition(g.select('.nv-context .nv-x.nv-axis'))
                      .call(x2Axis);
                }

                

            

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            //============================================================
            // Functions
            //------------------------------------------------------------
    
    

            function onBrush() {
                brushExtent = brush.empty() ? null : brush.extent()
                var extent = brush.empty() ? x2.domain() : brush.extent();
    
    
                // Update Main (Focus)
                var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
                    .datum(
                    data
                        .filter(function(d) { return !d.disabled; })
                        .map(function(d,i) {
                            return {
                                key: d.key,
                                area: d.area,
                                classed: d.classed,
                                values: d.values.filter(function(d,i) {
                                    return lines.x()(d,i) >= extent[0] && lines.x()(d,i) <= extent[1];
                                }),
                                disableTooltip: d.disableTooltip
                            };
                        })
                



        });

        return chart;
    }


    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.lines = lines;
    chart.lines2 = lines2;
    chart.legend = legend;
    chart.xAxis = xAxis;
    chart.x2Axis = x2Axis;
    chart.yAxis = yAxis;
    chart.y2Axis = y2Axis;
    chart.interactiveLayer = interactiveLayer;
    chart.tooltip = tooltip;
    chart.state = state;
    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width:      {get: function(){return width;}, set: function(_){width=_;}},
        height:     {get: function(){return height;}, set: function(_){height=_;}},
        showLegend: {get: function(){return showLegend;}, set: function(_){showLegend=_;}},
        showXAxis:      {get: function(){return showXAxis;}, set: function(_){showXAxis=_;}},
        showYAxis:    {get: function(){return showYAxis;}, set: function(_){showYAxis=_;}},
        focusEnable:    {get: function(){return focusEnable;}, set: function(_){focusEnable=_;}},
        focusHeight:     {get: function(){return height2;}, set: function(_){focusHeight=_;}},
        focusShowAxisX:    {get: function(){return focusShowAxisX;}, set: function(_){focusShowAxisX=_;}},
        focusShowAxisY:    {get: function(){return focusShowAxisY;}, set: function(_){focusShowAxisY=_;}},
        brushExtent: {get: function(){return brushExtent;}, set: function(_){brushExtent=_;}},
        defaultState:    {get: function(){return defaultState;}, set: function(_){defaultState=_;}},
        noData:    {get: function(){return noData;}, set: function(_){noData=_;}},

        // options that require extra logic in the setter
        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = _.top    !== undefined ? _.top    : margin.top;
            margin.right  = _.right  !== undefined ? _.right  : margin.right;
            margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
            margin.left   = _.left   !== undefined ? _.left   : margin.left;
        }},
        duration: {get: function(){return duration;}, set: function(_){
            duration = _;
            renderWatch.reset(duration);
            lines.duration(duration);
            xAxis.duration(duration);
            x2Axis.duration(duration);
            yAxis.duration(duration);
            y2Axis.duration(duration);
        }},
        focusMargin: {get: function(){return margin2;}, set: function(_){
            margin2.top    = _.top    !== undefined ? _.top    : margin2.top;
            margin2.right  = _.right  !== undefined ? _.right  : margin2.right;
            margin2.bottom = _.bottom !== undefined ? _.bottom : margin2.bottom;
            margin2.left   = _.left   !== undefined ? _.left   : margin2.left;
        }},
        color:  {get: function(){return color;}, set: function(_){
            color = nv.utils.getColor(_);
            legend.color(color);
            lines.color(color);
        }},
        interpolate: {get: function(){return lines.interpolate();}, set: function(_){
            lines.interpolate(_);
            lines2.interpolate(_);
        }},
        xTickFormat: {get: function(){return xAxis.tickFormat();}, set: function(_){
            xAxis.tickFormat(_);
            x2Axis.tickFormat(_);
        }},
        yTickFormat: {get: function(){return yAxis.tickFormat();}, set: function(_){
            yAxis.tickFormat(_);
            y2Axis.tickFormat(_);
        }},
        x: {get: function(){return lines.x();}, set: function(_){
            lines.x(_);
            lines2.x(_);
        }},
        y: {get: function(){return lines.y();}, set: function(_){
            lines.y(_);
            lines2.y(_);
        }},
        rightAlignYAxis: {get: function(){return rightAlignYAxis;}, set: function(_){
            rightAlignYAxis = _;
            yAxis.orient( rightAlignYAxis ? 'right' : 'left');
        }},
        useInteractiveGuideline: {get: function(){return useInteractiveGuideline;}, set: function(_){
            useInteractiveGuideline = _;
            if (useInteractiveGuideline) {
                lines.interactive(false);
                lines.useVoronoi(false);
            }
        }}
    });

    nv.utils.initOptions(chart);

    return chart;
};

nv.models.lineWithFocusChart = function() {
  return nv.models.lineChart()
    .margin({ bottom: 30 }) 
    .focusEnable( true );
};