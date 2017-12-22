var express = require("express");
var app = express();
var router = require("./router/router.js");

var session = require("express-session");
//模版引擎
app.set("view engine","ejs");

// 使用session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}))



//静态页面
app.use(express.static("./public"));
app.use("/avatar",express.static("./avatar"));

//路由表
app.get("/",router.showIndex);    //显示首页
app.get("/regist",router.showRegist);  //显示注册页面
app.get("/login",router.showLogin);  //显示登陆页面
app.post("/doregist",router.showdoRegist); //执行注册，AJAX服务
app.post("/dologin",router.showdologin); //执行注册，AJAX服务
app.get("/setAvatar",router.showSetAvatar); //设置头像页面
app.post("/doSetAvatar",router.showdoSetAvatar); //执行设置头像,AJAX服务
app.get("/cut",router.showCut); //剪裁头像页面
app.get("/docut",router.docut); //执行剪裁
app.post("/post",router.doPost);    //发表说说
app.get("/getAllShuoshuo",router.getAllShuoshuo);  //AJAX服务，列出所有说说
app.get("/getuserinfo",router.getuserinfo); //列出所有说说Ajax服务
app.get("/getshuoshuoamount",router.getshuoshuoamount) //说说总数
app.get("/user/:user",router.showUser); //显示用户所有说说
app.get("/post/:oid",router.showUser); //显示用户所有说说
app.get("/userlist",router.showuserlist); //显示用户所有说说
app.get("/exit",router.doexit); //退出
app.listen(3000);