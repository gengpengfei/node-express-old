var path = require('path');
var assert = require('assert');
var request = require('supertest');
var app = require('../app');
var User = require('../lib/mongo').User;

var testName1 = 'testName1';
var testName2 = 'nswbmw';
//第一句是测试描述
describe('users 模块', function() {
    describe('POST/reg', function() {
        //----传入应用程序来实例化app
        var agent = request.agent(app);//persist cookie when redirect
        //----beforeEach 在开始测试之前先登录用户
        beforeEach(function (done) {
            // 创建一个用户
            User.create({
                name: testName1,
                password: '123456',
                avatar: '',
                gender: 'x',
                bio: ''
            })
                .exec()
                .then(function () {
                    done();
                })
                .catch(done);
        });
        //----afterEach  在测试完成之后删除测试用户
        afterEach(function (done) {
            // 删除测试用户
            User.remove({ name: { $in: [testName1, testName2] } })
                .exec()
                .then(function () {
                    done();
                })
                .catch(done);
        });

        // 用户名错误的情况
        it('wrong name', function(done) {
            agent
                .post('/users/reg')
                .type('form')
                .attach('avatar', path.join(__dirname, 'avatar.jpg'))
                .field({ name: '' })
                .redirects()
                .end(function(err, res) {
                    if (err) return done(err);
                    assert(res.text.match(/名字请限制在 1-10 个字符/));
                    done();
                });
        });
        // 性别错误的情况
        it('wrong gender', function(done) {
            agent
                .post('/users/reg')
                .type('form')
                .attach('avatar', path.join(__dirname, 'avatar.jpg'))
                .field({ name: testName2,password: '123456', repassword: '123456',gender: 'a' })
                .redirects()
                .end(function(err, res) {
                    if (err) return done(err);
                    assert(res.text.match(/性别只能是 m、f 或 x/));
                    done();
                });
        });

        // 用户名被占用的情况
        it('duplicate name', function(done) {
            agent
                .post('/users/reg')
                .type('form')
                .attach('avatar', path.join(__dirname, 'avatar.jpg'))
                .field({ name: testName1, gender: 'm', bio: 'noder', password: '123456', repassword: '123456' })
                .redirects()
                .end(function(err, res) {
                    if (err) return done(err);
                    assert(res.text.match(/用户名已被占用/));
                    done();
                });
        });

        // 注册成功的情况
        it('success', function(done) {
            agent
                .post('/users/reg')
                .type('form')
                .attach('avatar', path.join(__dirname, 'avatar.jpg'))
                .field({ name: testName2, gender: 'm', bio: 'noder', password: '123456', repassword: '123456' })
                .redirects()
                .end(function(err, res) {
                    if (err) return done(err);
                    assert(res.text.match(/注册成功/));
                    done();
                });
        });
    });
});