<template>
    <!-- 管廊管理的修改管廊 -->
    <div>
       <Modal v-model="show.state" title="修改管廊">
            <Form ref="formValidate" :model="formValidate" :rules="ruleValidate" :label-width="120">
                <FormItem label="管廊名" prop="name">
                    <Input v-model="formValidate.name" placeholder="请输入新管廊名" class="InputWidth"></Input>
                </FormItem>
                <FormItem label="管廊长度" prop="length">
                    <Input v-model="formValidate.length" placeholder="请输入新管廊长度" class="InputWidth"></Input>                    </FormItem>
                <FormItem label="经度" prop="longitude">
                    <Input v-model="formValidate.longitude" placeholder="请输入经度" class="InputWidth"></Input>
                </FormItem>
                <FormItem label="纬度" prop="latitude">
                    <Input v-model="formValidate.latitude" placeholder="请输入纬度" class="InputWidth"></Input>
                </FormItem>
                <FormItem label="高度" prop="highness">
                    <Input v-model="formValidate.highness" placeholder="请输入高度" class="InputWidth"></Input>
                </FormItem>
                <FormItem label="负责人" prop="responsibility">
                    <Select v-model="formValidate.responsibilityId" placeholder="请选择负责人" class="InputWidth">
                        <Option v-for="(item,index) in staffs" :value="item.value" :key="index">{{item.label}}</Option>
                    </Select>
                </FormItem>
                <FormItem label="建筑单位" prop="construct">
                    <Select v-model="formValidate.constructId" placeholder="请选择建筑单位" class="InputWidth">
                        <Option v-for="(item,index) in companies" :value="item.value" :key="index">{{item.label}}</Option>
                    </Select>
                </FormItem>
                <FormItem label="运营单位" prop="operation">
                    <Select v-model="formValidate.operationId" placeholder="请选择运营单位" class="InputWidth">
                        <Option v-for="(item,index) in companies" :value="item.value" :key="index">{{item.label}}</Option>
                    </Select>
                </FormItem>
                <FormItem label="MaxView终端">
                    <Select v-model="formValidate.maxviewConfigId" placeholder="请选择运营单位" class="InputWidth">
                        <Option v-for="item in terminals" :value="item.id" :key="item.id">{{item.name}}</Option>
                    </Select>
                </FormItem>
            </Form>
            <div slot="footer">
                <Button type="primary" size="large" v-on:click="sendMsgtoManage('formValidate')">保存</Button>
            </div>
        </Modal> 
    </div>
</template>

<script>
export default {
    name: 'pipe-modification',
    data(){
        return {
            staffs:[],
            companies:[],
            terminals: [],
            formValidate: {
                name:'',
                length:0,
                responsibilityId:'',
                constructId:'',
                operationId:'',
                longitude:0,
                latitude:0,
                highness:0,
                maxviewConfigId: null
            },
            ruleValidate: {
                name: [
                    { required: true, message: '管廊名不能为空', trigger: 'blur' }
                ]
            },
        }
    },
    watch:{
        changeInfo:function(value,oldvalue){
            this.formValidate = JSON.parse(JSON.stringify(value));
        }
    },
    props:{
        show:{
            state:{
                default: false
            },
        },
        changeInfo:{}
    },
    mounted(){
        this.init();
    },
    methods:{
        sendMsgtoManage: function(name){
            this.$refs[name].validate((valid) => {
                if (valid) {
                    this.$emit("listenToChange",this.formValidate);
                } else {
                    this.$Message.error('修改失败');
                }
            })
        },
        init(){
            this.axios.get('/staffs').then(res =>{
                let {code,data} = res.data;
                let _staff = [];
                if(code == 200){
                    for(let i=0;i<data.length;i++){
                        let staff={};
                        staff.value = data[i].id;
                        staff.label = data[i].name;
                        _staff.push(staff);
                    }
                    this.staffs = _staff;
                }
            });
            this.axios.get('/companies').then(res =>{
                let {code,data} = res.data;
                let _company = [];
                if(code == 200){
                    for(let i=0;i<data.length;i++){
                        let company={};
                        company.value = data[i].id;
                        company.label = data[i].name;
                        _company.push(company);
                    }
                }
                this.companies = _company;
            });
            this.axios.get('maxview/list').then(res =>{
                let {code,data} = res.data
                this.terminals = data
            })
        },
    }
}
</script>

<style scoped>
.InputWidth{
    width: 85%
}
</style>



