var operation = {};
var isOperation = true;
var operations = {};
var infos = {};
var actors = {};
var missions = {};
var operationTab = {};

operResTabAttrMap = {};

function operationView(job, opTab) {

    operations = job.system.operations;
    infos = job.system.infos;
    actors = job.system.actors;
    missions = job.system.missions;
    operationTab = opTab;

    var operation = operations[job.system.rootIds[0]];
    drawOperChart(operation);

}

function operDesrCard(operation) {
    var card = divCard();
    var table = divTable();

    var summaryInfo = job.system.infos[operation.infoIds["Summary"]].summary;
    var summary = job.system.descriptions[summaryInfo].text;

    table.append(caption(getOperationName(operation)));

    table.append($('<p class="text-left">'+summary+'</p>'));
    card.append(table);
    return card;
}


function operDurationCard(operation) {
    var card = divCard();
    var table = divTable();

    var startTime = info(operation, "StartTime");
    var endTime = info(operation, "EndTime");
    table.append(caption("Duration"));


    table.append(tableRow("StartTime", timeConverter(startTime) + ' (' + startTime + ')'));
    table.append(tableRow("EndTime", timeConverter(endTime) + ' (' + endTime + ')'));
    table.append(tableRow("Duration", parseInt(endTime) - parseInt(startTime) + " ms"));

    card.append(table);
    return card;
}

function drawOperChart(operation) {

    operationTab.empty();
    var cardRow1 = divCardGroup();
    var cardRow2 = divCardGroup();
    var cardRow3 = divCardGroup();
    var cardRow4 = divCardGroup();
    operationTab.append(cardRow1);
    operationTab.append(cardRow2);
    operationTab.append(cardRow3);
    operationTab.append(cardRow4);


    cardRow1.append(navigationLink(operation));
    cardRow2.append(operDesrCard(operation), operDurationCard(operation));

    var operationChart = operChart(operation);
    cardRow3.append(operationChart);

    var resTabAttrs = operResTabAttrs(operation);
    operResTabAttrMap = list2Map(resTabAttrs, "id");
    operationTab.append(operResTabs(operation, resTabAttrs));


}

function operResTabAttrs(operation) {

    var dataList = job.env;

    var startTime = info(operation, "StartTime");
    var endTime = info(operation, "EndTime");
    var interval = conf.interval;
    while((endTime - startTime) / interval > 300) {
        interval = interval * 10;
        if(interval >= 10000) {
            break;
        }
    }

    var cpuChartAttr = {xLabel:"Execution Time (s)", yLabel:"Cpu Time (s)", interval:interval};
    var cpuChartData = chartData(filterMetricDataList(dataList, "cpu", interval), startTime, endTime, interval, 1, true);
    var cpuTabAttr = {id: "oper-cpu-metric", name: "CPU", chartAttr: cpuChartAttr, chartData: cpuChartData};

    var memChartAttr = {xLabel:"Execution Time (s)", yLabel:"Memory Usage (GB)", interval:interval};
    var memChartData = chartData(filterMetricDataList(dataList, "mem-rss", interval), startTime, endTime, interval, 1000000, false);
    var memTabAttr = {id: "oper-mem-metric", name: "Memory", chartAttr: memChartAttr, chartData: memChartData};

    var memSwapChartAttr = {xLabel:"Execution Time (s)", yLabel:"Swap Usage (GB)", interval:interval};
    var memSwapChartData = chartData(filterMetricDataList(dataList, "mem-swap", interval), startTime, endTime, interval, 1000000, false);
    var memSwapTabAttr = {id: "oper-memSwap-metric", name: "Swap", chartAttr: memSwapChartAttr, chartData: memSwapChartData};

    logging(filterMetricDataList(dataList, "mem-swap", interval))

    var netIbSndChartAttr = {xLabel:"Execution Time (s)", yLabel:"Network Send Bandwidth(GB, Infiniband)", interval:interval};
    var netIbSndChartData = chartData(filterMetricDataList(dataList, "net-ib-snd", interval), startTime, endTime, interval, 1000000000, true);
    var netIbSndTabAttr = {id: "oper-netIbSndMetrics-metric", name: "Network-Snd", chartAttr: netIbSndChartAttr, chartData: netIbSndChartData};

    var netIbRecChartAttr = {xLabel:"Execution Time (s)", yLabel:"Network Receive Bandwidth (GB, Infiniband)", interval:interval};
    var netIbRecChartData = chartData(filterMetricDataList(dataList, "net-ib-rec", interval), startTime, endTime, interval, 1000000000, true);
    var netIbRecTabAttr = {id: "oper-netIbRecMetrics-metric", name: "Network-Rec", chartAttr: netIbRecChartAttr, chartData: netIbRecChartData};

    var dskRcharChartAttr = {xLabel:"Execution Time (s)", yLabel:"Disk Read (MB)", interval:interval};
    var dskRcharChartData = chartData(filterMetricDataList(dataList, "dsk-rchar", interval), startTime, endTime, interval, 1000000, true);
    var dskRcharTabAttr = {id: "oper-dskRcharMetrics-metric", name: "Disk-Read", chartAttr: dskRcharChartAttr, chartData: dskRcharChartData};


    var dskWcharChartAttr = {xLabel:"Execution Time (s)", yLabel:"Disk Write (MB)", interval:interval};
    var dskWcharChartData = chartData(filterMetricDataList(dataList, "dsk-wchar", interval), startTime, endTime, interval, 1000000, true);
    var dskWcharTabAttr = {id: "oper-dskWcharMetrics-metric", name: "Disk-Write", chartAttr: dskWcharChartAttr, chartData: dskWcharChartData};

    return [cpuTabAttr, memTabAttr, memSwapTabAttr, netIbSndTabAttr, netIbRecTabAttr, dskRcharTabAttr, dskWcharTabAttr];
}

function operResTabs(operation, tabAttrs) {

    var startTime = operation.infoIds["StartTime"].value;
    var endTime = operation.infoIds["EndTime"].value;

    var tabDiv = $('<div role="tabpanel">');
    var tabList = $('<ul class="nav nav-tabs" role="tablist" />');
    var tabContent = $('<div class="tab-content" />');

    tabDiv.append(tabList);
    tabDiv.append(tabContent);


    tabList.append('<li class="nav-item">' +
        '<a class="nav-link" data-toggle="tab" href="#oper-summary-tab" role="tab">All</a>' +
        '</li>');

    var content = $('<div class="tab-pane" id="oper-summary-tab" role="tabpanel"></div>');
    tabContent.append(content);
    content.append(envSummaryCard(startTime, endTime));


    tabAttrs.forEach(function(tabAttr, i) {
        tabList.append('<li class="nav-item">' +
            '<a class="nav-link" data-toggle="tab" metric-id="'+tabAttr.id+'" href="#env-'+tabAttr.id+'-tab" role="tab">'+tabAttr.name+'</a>' +
            '</li>');

        var content = $('<div class="tab-pane " id="env-'+tabAttr.id+'-tab" role="tabpanel"></div>');
        content.append(areaChartCard('env-'+tabAttr.id+'-chart', tabAttr));
        tabContent.append(content);
    });

    tabDiv.find('[data-toggle = "tab"]').on('shown.bs.tab', function (e) {
        try{
            var metricId = $(e.target).attr('metric-id');

            if(metricId != null) {
                var thismetric = operResTabAttrMap[metricId];
                areaChart('#env-'+thismetric.id+"-chart", thismetric.chartAttr, thismetric.chartData);
            }
        }catch(err){
            logging("" + err);
        }
    });

    return tabDiv;
}

function info(entity, name) {
    return job.system.infos[entity.infoIds[name]].value
}

function navigationLink(operation) {

    var currOperation = operation;

    var ancestorLink = $('<p class="link"></p>');

    // ancestorLink.prepend('&nbsp;&nbsp;>&nbsp;&nbsp;' + currentOperation.getTitle());
    // currentOperation = currentOperation.getSuperoperation();

    while(currOperation != null) {
        var link = $('<a uuid="' + currOperation.uuid + '">' + getOperationName(currOperation)+'</a>');

        link.on('click', function (e) {
            e.preventDefault();
            drawOperChart(operations[$(this).attr('uuid')]);
        });
        ancestorLink.prepend(link);
        ancestorLink.prepend('&nbsp;&nbsp;>&nbsp;&nbsp;');
        currOperation = operations[currOperation.parentId];

    }
    ancestorLink.prepend('Job');
    return ancestorLink;
}

