
<template>
    <div class="content">
        <div class="threedContent" :id="id">
            <slot></slot>
        </div>
        <show-model v-bind="modelProp"
                    @showDesModel="showDesModel">
        </show-model>
        <describe-model v-bind="model"
                        @removeByEntityId="removeByEntityId">
        </describe-model>
    </div>
</template>

<script>

const stateQuantity = '状态量输入';

import Cesium from "Cesium";
import zlib from "zlib";
import Vue from 'vue'
import  showModel from '../Modal/ShowMapDataModal'
import  describeModel  from '../../VM/AlarmManage/DescAlarmModel'
import {
    addEntity,
    doSqlQuery,
    processFailed,
    getEntitySet,
    addBillboard,
    getEntityProperty,
    switchShowEntity
} from "../../../scripts/commonFun.js";
import { flyManagerMinix } from './mixins/flyManager'
import { addBarnLabel } from "./mixins/addBarnLabel";
import tools from './tools'


export default {
    mixins:[ flyManagerMinix,tools,addBarnLabel ],
    props: {
        id: {
            type: String,
        },
        infoBox: {
            type: Boolean,
            default: true
        },
        navigation: {
            type: Boolean,
            default: true
        },
        openImageryProvider:{
            type: Boolean,
            default: true
        },
        openVideoLinkage:{
            type: Boolean,
            default: false
        },
        openDoubleClickView:{
            type: Boolean,
            default: true
        },
        unitsPosition:{
            default: ()=>{
                return {
                    openPosition:false,
                    isShow:false,
                }
            }
        },
        searchCamera:{
            type: Object,
            default: ()=>{
                return {
                    openSearch:false,
                    isShow:false,
                }
            }
        },
        personnelPosition:{
            type: Object,
            default: ()=>{
                return {
                    openPosition:false,
                    isShow:false,
                    refreshTime:1000
                }
            }
        },
        defectPosition:{
            type: Object,
            default: ()=>{
                return {
                    openPosition:false,
                    isShow:false,
                }
            }
        },
        openPlanPosition:{
            type:Object,
            default: ()=>{
                return {
                    openPosition:false,
                }
            }
        },
        eventsPosition:{
            type: Object,
            default: ()=>{
                return {
                    openPosition:false,
                }
            }
        },
        undergroundMode: {
            type: Object,
            default: function() {
                return {
                    enable: true,
                    distance: -8
                };
            }
        },
        refreshCameraPosition: {
            type: Object,
            default: function() {
                return {
                    enable: false,
                    interval: 1000
                };
            }
        },
        cameraPosition: {
            type: Object,
            default: ()=> {
                return {
                    longitude: 112.49402798396824,
                    latitude: 37.70621237244105,
                    height: 6.85193571485006,
                    roll: 6.283185307178147,
                    pitch: -0.2724024021381044,
                    heading: 6.271857201776858
                };
            }
        }
    },
    data() {
        return {
            viewer: null,
            scene: null,
            handler:null,
            prePosition: null,
            personnelPositionTimerId:null
        };
    },
    watch:{
        'unitsPosition.isShow'(){
            switchShowEntity.call(this,{
                messageType:'units'
            })
        },
        'searchCamera.openSearch'(){
            switchShowEntity.call(this,{
                messageType:'videos'
            })
        },
        'personnelPosition.isShow'(){
            switchShowEntity.call(this,{
                messageType:'personnel'
            })
            this.personnelPosition.isShow ?
                this.refreshPersonnelPosition() :
                clearInterval(this.personnelPositionTimerId);
        },
        'defectPosition.isShow'(){
            switchShowEntity.call(this,{
                messageType:'flaw'
            })
        },
        'eventsPosition.openPosition'(){
            let { viewer } = this;

            let events = Vue.prototype.IM.getInformation('events');

            if( this.eventsPosition.openPosition ){
                this.eventNotie()
            }else {
                if( !events.length ) return;

                events.forEach(currEvent => viewer.entities.removeById( currEvent.id ));
                events.splice(0);
                this.modelProp.show.state = false;
            }

        }
    },
    components: {
        showModel,
        describeModel
    },
    beforeMount(){
        Vue.prototype.$viewerComponent = this; // 把当前组件挂载到Vue原型$viewerComponent上
    },
    mounted() {
        this.init();

    },
    methods: {
        // 初始化
        init() {
            var _this = this;
            // 初始化viewer部件
            _this.viewer = new Cesium.Viewer(_this.id,{
                navigation:_this.navigation,
                infoBox:_this.infoBox,

            });
            if( this.id == 'mapViewer' ) Vue.prototype.$viewer = _this.viewer; // 把当前viewer实例挂载到Vue原型$viewer上
            _this.scene = _this.viewer.scene;

            if(_this.openDoubleClickView){
                //设置是否开始双击视角
                _this.viewer.screenSpaceEventHandler.setInputAction(function(){},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            }

            if (_this.undergroundMode.enable) {
                // 设置是否开启地下场景
                _this.scene.undergroundMode = _this.undergroundMode.enable;
                // 设置相机最小缩放距离,距离地表-8米
                _this.scene.screenSpaceCameraController.minimumZoomDistance =
                    _this.undergroundMode.distance;
                var widget = _this.viewer.cesiumWidget;
            }

            if(_this.openImageryProvider){
                //开启地图服务
                let provider_mec = new Cesium.SuperMapImageryProvider({
                    url : this.SuperMapConfig.IMG_MAP//墨卡托投影地图服务
                });
                _this.viewer.imageryLayers.addImageryProvider(provider_mec);
            }

            if(_this.searchCamera.openSearch){
                //查询全部相机
                doSqlQuery.call(_this,_this.viewer,'MOTYPEID=7',this.SuperMapConfig.BIM_DATA,addBillboard,processFailed,'videoType','videos',_this.searchCamera.isShow)
            }

            if(_this.unitsPosition.openPosition){
                //开启单位定位
                getEntitySet.call(this,{viewer:_this.viewer,url:'relatedunits',show:_this.unitsPosition.isShow,typeMode:'unitType',messageType:'units'})
            }

            if(_this.personnelPosition.openPosition){
                //开启人员定位
                _this.refreshPersonnelPosition();

            }

            if(_this.defectPosition.openPosition){
                //开启缺陷定位
                getEntitySet.call(this,{
                    viewer:_this.viewer,
                    url:'defects/list',
                    typeMode:'flawType',
                    messageType:'flaw',
                    show:_this.defectPosition.isShow,
                    dataUrl:this.SuperMapConfig.BIM_DATA,
                    onQueryComplete:addBillboard,
                    processFailed:processFailed
                    })
            }

            if(_this.eventsPosition.openPosition){
                //开启事件定位
                this.eventNotie();
            }

            if(_this.searchCamera.openSearch ||　_this.unitsPosition.openPosition ||　_this.personnelPosition.openPosition ||　_this.defectPosition.openPosition ||　_this.eventsPosition.openPosition){
                //鼠标经过实体时,触发气泡
                getEntityProperty.call(_this,_this.scene,Cesium,_this.modelProp,'model-content')
            }
            //设置鼠标左键单击回调事件
            _this.viewer.selectedEntityChanged.addEventListener(this.operationEntity);

            try {
                //打开所发布三维服务下的所有图层
                var promise = _this.scene.open(this.SuperMapConfig.BIM_SCP);

                Cesium.when(
                    promise,
                    function(layer) {
                        //设置BIM图层不可选择
                        layer.forEach(
                            curBIM => (curBIM._selectEnabled = false)
                        );
                        //设置相机位置、视角，便于观察场景
                        _this.setViewAngle();
                    },
                    function(e) {
                        if (widget._showRenderLoopErrors) {
                            var title =
                                "加载SCP失败，请检查网络连接状态或者url地址是否正确？";
                            widget.showErrorPanel(title, undefined, e);
                        }
                    }
                );
            } catch (e) {
                if (widget._groundPrimitives) {
                    var title = "渲染时发生错误，已停止渲染。";
                    widget.showErrorPanel(title, undefined, e);
                }
            }
            _this.flyManager();
            _this.addUnitViewers();
            //滚轮滑动，获得当前窗口的经纬度，偏移角
            _this.handler = new Cesium.ScreenSpaceEventHandler(
                _this.scene.canvas
            );
        
            
            _this.handler.setInputAction(e => {
                this.addLabel( this.SuperMapConfig.BIM_DATA,doSqlQuery,processFailed,1000/60 );
            }, Cesium.ScreenSpaceEventType.WHEEL);
            //鼠标左键松开，获得当前窗口的经纬度，偏移角
            _this.handler.setInputAction(e=>{
                this.addLabel( this.SuperMapConfig.BIM_DATA,doSqlQuery,processFailed,1000/60 );
            },Cesium.ScreenSpaceEventType.LEFT_UP)
                //  _this.handler.setInputAction(e=>{
                //     var position=_this.scene.pickPosition(e.position)
                //     var camera=_this.viewer.scene.camera;
                //     var cartographic = Cesium.Cartographic.fromCartesian(position)
                //     var longitude = Cesium.Math.toDegrees(cartographic.longitude);
                //     var latitude = Cesium.Math.toDegrees(cartographic.latitude);
                //     var height = cartographic.height;
            
                //     console.log(longitude+"/"+latitude+"/"+height);
                //     console.log('pitch'+camera.pitch)
                //     console.log('roll'+camera.roll)
                //     console.log('heading'+camera.heading)
                // },Cesium.ScreenSpaceEventType.LEFT_CLICK)
        
        },
        // 开始相机位置刷新
        startCameraPositionRefresh() {
            this.refreshCameraPosition.enable = true;
            this.cameraPositionRefresh();
        },
        // 停止相机位置刷新
        stopCameraPositionRefresh() {
            this.refreshCameraPosition.enable = false;
        },
        // 相机位置刷新
        cameraPositionRefresh() {
            var _this = this;

            setTimeout(() => {
                try {
                    // 如果刷新相机位置不可用，则退出
                    if (!_this.refreshCameraPosition.enable) return;

                    var camera = _this.scene.camera;
                    var position = camera.position;
                    //将笛卡尔坐标化为经纬度坐标
                    var cartographic = Cesium.Cartographic.fromCartesian(
                        position
                    );
                    var longitude = Cesium.Math.toDegrees(
                        cartographic.longitude
                    );
                    var latitude = Cesium.Math.toDegrees(cartographic.latitude);
                    var height = cartographic.height;

                    var cameraPosition = {
                        longitude: longitude,
                        latitude: latitude,
                        height: height,
                        pitch: camera.pitch,
                        roll: camera.roll,
                        heading: camera.heading,
                        equals: function(o) {
                            if (o == null) return false;
                            return (
                                Math.abs(o.longitude - this.longitude) <
                                    0.000001 &&
                                Math.abs(o.latitude - this.latitude) <
                                    0.000001 &&
                                Math.abs(o.height - this.height) < 0.000001 &&
                                Math.abs(o.pitch - this.pitch) < 0.000001 &&
                                Math.abs(o.roll - this.roll) < 0.000001 &&
                                Math.abs(o.heading - this.heading) < 0.000001
                            );
                        }
                    };
                    if (!cameraPosition.equals(_this.prePosition)) {
                        _this.prePosition = cameraPosition;
                        console.log("now position", _this.prePosition);
                        _this.$emit("refreshCameraPosition", cameraPosition);
                    }
                } catch (error) {
                    console.log(error);
                }

                _this.cameraPositionRefresh();
            }, _this.refreshCameraPosition.interval);
        },
        //添加告警实体
        addAlarmEntity(obj){
            let {　viewer　}　= this;

            if( obj.isDistribute ){  //isDistribute 为true时为分布式,false为非分布式

                addEntity({
                    viewer:viewer,
                    X:obj.longitude,
                    Y:obj.latitude,
                    Z:Vue.prototype.VMConfig.entityHeight,
                    moId:obj.objectId,
                    show:true,
                    messageType:'alarm',
                    billboard:{
                        image:'alarm-close',
                        height:30,
                        scaleByDistance:new Cesium.NearFarScalar(0,1,3500,0.8),
                        verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                    },
                })
            }else {
                doSqlQuery.call(this,viewer,'MOID in ('+ obj.objectId.toString() +')',this.SuperMapConfig.BIM_DATA,addBillboard,processFailed,'alarmType','alarm',true);
            }
        },
        //人员定位
        refreshPersonnelPosition(){
            let { personnelPosition,viewer } = this;
            if(Cesium.defined(viewer)){
                this.personnelPositionTimerId = setInterval(()=>{
                    getEntitySet.call(
                        this,
                        {
                            viewer:viewer,
                            url:'actived-locators',
                            show:personnelPosition.isShow,
                            typeMode:'personnelType',
                            messageType:'personnel'
                        })
                },personnelPosition.refreshTime)
            }

        },
        LookAt1(obj, heading, pitch, range) {
            let target = Cesium.Cartesian3.fromDegrees(
                obj.longitude,
                obj.latitude,
                // obj.height
            );
            lookAt(
                this.viewer,
                target,
                Cesium.Math.toRadians(heading),
                Cesium.Math.toRadians(pitch),
                range
            );
        },
        //展示巡检点
        showCheckPointEntity(){
            let { viewer } = this;
            getEntitySet.call(this,{
                viewer: viewer,
                url: "actived-locators",
                show: true,
                typeMode: "checkPointType",
                messageType: 'checkPoint'
            })
        },
        //操作实体集
        operationEntity(feater){
            let _this = this;
            let { viewer } = this;

            if(feater != undefined){
                if( feater._dataTypeName == stateQuantity ){

                    let [ updateLabel ] = viewer.entities._entities._array.filter( label => label._id == feater._id ); //获取当前更新的实体
                    var image = !feater.cv ? 'open' :'close';

                    updateLabel.billboard.image = require('../../../assets/VM/'+ image +'.png'); //修改告警图片
                    updateLabel._cv = !feater.cv; //修改cv值

                    return;
                }
                if(feater._messageType == 'videos' && _this.openVideoLinkage){

                    _this.$store.commit('closeVideoLoop');   //关闭视屏监控轮播模式
                    _this.$emit('replaceVideoUrl',feater._moId);
                }
            }
        },
        addUnitViewers(){
            let { viewer } = this;
            
            viewer.entities.add({
                // position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.49693705573492' ), parseFloat( '37.71165159814374' ), parseFloat( '2.016084556743971735' ) ),
                // position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.49924330045259' ), parseFloat( '37.708638928467174' ), parseFloat( '5.038844248357202044' ) ),
                position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.49948864664668' ), parseFloat( '37.71034251365869' ), parseFloat( '5.05671606378695929' ) ),
                point : {
                    pixelSize : 5,
                    color : Cesium.Color.RED,
                    outlineColor : Cesium.Color.WHITE,
                    outlineWidth : 1
                },
                label : {
                    text : '监控中心',
                    font : '12pt monospace',
                    fillColor:Cesium.Color.RED,
                    outlineColor:Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth : 2,
                    verticalOrigin : Cesium.VerticalOrigin.TOP,
                    pixelOffset : new Cesium.Cartesian2(0, 5),
                    scaleByDistance : new Cesium.NearFarScalar(0,1,100000,0)
 
                }
            });

            viewer.entities.add({
                position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.49924330045259' ), parseFloat( '37.708638928467174' ), parseFloat( '5.038844248357202044' ) ),
                label : {
                    text : '实验路',
                    font : '12pt monospace',
                    fillColor:Cesium.Color.RED,
                    outlineColor:Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth : 2,
                    scaleByDistance : new Cesium.NearFarScalar(0,1,100000,0)
                }
            });
            viewer.entities.add({
                position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.49693705573492' ), parseFloat( '37.71165159814374' ), parseFloat( '2.016084556743971735' ) ),
                label : {
                    text : '古城大街',
                    font : '12pt monospace',
                    fillColor:Cesium.Color.RED,
                    outlineColor:Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth : 2,
                    scaleByDistance : new Cesium.NearFarScalar(0,1,100000,0)
                }
            });  

            viewer.entities.add({
                position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.50394860543004' ), parseFloat( '37.70966052720569' ), parseFloat( '2.016084556743971735' ) ),
                label : {
                    text : '古城大街',
                    font : '12pt monospace',
                    fillColor:Cesium.Color.RED,
                    outlineColor:Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth : 2,
                    scaleByDistance : new Cesium.NearFarScalar(0,1,100000,0)
                }
            });
            viewer.entities.add({
                position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.49188181547557' ), parseFloat( '37.705142503854056' ), parseFloat( '2.016084556743971735' ) ),
                label : {
                    text : '纬三路',
                    font : '12pt monospace',
                    fillColor:Cesium.Color.RED,
                    outlineColor:Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth : 2,
                    scaleByDistance : new Cesium.NearFarScalar(0,1,100000,0)
                }
            });
            viewer.entities.add({
                position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.50112409246626' ), parseFloat( '37.70230380728933' ), parseFloat( '2.016084556743971735' ) ),
                label : {
                    text : '纬三路',
                    font : '12pt monospace',
                    fillColor:Cesium.Color.RED,
                    outlineColor:Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth : 2,
                    scaleByDistance : new Cesium.NearFarScalar(0,1,100000,0)
                }
            });
            viewer.entities.add({
                position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.49158121614832' ), parseFloat( '37.710039943140714' ), parseFloat( '2.016084556743971735' ) ),
                label : {
                    text : '经三路',
                    font : '12pt monospace',
                    fillColor:Cesium.Color.RED,
                    outlineColor:Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth : 2,
                    scaleByDistance : new Cesium.NearFarScalar(0,1,100000,0)
                }
            });
            viewer.entities.add({
                position : Cesium.Cartesian3.fromDegrees( parseFloat( '112.48802838453332' ), parseFloat( '37.71123556017917' ), parseFloat( '2.016084556743971735' ) ),
                label : {
                    text : '经二路',
                    font : '12pt monospace',
                    fillColor:Cesium.Color.RED,
                    outlineColor:Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth : 2,
                    scaleByDistance : new Cesium.NearFarScalar(0,1,100000,0)
                }
            });
        },
        //销毁viewer
        destoryViewer(){
            var layers = this.viewer.scene.layers;
            for(var i=0; i<layers._layers.length;i++){
                layers.findByIndex(i).destroy()
                layers.findByIndex(i).ignoreNormal = true
                layers.findByIndex(i).clearMemoryImmediately = true
            }
            this.viewer.destroy()
        },

    },
    beforeDestroy() {
        let { handler,refreshCameraPosition,viewer,timer } = this;

        refreshCameraPosition.enable = false;
        clearInterval(this.personnelPositionTimerId);
        clearInterval(timer.timeoutId);
        clearInterval(timer.intervalId);

        if(handler != null &&　handler.isDestroyed()){
            handler.destroy();
        }
        viewer.selectedEntityChanged.removeEventListener( this.operationEntity );

        this.destoryViewer()
    },
};

</script>

<style scoped>
.content, .threedContent{
    position: relative;
    width: 100%;
    height: 100%;
}
.cesium-viewer-bottom{
    display:none
}
</style>