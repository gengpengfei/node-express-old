module.exports = {
    checkLogin: function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '您未登录账号,自动为您跳转');
            return res.redirect('/users/login');
        }
        next();
    },

    checkNotLogin: function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '您已登录账号');
            return res.redirect('back');//返回之前的页面
        }
        next();
    }
};