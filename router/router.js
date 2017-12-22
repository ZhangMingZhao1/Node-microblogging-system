var formidable = require("formidable");
var db = require("../models/db.js");
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
var formidable = require('formidable');
var gm = require("gm");

//显示主页
exports.showIndex = function (req, res, next) {

    //检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;

    } else {
        //没有登陆
        var username = ""; //制定一个空用户名
        var login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("users", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "defaultPic.jpg";
        } else {
            var avatar = result[0].avatar;
        }
        res.render("index", {
            "login": login,
            "username": username,
            "active": "主页",
            "avatar": avatar //登陆人的头像
        });
    });

};
//注册页面
exports.showRegist = function (req, res, next) {
    res.render("regist", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active": "注册"
    });
};

exports.showdoRegist = function (req, res, next) {
    //得到用户填写的东西
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        //得到表单之后做的事情
        var username = fields.username;
        var password = fields.password;
        console.log(username + " " + password);
        //查询数据库中是不是有这个人
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                //服务器错误
                res.send("-3");
                return;
            }
            if (result.length != 0) {
                res.send("-1"); //被占用
                return;
            }
            //没有这个人，可以注册了
            // console.log(result.length);
            //设置md5加密
            password = md5(password) + "lawliet";
            //现在可以证明，用户名没有被占用
            db.insertOne("users", {
                "username": username,
                "password": password,
                "avatar": "defaultPic.jpg"
            }, function (err, result) {

                // console.log(result);
                if (err) {
                    res.send("-3"); //服务器错误
                    console.log("错误");
                    return;
                }

                req.session.login = "1";
                req.session.username = username;

                res.send("1");//注册成功，写入session

            })
        });

        //保存这个人

    });
}

exports.showLogin = function (req, res, next) {
    res.render("login", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active": "登陆"
    });
}

exports.showdologin = function (req, res, next) {
    //得到用户表单
    //查询数据库,看看有没有这个人
    //有的话，进一步看看这个人的密码是否匹配
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        //得到表单之后做的事情
        var username = fields.username;
        var password = fields.password;
        var mdpassword = md5(password) + "lawliet";

        console.log(username + " " + password);
        //查询数据库中是不是有这个人
        db.find("users", {"username": username}, function (err, result) {
            //注意这个result是个数组
            if (err) {
                res.send("-5");
                return;
            }
            //没有这个人
            if (result.length == 0) {
                res.send("-1");
                return;
            }
            //有的话，进一步看看这个人的密码是否匹配
            req.session.username = username;
            req.session.login = "1";
            if (mdpassword == result[0].password) {
                res.send("1"); //登陆成功
                return;
            } else {
                res.send("-2"); //密码错误
                return;
            }
        })
    });

}

//设置头像页面，必须保证此时是登陆状态
exports.showSetAvatar = function (req, res, next) {
    if (req.session.login != "1") {
        res.send("非法闯入，这个页面要求登陆！");
        return;
    }

    res.render("setAvatar", {
        "login": true,
        "username": req.session.username || "大熊",
        "active": "更改头像"
    });

};

exports.showdoSetAvatar = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../" + "avatar");
    form.parse(req, function (err, fields, files) {
        var oldpath = files.avatar.path;
        var newpath = path.normalize(__dirname + "/../avatar") + "/" + req.session.username + ".jpg";
        fs.rename(oldpath, newpath, function (err, result) {
            if (err) {
                res.send("失败");
                return;
            }
            req.session.avatar = req.session.username + ".jpg";
            //跳转到切的业务
            res.redirect("/cut");
        })
    });
}

exports.showCut = function (req, res) {
    res.render("cut", {
        avatar: req.session.avatar
    });
}

//执行切图
exports.docut = function (req, res, next) {
    //这个页面接收几个get请求参数
    //文件名，w，h，x，y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm('./avatar/' + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write("./avatar/" + filename, function (err) {
            //为什么err为空还会运行这段代码，bug
            // if(err) {
            //     res.send("-1");
            //     return;
            // }
            //更改数据库当前用户的avatar这个值
            db.updateMany("users", {"username": req.session.username}, {
                $set: {"avatar": req.session.avatar}
            }, function () {
                //注意这里应该前端页面做返回，AJAX来实现返回效果
                res.send("1");
            })
        });


}


exports.doPost = function (req, res, next) {
    //需要用户登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆! ");
        return;
    }
    //用户名
    var username = req.session.username;
    //发表说说的表单
    //得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到表单之后做的事情
        var content = fields.content;

        //现在可以证明，用户名没有被占用
        db.insertOne("posts", {
            "username": username,
            "datetime": new Date(),
            "content": content
        }, function (err, result) {

            // console.log(result);
            if (err) {
                res.send("-3"); //服务器错误
                console.log("错误");
                return;
            }
            res.send("1");
        })
    })
}

//发表说说
exports.doPost = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    //用户名
    var username = req.session.username;

    //得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到表单之后做的事情
        var content = fields.content;

        //现在可以证明，用户名没有被占用
        db.insertOne("posts", {
            "username": username,
            "datetime": new Date(),
            "content": content
        }, function (err, result) {
            if (err) {
                res.send("-3"); //服务器错误
                return;
            }
            res.send("1"); //注册成功
        });
    });
};


//列出所有说说，有分页功能
exports.getAllShuoshuo = function(req,res,next){
    //这个页面接收一个参数，页面
    var page = req.query.page;
    db.find("posts",{},{"pageamount":20,"page":page,"sort":{"datetime":-1}},function(err,result){
        res.json(result);
    });
};


//列出某个用户的信息
exports.getuserinfo = function(req,res,next){
    //这个页面接收一个参数，页面
    var username = req.query.username;
    db.find("users",{"username":username},function(err,result){
        if(err || result.length == 0){
            res.json("");
            return;
        }
        var obj = {
            "username" : result[0].username,
            "avatar" : result[0].avatar,
            "_id" : result[0]._id,
        };
        res.json(obj);
    });
};

//说说总数
exports.getshuoshuoamount = function(req,res,next){
    db.getAllCount("posts",function(count){
        res.send(count.toString());
    });
};

//显示某一个用户的个人主页
exports.showUser = function(req,res,next){
    var user = req.params["user"];
    console.log(user);
    db.find("posts",{"username":user},function(err,result){
        db.find("users",{"username":user},function(err,result2){
            res.render("user",{
                "login": req.session.login == "1" ? true : false,
                "username": req.session.login == "1" ? req.session.username : "",
                "user" : user,
                "active" : "我的说说",
                "cirenshuoshuo" : result,
                "cirentouxiang" : result2[0].avatar
            });
        });
    });
}

//显示所有注册用户
exports.showuserlist = function(req,res,next) {
    db.find("users", {}, function (err, result) {
        res.render("userlist", {
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "active": "所有成员",
            "suoyouchengyuan": result
        });
    })
}

exports.doexit = function (req,res,next) {
    req.session.login = -1;
    req.session.username = "";
    res.render("index", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "active": "全部说说"
    });

}

