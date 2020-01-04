const { series, dest, src, watch } = require('gulp');
const sass = require('gulp-sass');
// const uglify = require('gulp-uglify');
// const concat = require('gulp-concat');

sass.compiler = require('node-sass');

async function css() {
	return src(['sass/index.scss'], { allowEmpty: true })
		.pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
		.pipe(dest('./public/css'));
};

// function jsMinify() {
// 	return src(['js/page/**/*.js', 'js/thirdParty/**/*.js'], { allowEmpty: true })
// 		.pipe(uglify().on('error', (e) => { console.log({ e }) }))
// 		.pipe(dest('./dist/js'));
// }

// function jsAsIs() {
// 	return src(['js/page/**/*.js', 'js/thirdParty/**/*.js'], { allowEmpty: true })
// 		.pipe(dest('./dist/js'));
// }

// function jsBundle() {
// 	return src(['./js/siteWide.js'], { allowEmpty: true })
// 		.pipe(concat('bundle.js', { allowEmpty: true }))
// 		// .pipe(uglify())
// 		.pipe(dest('./dist/js'));
// }

function watching() {
	watch(['sass/**/*.scss'], { ignoreInitial: false }, series(css));
}

exports.default = watching;