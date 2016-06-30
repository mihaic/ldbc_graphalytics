// envCharts = [];

resTabAttrMap = {};

function envView(job, envTab) {

    var cardRow1 = $('<div class="card-group"></div>');

    var resTabAttrs = envResTabAttrs();
    resTabAttrMap = list2Map(resTabAttrs, "id");

    envTab.append(envResTabs(resTabAttrs));
    envTab.find('ul').insertAfter(envTab.find('.tab-content'));
    envTab.find('[data-toggle = "tab"]').on('shown.bs.tab', loadEnvChart);

    envTab.append(cardRow1);
}

function loadEnvChart(e) {
    try{
        var metricId = $(e.target).attr('metric-id');
        if(metricId != null) {
            var thismetric = resTabAttrMap[metricId];
            areaChart('#env-'+thismetric.id+"-chart", thismetric.chartAttr, thismetric.chartData);
        }
    }catch(err){
        logging(err);
    }
}

function envResTabAttrs() {

    var dataList = job.env;

    var startTime = job.meta.startTime;
    var endTime = job.meta.endTime;

    var interval = conf.interval;
    while((endTime - startTime) / interval > 300) {
        interval = interval * 10;
        if(interval >= 10000) {
            break;
        }
    }

    var netMetricsEthSnd = chartData(filterMetricDataList(dataList, "net-eth-snd", interval), startTime, endTime, interval, 1000000000, true);
    var netMetricsEthRec = chartData(filterMetricDataList(dataList, "net-eth-rec", interval), startTime, endTime, interval, 1000000000, true);
    var netMetricsIboipSnd = chartData(filterMetricDataList(dataList, "net-ipoib-snd", interval), startTime, endTime, interval, 1000000000, true);
    var netMetricsIboipRec = chartData(filterMetricDataList(dataList, "net-ipoib-rec", interval), startTime, endTime, interval, 1000000000, true);

    var cpuChartAttr = {xLabel:"Execution Time (s)", yLabel:"Cpu Time (s)", interval:interval};
    var cpuChartData = chartData(filterMetricDataList(dataList, "cpu", interval), startTime, endTime, interval, 1, true);
    var cpuTabAttr = {id: "cpu-metric", name: "CPU", chartAttr: cpuChartAttr, chartData: cpuChartData};

    var memChartAttr = {xLabel:"Execution Time (s)", yLabel:"Memory Usage (GB)", interval:interval};
    var memChartData = chartData(filterMetricDataList(dataList, "mem-rss", interval), startTime, endTime, interval, 1000000, false);
    var memTabAttr = {id: "mem-metric", name: "Memory", chartAttr: memChartAttr, chartData: memChartData};

    var memSwapChartAttr = {xLabel:"Execution Time (s)", yLabel:"Swap Usage (GB)", interval:interval};
    var memSwapChartData = chartData(filterMetricDataList(dataList, "mem-swap", interval), startTime, endTime, interval, 1000000, false);
    var memSwapTabAttr = {id: "memSwap-metric", name: "Swap", chartAttr: memSwapChartAttr, chartData: memSwapChartData};

    var netIbSndChartAttr = {xLabel:"Execution Time (s)", yLabel:"Network Send Bandwidth(GB, Infiniband)", interval:interval};
    var netIbSndChartData = chartData(filterMetricDataList(dataList, "net-ib-snd", interval), startTime, endTime, interval, 1000000000, true);
    var netIbSndTabAttr = {id: "netIbSndMetrics-metric", name: "Network-Snd", chartAttr: netIbSndChartAttr, chartData: netIbSndChartData};

    var netIbRecChartAttr = {xLabel:"Execution Time (s)", yLabel:"Network Receive Bandwidth (GB, Infiniband)", interval:interval};
    var netIbRecChartData = chartData(filterMetricDataList(dataList, "net-ib-rec", interval), startTime, endTime, interval, 1000000000, true);
    var netIbRecTabAttr = {id: "netIbRecMetrics-metric", name: "Network-Rec", chartAttr: netIbRecChartAttr, chartData: netIbRecChartData};


    var dskRcharChartAttr = {xLabel:"Execution Time (s)", yLabel:"Disk Read (MB)", interval:interval};
    var dskRcharChartData = chartData(filterMetricDataList(dataList, "dsk-rchar", interval), startTime, endTime, interval, 1000000, true);
    var dskRcharTabAttr = {id: "dskRcharMetrics-metric", name: "Disk-Read", chartAttr: dskRcharChartAttr, chartData: dskRcharChartData};


    var dskWcharChartAttr = {xLabel:"Execution Time (s)", yLabel:"Disk Write (MB)", interval:interval};
    var dskWcharChartData = chartData(filterMetricDataList(dataList, "dsk-wchar", interval), startTime, endTime, interval, 1000000, true);
    var dskWcharTabAttr = {id: "dskWcharMetrics-metric", name: "Disk-Write", chartAttr: dskWcharChartAttr, chartData: dskWcharChartData};

    return [cpuTabAttr, memTabAttr, memSwapTabAttr, netIbSndTabAttr, netIbRecTabAttr, dskRcharTabAttr, dskWcharTabAttr];
}



function envResTabs(resTabAttrs) {
    var tabDiv = $('<div role="tabpanel">');
    var tabList = $('<ul class="nav nav-tabs" role="tablist" />');
    var tabContent = $('<div class="tab-content" />');

    tabDiv.append(tabList);
    tabDiv.append(tabContent);

    tabList.append('<li class="nav-item">' +
        '<a class="nav-link active" data-toggle="tab" href="#env-summary-tab" role="tab">All</a>' +
        '</li>');

    var content = $('<div class="tab-pane fade active in" id="env-summary-tab" role="tabpanel"></div>');

    var startTime = job.meta.startTime;
    var endTime = job.meta.endTime;
    // job.system.infoIds.forEach(function (id) {
    //     var info = job.system.infos[id];
    //     if(info.name == "StartTime") {
    //         startTime = info.value;
    //     }
    //     if(info.name == "EndTime") {
    //         endTime = info.value;
    //     }
    // });


    content.append(envSummaryCard(startTime, endTime));
    tabContent.append(content);


    resTabAttrs.forEach(function(tabAttr, i) {
        tabList.append('<li class="nav-item">' +
            '<a class="nav-link" data-toggle="tab" metric-id="'+tabAttr.id+'" href="#env-'+tabAttr.id+'-tab" role="tab">'+tabAttr.name+'</a>' +
            '</li>');

        var content = $('<div class="tab-pane " id="env-'+tabAttr.id+'-tab" role="tabpanel"></div>');
        content.append(areaChartCard('env-'+tabAttr.id+'-chart', tabAttr));
        tabContent.append(content);
    });
    return tabDiv;
}


function envSummaryCard(startTime, endTime) {
    var card = $('<div class="card" />');
    var table = divTable();
    table.append(caption("Summary of the Job Environment"));


    var headerCard = divCard(11);
    var headerTable = divTable();
    headerTable.append($('<tr>' +
        '<td class="col-md-3">Name</td><td class="col-md-2">Measured value</td>' +
        '<td class="col-md-2">Theoretical Peak</td><td class="col-md-3">Percentage</td>' +
        '</tr>'));

    var cardRow0 = $('<div class="card-group"></div>');
    table.append(cardRow0);
    cardRow0.append(divCard(1).append(""));
    cardRow0.append(headerCard.append(headerTable));

    var cardRow1 = $('<div class="card-group"></div>');
    var cardRow2 = $('<div class="card-group"></div>');
    var cardRow3 = $('<div class="card-group"></div>');

    cardRow1.append(divCard(1).append("CPU"));
    cardRow1.append(cpuSummaryCard(startTime, endTime));
    cardRow2.append(divCard(1).append("Memory"));
    cardRow2.append(memSummaryCard(startTime, endTime));
    cardRow3.append(divCard(1).append("Network"));
    cardRow3.append(networkSummaryCard(startTime, endTime));

    table.append(cardRow1);
    table.append(cardRow2);
    table.append(cardRow3);
    card.append(table);
    return card;
}


function cpuSummaryCard(startTime, endTime) {

    var cpuMetricDataList = filterMetricDataList(job.env, "cpu", conf.interval);
    var aggMetricValues = aggregatedMetricValues(cpuMetricDataList);
    var cpuUsage = diffMetricValues(aggMetricValues, startTime, endTime);
    var cpuMax = cpuMetricDataList.length * (endTime - startTime) / 1000 * 32;

    var card = divCard(11);
    var table = divTable();
    card.append(table);
    table.append(resTableRow("CpuTime (all nodes, all cores)", cpuUsage,  "s", cpuMax));

    return card;
}


function memSummaryCard(startTime, endTime) {



    var memMetricDataList = filterMetricDataList(job.env, "mem", conf.interval);
    var aggMetricValues = aggregatedMetricValues(memMetricDataList);
    var memAvgAll = avgMethod(extractValues(aggMetricValues, startTime, endTime)) / 1000000;
    var memMaxAll = maxMethod(extractValues(aggMetricValues, startTime, endTime)) / 1000000;
    var memMaxNode = memMetricDataList
        .map(function (metricData) {
            return maxMethod(extractValues(metricData.data, startTime, endTime)) / 1000000;
        }).reduce(function (a, b) {
            return (a > b) ? a : b;
        });

    var memPeakAll = memMetricDataList.length * 64;
    var memPeakNode = 64;

    var card = divCard(11);
    var table = divTable();
    card.append(table);
    table.append(resTableRow("MemAvg (all nodes)", memAvgAll,  "GB", memPeakAll));
    table.append(resTableRow("MemMax (all nodes)", memMaxAll,  "GB", memPeakAll));
    table.append(resTableRow("MemMax (any nodes)", memMaxNode,  "GB", memPeakNode));

    return card;

}



function networkSummaryCard(startTime, endTime) {

    var netIbSndMetricDataList = filterMetricDataList(job.env, "net-ib-snd", conf.interval);
    var aggMetricValues = aggregatedMetricValues(netIbSndMetricDataList);
    var netIBSnd = diffMetricValues(aggMetricValues, startTime, endTime) / Math.pow(1000, 3);
    var netIBPeak = netIbSndMetricDataList.length * (endTime - startTime) / 1000 * 1.25;

    var aggIbRecValues = aggregatedMetricValues(filterMetricDataList(job.env, "net-ib-rec", 1000));
    var netIBRec = diffMetricValues(aggIbRecValues, startTime, endTime) / Math.pow(1000, 3);

    var card = divCard(11);
    var table = divTable();
    card.append(table);
    table.append(resTableRow("NetVol (SEND, all nodes)", netIBSnd,  "GB", netIBPeak));
    table.append(resTableRow("NetVol (REC, all nodes)", netIBRec,  "GB", netIBPeak));

    return card;

}



function areaChartCard(chartName, tabAttr) {
    var chartCard = $('<div class="card" />');
    var chart = $('<div class="card-block" ><svg id="'+chartName+'"  viewBox="0 0 1000 270" height="300" width="100%"></svg></div>');
    // var text = "interval = " +  tabAttr.chartAttr.interval;
    chartCard.append(chart);
    // chartCard.append(text);

    return chartCard;
}
