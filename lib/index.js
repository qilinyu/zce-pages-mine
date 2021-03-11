const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
const swig = require('gulp-swig')
// const imagemin = require('gulp-imagemin')

const browserSync = require('browser-sync')
const bs = browserSync.create()

let config = {}
const cwd = process.cwd()
try {
  const loadConfig = require(`${cwd}/page.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) {}


const clean = () => {
  return del(['dist', 'temp'])
}

const style = () => {
  return src('src/assets/styles/*.scss', { base: 'src' })
  // .pipe(plugins.sass({ outputStyle: 'expanded' }))
  .pipe(dest('temp'))
}

const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
  .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
  .pipe(dest('temp'))
}

const page = () => {
  return src('src/*.html', { base: 'src' })
  .pipe(swig({data: config.pageData, defaults: { cache: false }})) // cache 防止模板缓存导致页面不能及时更新
  .pipe(dest('temp'))
}

const image = () => {
  return src('src/assets/images/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const font = () => {
  return src('src/assets/fonts/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const extra = () => {
  return src('public/**', { base: 'public' })
    .pipe(dest('dist'))
}

const useref = () => {
  return src('temp/*.html', { base: 'temp' })
    .pipe(plugins.useref({ searchPath: ['temp', '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest('dist'))
}

const serve = () => {
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', page)
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ], bs.reload)
  bs.init({
    // open: false,
    files: 'temp/**',
    server: {
      baseDir: ['temp', 'src', 'public'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const compile = parallel(style, script, page)

// 上线之前执行的任务
const build =  series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra
  )
)

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}