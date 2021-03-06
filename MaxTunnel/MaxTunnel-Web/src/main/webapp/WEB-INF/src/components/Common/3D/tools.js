import Vue from 'vue'
import {
    doSqlQuery,
    getJson,
    processFailed,
    _getFieldValues,
} from "../../../scripts/commonFun";
import eventBus from '../../../assets/Bus'

export default {
    data(){
        return {
            modelProp:{ //展示信息模态框
                show:{
                    state:false
                },
                showButton:false, //关闭底部按钮
                tilteProps:{
                    tilte:'详情', //对话框标题
                    backgroundColor:'#2D8CF0'
                },
                data:[],//属性集
            },
            model:{  //描述模态框
                show:{
                    state:false
                },
                tilteProps:{
                    tilte:'清除详情', //对话框标题
                },
            },
        }
    },
    computed:{
        entityHeight(){
            return Vue.prototype.VMConfig.entityHeight
        }
    },
    mounted(){

        if( this.openPlanPosition.openPosition ){

            eventBus.$on('getPlanPosition',({ objectId,range,processName })=>{
                doSqlQuery.call(this,this.viewer,'MOID in ('+ '7001'.toString() +')',this.SuperMapConfig.BIM_DATA,this.searchPlanCompleted,processFailed,range,processName)
            });
        }
        
    },
    methods:{
        //设置相机视角
        setViewAngle(){
            let { scene,cameraPosition } = this;

            if(Cesium.defined(scene)){
                scene.camera.setView({
                    destination : new Cesium.Cartesian3.fromDegrees(cameraPosition.longitude,cameraPosition.latitude,cameraPosition.height),
                    orientation : {
                        heading : cameraPosition.heading,
                        pitch : cameraPosition.pitch,
                        roll : cameraPosition.roll
                    }
                });
            }
        },
        //隐藏所有实体
        hideAllEntitys(){
            let {　viewer　} = this;

            viewer.entities._entities._array.forEach(entitie => entitie._show = true);
        },
        showDesModel(){
            this.model.show.state = true;
        },
        removeByEntityId(entity){
            let { viewer } = this;

            this.modelProp.show.state = false;
            viewer.entities.remove(entity);
        },
        eventNotie(){
            let _this = this;
            let day = Vue.prototype.VMConfig.searchEventsDay;

            getJson(`events/day/${ day }`).then(data => {

                data.forEach( event => {

                    _this.addEventEntitys(event); //添加事件实体
                    Vue.prototype.IM.addInformation('events',event);
                })

            })
        },
        addEventEntitys(event){
            let { viewer,entityHeight } = this;
            let height = Vue.prototype.VMConfig.entityHeight;
            let color = event.level == 1 ? '#57a3f3' :( event.level == 2 ? '#f90' : '#ed4014' );

            this.addEllipseViewer({
                baseProp:{
                    id:event.id,
                    _moId:event.id,
                    messageType:'events',
                },
                position:{
                    X:event.longitude,
                    Y:event.latitude,
                    Z:entityHeight,
                },
                ellipse:{
                    R:7,
                    H:entityHeight,
                    color
                }
            })
        },
        searchPlanCompleted( viewer,range,processName ){
            let _this = this;
            let { entityHeight } = this;

            return function (queryEventArgs) {
                let selectedFeatures = queryEventArgs.originResult.features;
                viewer.entities.removeById( 7001 );

                for(let i=0;i<selectedFeatures.length;i++){

                    _this.addEllipseViewer({
                        baseProp:{
                            id:7001,
                        },
                        position:{
                            X:_getFieldValues(selectedFeatures[i],'X'),
                            Y:_getFieldValues(selectedFeatures[i],'Y'),
                            Z:entityHeight,
                        },
                        ellipse:{
                            R:range,
                            H:entityHeight,
                            color:'#57a3f3'
                        }
                    })
                }

            }
        },
        addEllipseViewer({ baseProp,...typePara }){
            let { viewer } = this;
            
            let viewerType = this.addViewerType( typePara );

            let entity = viewer.entities.add( Object.assign({},baseProp,viewerType) );

            // this.addParticleSystem({ entity,viewer });
            console.log('viewer.entities',viewer.entities)

        },
        addViewerType({ position,ellipse,billboard,label }){

            let viewerPosition = position !== undefined ? {
                position : Cesium.Cartesian3.fromDegrees( parseFloat( position.X ), parseFloat( position.Y ), parseFloat( position.Z ) )
                }:{};

            let ellipseViewProp = ellipse !== undefined ? {
                ellipse:{
                    semiMinorAxis :ellipse.R ,
                    semiMajorAxis : ellipse.R,
                    height : ellipse.H,
                    outline : true,
                    outlineColor : Cesium.Color.fromAlpha( Cesium.Color.fromCssColorString( ellipse.color ), .8 ),
                    material : Cesium.Color.fromAlpha( Cesium.Color.fromCssColorString( ellipse.color ), .6 )
                }
            }:{};

            let billboardViewProp = billboard !== undefined ? billboard : {};

            let labelViewProp = label !== undefined ? {
                label:{
                    text:label.labelText,
                    font:'20px Helvetica',
                    fillColor:Cesium.Color.WHITE,
                    outlineColor:Cesium.Color.WHITE,
                }
            
            }:{};

            return Object.assign({},viewerPosition,ellipseViewProp,billboardViewProp,labelViewProp);
        },
        addParticleSystem(minxisParticleSystem){

            let ParticleSystem = {
                rate : 5.0,
                minimumLife : 1.0,
                maximumLife : 1.0,
                minimumSpeed : 5.0,
                maximumSpeed : 5.0,
                startScale : 1.0,
                endScale : 4.0,
                particleSize : 50.0,
                transX : 2.5,
                transY : 4.0,
                transZ : 1.0,
                heading : 0.0,
                pitch : 0.0,
                roll : 0.0,
                entity : null,
                particleSystem : null,
                viewer : null,
                initParaList : null,
                init() {
                    this.initParaList = this.initParameter();
                    this.initParticleSystem();
                },
                initParticleSystem(){

                    this.particleSystem = this.viewer.scene.primitives.add(new Cesium.ParticleSystem({
                        image : require('../../../assets/VM/fire.png'),

                        startColor : Cesium.Color.RED.withAlpha(0.7),
                        endColor : Cesium.Color.YELLOW.withAlpha(0.3),

                        startScale : this.startScale,
                        endScale : this.endScale,

                        minimumLife : this.minimumLife,
                        maximumLife : this.maximumLife,

                        minimumSpeed : this.minimumSpeed,
                        maximumSpeed : this.maximumSpeed,

                        minimumWidth : this.particleSize,
                        minimumHeight : this.particleSize,

                        maximumWidth : this.particleSize,
                        maximumHeight : this.particleSize,

                        // Particles per second.
                        rate : this.rate,

                        lifeTime : 16.0,

                        emitter : new Cesium.CircleEmitter(0.5),

                        emitterModelMatrix : this.computeEmitterModelMatrix(),

                        forces : [this.applyGravity]
                    }));

                    this.startRefreshPosition();
                },
                initParameter(){
                    let emitterModelMatrix = new Cesium.Matrix4();
                    let translation = new Cesium.Cartesian3();
                    let rotation = new Cesium.Quaternion();
                    let hpr = new Cesium.HeadingPitchRoll();
                    let trs = new Cesium.TranslationRotationScale();

                    let gravityScratch = new Cesium.Cartesian3();

                    let entityOrientation = new Cesium.Quaternion();
                    let rotationMatrix = new Cesium.Matrix3();
                    var modelMatrix = new Cesium.Matrix4();

                    return {
                        emitterModelMatrix,
                        translation,
                        rotation,
                        hpr,
                        trs,
                        gravityScratch,
                        entityOrientation,
                        rotationMatrix,
                        modelMatrix
                    }
                },
                //计算粒子发射器位置矩阵
                computeEmitterModelMatrix(){
                    let { emitterModelMatrix,translation,rotation,hpr,trs } = this.initParaList;

                    //方向
                    hpr = Cesium.HeadingPitchRoll.fromDegrees(this.heading, this.pitch, this.roll, hpr);
                    //以实体中心为圆点偏移
                    trs.translation = Cesium.Cartesian3.fromElements(this.transX, this.transY, this.transZ, translation);
                    trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr, rotation);

                    return Cesium.Matrix4.fromTranslationRotationScale(trs, emitterModelMatrix);
                },
                //重力效果
                applyGravity(p, dt){
                    let gravityScratch = new Cesium.Cartesian3();
                    let position = p.position;
                    let gravity = 0.0;

                    Cesium.Cartesian3.normalize(position, gravityScratch);
                    Cesium.Cartesian3.multiplyByScalar(gravityScratch, gravity * dt, gravityScratch);

                    p.velocity = Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity);
                },
                //计算当前时间点飞机模型的位置矩阵
                computeModelMatrix(entity, time){
                    let { entityPosition,entityOrientation,rotationMatrix,modelMatrix } = this.initParaList;

                    //获取位置
                    let position = Cesium.Property.getValueOrUndefined(entity.position, time, entityPosition);

                    if (!Cesium.defined(position)) {
                        return undefined;
                    }
                    //获取方向
                    let orientation = Cesium.Property.getValueOrUndefined(entity.orientation, time, entityOrientation);

                    if (!Cesium.defined(orientation)) {
                        modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, modelMatrix);
                    } else {
                        modelMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(orientation, rotationMatrix), position, modelMatrix);
                    }
                    return modelMatrix;
                },
                //刷新位置
                startRefreshPosition(){
                    let { viewer } = this;

                    viewer.scene.preRender.addEventListener(this.refreshPositionCallback.call(this));
                },
                //关闭刷新
                close(){
                    let { viewer } = this;

                    viewer.scene.preRender.removeEventListener(this.refreshPositionCallback);
                },
                refreshPositionCallback(){
                    let _this = this;
                    return function (scene,time) {

                        _this.particleSystem.modelMatrix = _this.computeModelMatrix(_this.entity, time);
                        //监测发射器模型矩阵的任何变化
                        _this.particleSystem.emitterModelMatrix = _this.computeEmitterModelMatrix();
                    }
                },
            };

            Object.assign(ParticleSystem,minxisParticleSystem);

            ParticleSystem.init();
        },
        
    }
}