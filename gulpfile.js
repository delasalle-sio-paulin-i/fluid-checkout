// Defining settings
var settings = {
	pkg: {},
	assetsVersion: '',
	nodePath: './node_modules/',
	jsPath: './js-src/'
};

// Defining requirements
var gulp = require('gulp');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var cssnano = require('gulp-cssnano');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var replace = require('gulp-replace');
var loadJsonFile = require('load-json-file');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');



// Run:
// gulp update-ver
// Starts watcher. Watcher runs appropriate tasks on file changes
gulp.task( 'update-ver', gulp.series( function( done ) {
	var json = loadJsonFile.sync( 'package.json' );
	settings.pkg = json;
	settings.assetsVersion = '-' + json.version.replace( /\./gi, '' );

	gulp.src( ['./fluid-checkout.php'] )
	// See http://mdn.io/string.replace#Specifying_a_string_as_a_parameter
	.pipe(replace(/Version: (.)*/g, 'Version: ' + settings.pkg.version ))
	.pipe(gulp.dest('./'));

	done();
} ) );


// Run:
// gulp update-ver
// Starts watcher. Watcher runs appropriate tasks on file changes
gulp.task( 'update-ver-release', gulp.series( 'update-ver', function( done ) {
	var today = new Date();
	var json = loadJsonFile.sync( 'package.json' );
	settings.pkg = json;
	settings.assetsVersion = '-' + json.version.replace( /\./gi, '' );

	gulp.src( ['./readme.txt'] )
	// See http://mdn.io/string.replace#Specifying_a_string_as_a_parameter
	.pipe(replace(/Stable tag: (.)*/g, 'Stable tag: ' + settings.pkg.version ))
	.pipe(replace(/= Unreleased (.)*/g, '= ' + settings.pkg.version + ' - ' + today.toISOString().slice(0, 10) + ' =' ))
	.pipe(gulp.dest('./'));

	done();
} ) );



// Run:
// gulp clean-css
// Delete existing generated css files
gulp.task( 'clean-css', function( done ) {
	del.sync( [ './css' ] );
	done();
} );



// Run:
// gulp clean-js
// Delete existing generated js files
gulp.task( 'clean-js', function( done ) {
	del.sync( [ './js' ] );
	done();
} );



// Run:
// gulp build-css
// Builds css from scss and apply other changes.
gulp.task( 'build-css', gulp.series( 'update-ver', 'clean-css', function( done ) {
	gulp.src([
		'./sass/*.scss',
	] )
	.pipe(plumber())
	.pipe(sourcemaps.init())
	.pipe(sass())
	.pipe(autoprefixer({ cascade: false }))
	.pipe(rename({suffix: settings.assetsVersion}))
	.pipe(gulp.dest('./css/')) // save .css
	.pipe(cssnano( { zindex:false, discardComments: {removeAll: true}, discardUnused: {fontFace: false}, reduceIdents: {keyframes: false} } ) )
	.pipe(rename( { suffix: '.min' } ) )
	.pipe(sourcemaps.write('maps'))
	.pipe(gulp.dest('./css/')); // save .min.css


	// THEME COMPATIBILITY FILES
	gulp.src([
		'./sass/compat/themes/*.scss',
	] )
	.pipe(plumber())
	.pipe(sourcemaps.init())
	.pipe(sass())
	.pipe(autoprefixer({ cascade: false }))
	.pipe(rename({suffix: settings.assetsVersion}))
	.pipe(gulp.dest('./css/compat/themes/')) // save .css
	.pipe(cssnano( { zindex:false, discardComments: {removeAll: true}, discardUnused: {fontFace: false}, reduceIdents: {keyframes: false} } ) )
	.pipe(rename( { suffix: '.min' } ) )
	.pipe(sourcemaps.write('maps'))
	.pipe(gulp.dest('./css/compat/themes/')); // save .min.css

	done();
} ) );



// Run:
// gulp build-js.
// Uglifies and concat all JS files into one
gulp.task( 'build-js', gulp.series( 'update-ver', 'clean-js', function( done ) {

	// LIBRARIES
	gulp.src([
		settings.nodePath + 'require-polyfills/dist/require-polyfills.js',
		settings.nodePath + 'require-polyfills/dist/polyfill-*.js',
		settings.nodePath + 'require-bundle-js/dist/require-bundle.js',

		settings.nodePath + 'animate-helper/dist/animate-helper.js',
		settings.nodePath + 'collapsible-block/dist/collapsible-block.js',
		settings.nodePath + 'flyout-block/dist/flyout-block.js',
		settings.nodePath + 'mailcheck/src/mailcheck.js',
		settings.nodePath + 'sticky-states/dist/sticky-states.js',
		settings.nodePath + 'wicg-inert/dist/inert.js',
	])
	.pipe(rename({suffix: settings.assetsVersion}))
	.pipe(gulp.dest('./js/lib/')) // save .js
	.pipe(uglify())
	.pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('./js/lib/')); // save .min.js

	// JS FILES
	gulp.src([
		settings.jsPath + '*.js',
	])
	.pipe(rename({suffix: settings.assetsVersion}))
	.pipe(gulp.dest('./js/')) // save .js
	.pipe(sourcemaps.init())
	.pipe(uglify())
	.pipe(rename({suffix: '.min'}))
	.pipe(sourcemaps.write('maps'))
	.pipe(gulp.dest('./js/')); // save .min.js

	// JS ADMIN FILES
	gulp.src([
		settings.jsPath + 'admin/*.js',
	])
	.pipe(rename({suffix: settings.assetsVersion}))
	.pipe(gulp.dest('./js/admin/')) // save .js
	.pipe(sourcemaps.init())
	.pipe(uglify())
	.pipe(rename({suffix: '.min'}))
	.pipe(sourcemaps.write('maps'))
	.pipe(gulp.dest('./js/admin/')); // save .min.js

	done();
} ) );



// Run:
// gulp watch
// Starts watcher. Watcher runs appropriate tasks on file changes
gulp.task( 'watch', function ( done ) {
	gulp.watch('./sass/**/*.scss', gulp.series( 'build-css' ) );
	gulp.watch('./js-src/**/*.js', gulp.series( 'build-js' ) );
	gulp.watch('./package.json', gulp.series( 'build' ) );

	done();
} );



// Run:
// gulp build
// Build css and js assets
gulp.task( 'build', gulp.series( gulp.parallel( 'build-js', 'build-css' ) ) );



// Run:
// gulp
// Defines gulp default task
gulp.task( 'default', gulp.series( 'watch' ) );
