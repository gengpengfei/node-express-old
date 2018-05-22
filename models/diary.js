//----解析markdown文本,将其转换成 html
var marked = require('marked');
var Diary = require('../lib/mongo').Diary;
var CommentModel = require('./comment');
// 给 diary 添加留言数 commentsCount
Diary.plugin('addCommentsCount', {
    afterFind: function (diarys) {
        return Promise.all(diarys.map(function (diary) {
            return CommentModel.getCommentsCount(diary._id).then(function (commentsCount) {
                diary.commentsCount = commentsCount;
                return diary;
            });
        }));
    },
    afterFindOne: function (diary) {
        if (diary) {
            return CommentModel.getCommentsCount(diary._id).then(function (count) {
                diary.commentsCount = count;
                return diary;
            });
        }
        return diary;
    }
});
//----注册方法,将markdown转换成 html
Diary.plugin('contentToHtml', {
    afterFind: function (result) {
        return result.map(function (diary) {
            diary.content = marked(diary.content);
            return diary;
        });
    },
    afterFindOne: function (diary) {
        if (diary) {
            diary.content = marked(diary.content);
        }
        return diary;
    }
});

module.exports = {

    // ----创建一篇文章
    create: function create(diary) {
        return Diary.create(diary).exec();
    },

    //----通过id获取文章
    getDiaryById:function getDiaryById(diaryId) {
        return Diary
            .findOne({_id:diaryId})
            .populate({path:'author',model:'User'})//填充字段.类似于left join
            .addCreatedAt()
            .addCommentsCount()
            .contentToHtml()//自定义插件 , 将content字段转换成html
            .exec();
    },

    //----通过id获取未经过markdowm转换的文章
    getRawDiaryById: function getRawDiaryById(author,diaryId) {
        return Diary
            .findOne({_id:diaryId})
            .populate({path:'author',model:'User'})//填充字段.类似于left join
            .addCreatedAt()
            .exec();
    },

    // 按创建时间降序获取所有用户文章或者某个特定用户的所有文章
    getDiarys: function getDiarys(author) {
        var query = {};
        if (author) {
            query.author = author;
        }
        return Diary
            .find(query)
            .populate({ path: 'author', model: 'User' })
            .sort({ _id: -1 })
            .addCreatedAt()
            .addCommentsCount()
            .contentToHtml()
            .exec();
    },

    // 通过文章 id 给 pv 加 1
    incPv: function incPv(diaryId) {
        return Diary
            .update({ _id: diaryId }, { $inc: { pv: 1 } })
            .exec();
    },

    //----通过用户 id 和文章 id 更新一篇文章
    updateDiaryById:function updateDiaryById(diaryId,author,data) {
        return Diary.update({author:author,_id:diaryId},{$set:data}).exec();
    },

    //----通过用户 id 和文章 id 删除日志
    removeDiaryById:function removeDiaryById(author,diaryId) {
        return Diary.remove({author:author,_id:diaryId}).exec()
            .then(function (res) {
            //----文章删除后，再删除该文章下的所有留言
            if (res.result.ok && res.result.n > 0) {
                return CommentModel.removeCommentsByDiaryId(diaryId);
            }
        });;
    }
};
