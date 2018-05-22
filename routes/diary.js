var express = require('express');
var router = express.Router();
//----引入模型文件
var DiaryModel = require('../models/diary');
var CommentModel = require('../models/comment');
var checkLogin = require('../middlewares/check').checkLogin;

//----首页路由
router.get('/index',function(req, res, next) {
    var author = req.query.author;
    DiaryModel.getDiarys(author)
        .then(function (diary) {
            res.render('diary/index', {
                diary: diary
            });
        })
        .catch(next);
});
//----日志详情页
router.get('/info/:diaryId',function (req,res,next) {
    var diaryId = req.params.diaryId;
    Promise.all([
        DiaryModel.getDiaryById(diaryId),// 获取文章信息
        CommentModel.getComments(diaryId),// 获取该文章所有留言
        DiaryModel.incPv(diaryId)// pv 加 1
    ])
    .then(function (result) {
        var diary = result[0];
        var comments = result[1];
        if (!diary) {
            throw new Error('该文章不存在');
        }
        res.render('diary/info', {
            diary: diary,comments: comments
        });
    })
    .catch(next);
});
//----创建日志页面
router.get('/create',checkLogin, function(req, res, next) {
    res.render('diary/create');
});
//----提交创建日志
router.post('/create',checkLogin, function(req, res, next) {
    author = req.session.user._id;
    title = req.fields.title;
    content = req.fields.content;
    //----参数校验
    try{
        if(!title.length)
            throw new Error("请填写标题");
        if(!content.length)
            throw new Error("请填写内容");
    }
    catch (e){
        req.flash('error', e.message);
        return res.redirect('back');
    }

    // 待写入数据库的用户信息
    var diary = {
        author: author,
        title: title,
        content: content,
        pv: 0
    };
    DiaryModel.create(diary)
        .then(function (result) {
            _id = result.ops[0]._id;
            req.flash('success','日志添加成功');
            return res.redirect('/diary/info/'+_id);
        })
        .catch(next)
});
//----删除日志
router.get('/remove/:diaryId',checkLogin,function (req,res,next) {
    _id = req.params.diaryId;
    var author = req.session.user._id;
    DiaryModel.removeDiaryById(author,_id)
        .then(function (result) {
            req.flash('success','您的日志已经移除');
            return res.redirect('/diary/index');
        })
        .catch(next)
});
//----编辑日志页面
router.get('/edit/:diaryId',checkLogin,function (req,res,next) {
    _id = req.params.diaryId;
    var author = req.session.user._id;
    DiaryModel.getRawDiaryById(author,_id)
        .then(function (result) {
            if(!result)
                throw new Error("该日志不存在,请刷新页面重试");
            if(author.toString() !== result.author._id.toString()){
                throw new Error("权限不足");
            }
            res.render('diary/edit',{diary:result})
        })
        .catch(next)
});
//----提交编辑
router.post('/edit/:diaryId',checkLogin,function (req,res,next) {
    var author = req.session.user._id;
    _id = req.fields._id;
    title = req.fields.title;
    content = req.fields.content;
    DiaryModel.updateDiaryById(_id,author,{title:title,content:content})
        .then(function (result) {
            req.flash('success', '编辑文章成功');
            // 编辑成功后跳转到上一页
            res.redirect('/diary/info/'+_id);
        })
        .catch(next)
});
//----创建留言
router.post('/comment/:diaryId',checkLogin,function (req,res,next) {
    var author = req.session.user._id;
    var diaryId = req.params.diaryId;
    var content = req.fields.content;
    var comment = {
        author: author,
        diaryId:diaryId,
        content: content
    }
    CommentModel.create(comment)
        .then(function (result) {
            req.flash('success', '留言成功');
            // 留言成功后跳转到上一页
            res.redirect('back');
        })
        .catch(next)

});
//----删除留言
router.get('/removeComment/:commentId', checkLogin, function(req, res, next) {
    var commentId = req.params.commentId;
    var author = req.session.user._id;

    CommentModel.removeCommentById(commentId, author)
        .then(function () {
            req.flash('success', '删除留言成功');
            // 删除成功后跳转到上一页
            res.redirect('back');
        })
        .catch(next);
});
module.exports = router;