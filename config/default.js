module.exports = {
    port: 3000,
    session: {
        secret: 'gpf',
        key: 'gpf',
        maxAge: 2592000000
    },
    mongodb: 'mongodb://localhost:27017/local'
};