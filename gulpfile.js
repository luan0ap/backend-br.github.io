const gulp = require('gulp')
const browserSync = require('browser-sync')
const concat = require('gulp-concat')
const plumber = require('gulp-plumber')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const sass = require('gulp-sass')
const runSequence = require('run-sequence')
const { exec } = require('child_process')
const svgSymbols = require('gulp-svg-symbols')
const svgMin = require('gulp-svgmin')
const rename = require('gulp-rename')
const imagemin = require('gulp-imagemin')
const fs = require('fs-extra')

/**
 * Use hexo to generate files
 * We had some problems with the hexo's API so now
 * we're going with child_process's spawn
 */
gulp.task('hexo', function (cb) {
  const command = 'hexo generate'
  exec(command, (err, stdout, stderr) => {
    if (err) {
      return cb(err)
    }

    console.log(stdout)
    console.log(stderr)

    browserSync.reload()
    cb()
  })
})

/**
 * Process JS files
 * Match files from the theme folder
 * concat them, transpile to ES5
 * and uglify them
 */
gulp.task('process-js', function () {
  return gulp
    .src([
      './themes/backendbrasil/assets/*.js',
      './themes/backendbrasil/assets/**/*.js'
    ])
    .pipe(plumber())
    .pipe(concat('all.min.js'))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('public'))
})

gulp.task('js', ['process-js'], function (cb) {
  browserSync.reload()
  cb()
})

/**
 * Process main file from the theme folder
 */
gulp.task('process-css', function () {
  return gulp
    .src([
      './themes/backendbrasil/assets/main.scss',
      './public/css/*.css'
    ])
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(gulp.dest('public'))
})

gulp.task('css', ['process-css'], function (cb) {
  browserSync.reload()
  cb()
})

gulp.task('favicon', function () {
  const exts = '{jpg,gif,png,svg,ico}';
  return gulp
    .src([
      `./themes/backendbrasil/assets/img/favicon/*.${exts}`
    ])
    .pipe(plumber())
    .pipe(gulp.dest('./public/img/favicon/'))
})

gulp.task('images', function () {
  const exts = '{jpg,gif,png,svg}';
  return gulp
    .src([
      `./themes/backendbrasil/assets/*.${exts}`,
      `./themes/backendbrasil/assets/img/*.${exts}`
    ])
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(gulp.dest('./public/img/'))
})

gulp.task('icons', function () {
  return gulp.src('./themes/backendbrasil/assets/icons/*.svg')
    .pipe(plumber())
    .pipe(svgMin({
      plugins: [
        { removeViewBox: false },
        { removeAttrs: { attrs: 'fill' } }
      ]
    }))
    .pipe(svgSymbols({
      templates: ['default-svg'],
      svgAttrs: {
        class: 'svg-icon-lib',
        'aria-hidden': true
      }
    }))
    .pipe(rename('icons.hbs'))
    .pipe(gulp.dest('./themes/backendbrasil/layout/partials'))
})

gulp.task('server', function () {
  browserSync.init({
    server: {
      baseDir: './public'
    }
  })

  // Handlebars Files
  gulp.watch('./themes/backendbrasil/layout/*.hbs', ['hexo'])
  gulp.watch('./themes/backendbrasil/layout/**/*.hbs', ['hexo'])
  gulp.watch('./themes/backendbrasil/source/*', ['hexo'])
  gulp.watch('./themes/backendbrasil/source/**/*', ['hexo'])
  gulp.watch('./themes/backendbrasil/helper/*', ['hexo'])
  gulp.watch('./themes/backendbrasil/languages/*', ['hexo'])
  gulp.watch('./themes/backendbrasil/*.yml', ['hexo'])
  gulp.watch('./source/*', ['hexo'])
  gulp.watch('./source/**/*', ['hexo'])
  gulp.watch('./scaffolds/*', ['hexo'])
  gulp.watch('./scaffolds/**/*', ['hexo'])

  // SCSS Files
  gulp.watch('./themes/backendbrasil/assets/*.scss', ['css'])
  gulp.watch('./themes/backendbrasil/assets/**/*.scss', ['css'])

  // Image Files
  gulp.watch('./themes/backendbrasil/assets/*.{jpg,gif,png,svg}', ['images'])
  gulp.watch('./themes/backendbrasil/assets/img/*.{jpg,gif,png,svg}', ['images'])

  // Icons
  gulp.watch('./themes/backendbrasil/assets/icons/*.svg', ['icons'])

  // JS Files
  gulp.watch('./themes/backendbrasil/assets/*.js', ['js'])
  gulp.watch('./themes/backendbrasil/assets/**/*.js', ['js'])
})

gulp.task('clear-trash', function (cb) {
  fs.remove('./public/css', cb)
})

gulp.task('build', (cb) => {
  runSequence('icons', 'hexo', 'process-js', 'process-css', 'images', 'favicon', cb)
})

gulp.task('sequential-server', () => {
  runSequence('icons', 'hexo', 'js', 'css', 'images', 'favicon', 'server')
})

gulp.task('default', ['sequential-server'])
