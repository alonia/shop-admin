'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var browserSync = require('browser-sync');
var browserSyncSpa = require('browser-sync-spa');

var util = require('util');

var proxyMiddleware = require('http-proxy-middleware');

function browserSyncInit(baseDir, browser) {
  browser = browser === undefined ? 'default' : browser;

  var routes = null;
  if(baseDir === conf.paths.src || (util.isArray(baseDir) && baseDir.indexOf(conf.paths.src) !== -1)) {
    routes = {
      '/bower_components': 'bower_components'
    };
  }

  var server = {
    baseDir: baseDir,
    routes: routes
  };

  /*
   * You can add a proxy to your backend by uncommenting the line below.
   * You just have to configure a context which will we redirected and the target url.
   * Example: $http.get('/users') requests will be automatically proxified.
   *
   * For more details and option, https://github.com/chimurai/http-proxy-middleware/blob/v0.9.0/README.md
   */
  // 代理刘易
  //server.middleware = proxyMiddleware('/shopservice', {target: 'http://192.168.2.127:8080', changeOrigin: true});
  // 代理姚东
  server.middleware = proxyMiddleware('/shopservice', {target: 'http://192.168.2.98:8081', changeOrigin: true});
  // 代理服务器
  //server.middleware = proxyMiddleware('/shopservice', {target: 'http://shop.cb.cn', changeOrigin: true});

  browserSync.instance = browserSync.init({
    startPath: '/',
    server: server,
    browser: browser
  });
}

browserSync.use(browserSyncSpa({
  selector: '[ng-app]'// Only needed for angular apps
}));

gulp.task('serve', ['cleanTmp', 'watch'], function () {
  browserSyncInit([path.join(conf.paths.tmp, '/serve'), conf.paths.src]);
});

gulp.task('serve:dist', ['cleanTmp', 'build'], function () {
  browserSyncInit(conf.paths.dist);
});

gulp.task('serve:debug', ['cleanTmp', 'cleanTest', 'buildTest'], function () {
  browserSyncInit(conf.paths.dist);
});

gulp.task('serve:e2e', ['cleanTmp', 'inject'], function () {
  browserSyncInit([conf.paths.tmp + '/serve', conf.paths.src], []);
});

gulp.task('serve:e2e-dist', ['cleanTmp', 'build'], function () {
  browserSyncInit(conf.paths.dist, []);
});

gulp.task('gitpushAll', function () {
  console.log(__dirname);
  var dir = __dirname.replace('\gulp', '');
  gulp.src([
    path.resolve(dir + '/**/*.*')
  ]).pipe(gulp.dest(path.join('D:/github/shop', '/')))
});

gulp.task('gitpush', function () {
  gulp.src([
    path.join(conf.paths.src, '/**/*.*'),
  ]).pipe(gulp.dest(path.join('D:/github/shop', '/src')))
});
