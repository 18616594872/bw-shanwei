<template>
      <div class="DataModel">
            <vm-title :title-text="modelData.title"></vm-title>
            <div class="ChartModel2" v-if = "modelData.chartType === echartsType.Line.key">
                <line-chart v-if="chartData" v-bind="chartData"></line-chart>
            </div>
            <div class="ChartModel2" v-else-if = "modelData.chartType === echartsType.MultiLine.key">
                <multi-line-chart v-if="chartData" v-bind="chartData"></multi-line-chart>
            </div>
            <div class="ChartModel2"  v-else-if = "modelData.chartType === echartsType.Bar.key">
                <bar-chart v-if="chartData" v-bind="chartData"></bar-chart>
            </div>
            <div class="ChartModel2" v-else-if = "modelData.chartType === echartsType.MultiBar.key">
                <multi-bar-chart v-if="chartData" v-bind="chartData"></multi-bar-chart>
            </div>
            <div class="ChartModel2" v-else-if = "modelData.chartType === echartsType.MultiBarRotate.key">
                <multi-bar-rotate-chart v-if="chartData" v-bind="chartData"></multi-bar-rotate-chart>
            </div>
            <div class="ChartModel3" v-else-if = "modelData.chartType === echartsType.Pie.key">
                <pie-chart v-if="chartData" v-bind="chartData"></pie-chart>
            </div>
            <div class="ChartModel3" v-else-if = "modelData.chartType === echartsType.Radar.key">
                <radar-chart v-if="chartData" v-bind="chartData"></radar-chart>
            </div>
            <div class="ChartModel3" v-else-if = "modelData.chartType === echartsType.MultiRadar.key">
                <multi-radar-chart v-if="chartData" v-bind="chartData"></multi-radar-chart>
            </div>
            <div class="ChartModel" v-else-if = "modelData.chartType === echartsType.Grid.key">
                <simple-grid v-if="chartData" v-bind="chartData"></simple-grid>
            </div>
      </div>
</template>

<style scoped>
.DataModel {
    width: 100%;
    height: 100%;
}
.ChartModel {
    position: relative;
    top: 15%;
    width: 100%;
    height: 85%;
}

.ChartModel2 {
    position: relative;
    top: 0%;
    width: 100%;
    height: 100%;
}

.ChartModel3 {
    position: relative;
    top: 20%;
    width: 100%;
    height: 70%;
}
</style>

<script>
import VmTitle from "./VMTitle";

import LineChart from "../Common/Chart/SimpleLineChart";
import MultiLineChart from "../Common/Chart/MultiLineChart";
import BarChart from "../Common/Chart/SimpleBarChart";
import MultiBarChart from "../Common/Chart/MultiBarChart";
import MultiBarRotateChart from "../Common/Chart/MultiBarChartRotate";
import PieChart from "../Common/Chart/SimplePieChart";
import RadarChart from "../Common/Chart/SimpleRadarChart";
import MultiRadarChart from "../Common/Chart/MultiRadarChart";
import SimpleGrid from "../Common/Grid/SimpleGrid";

import types from "../../../static/Enum";

export default {
    name: "data-model",
    props: {
        modelData: Object
    },
    data() {
        return {
            chartData: null,
            echartsType: types.echartsType
        };
    },
    computed: {},
    components: {
        VmTitle,
        LineChart,
        MultiLineChart,
        BarChart,
        MultiBarChart,
        MultiBarRotateChart,
        PieChart,
        RadarChart,
        MultiRadarChart,
        SimpleGrid
    },
    mounted() {
        if (this.modelData.parameters.format) {
            this.modelData.title = this.modelData.title.format(
                this.modelData.parameters.format
            );
            this.modelData.url = this.modelData.url.format(
                this.modelData.parameters.format
            );
        }
        this.chartData = {
            id: this.modelData.id,
            requestUrl: this.modelData.url,
            parameters: this.modelData.parameters
        };
    }
};
</script>
