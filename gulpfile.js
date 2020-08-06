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

function watching() {
	watch(['sass/**/*.scss'], { ignoreInitial: false }, series(css));
}

exports.default = watching;