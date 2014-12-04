/**
 * Establish our gulp/node plugins for this project.
 */
var gulp			= require('gulp'),

	// Sass/Compass/related CSSy things
	sass			= require('gulp-ruby-sass'),
	autoprefixer	= require('gulp-autoprefixer'),
	minifycss		= require('gulp-minify-css'),
	sourcemaps		= require('gulp-sourcemaps'),

	// JavaScript
	jshint			= require('gulp-jshint'),
	uglify			= require('gulp-uglify'),

	// File system
	concat			= require('gulp-concat'),
	rename			= require('gulp-rename'),
	del				= require('del'),

	// Notifications and error handling
	gutil			= require('gulp-util');

/**
 * Set our source and destination variables
 */
var // Project
	project			= 'rptree',	// a short code for establishing things like
								// the resulting JavaScript file, etc.

	// Source files
	src				= __dirname + '/src',
	src_js			= src + '/js',
	src_js_vendor	= src_js + '/vendor',
	src_js_plugins	= src_js + '/plugins',
	src_sass		= src + '/sass',
	src_html		= src + '/html',
	src_images		= src + '/images',

	// Destination files, WordPress
	dest			= __dirname + '/www',
	dest_js			= dest + '/js',
	dest_css		= dest + '/css',
	dest_images		= dest + '/images';

/**
 * Now, let's do things.
 */


// Styles
gulp.task('styles', function() {
	console.log(src_sass + '/*.scss');
	return gulp.src(src_sass + '/*.scss')
		.pipe(sass({
			bundleExec: true,
			require: ['breakpoint']
		}))
		.on( 'error', gutil.log )
		.pipe(sourcemaps.init())
		.pipe(autoprefixer({
			browsers: ['last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4']
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(dest_css))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(minifycss())
		.pipe(gulp.dest(dest_css));
});


// Scripts task: JSHint & minify custom js
gulp.task('scripts-custom', function() {
	return gulp.src(src_js + '/*.js')
		.pipe(jshint(__dirname + '/.jshintrc'))
		.pipe(jshint.reporter('default'))
		.pipe(concat(project + '.js'))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.on('error', gutil.log)
		.pipe(gulp.dest(dest_js));
});

// Scripts task: Plugins
gulp.task('scripts-plugins', function() {
	return gulp.src(src_js_plugins + '/*.js')
		.pipe(concat(project + '-plugins.js'))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.on('error', gutil.log)
		.pipe(gulp.dest(dest_js));
});

// Scripts task: Vendor
gulp.task('scripts-vendor', function() {
	return gulp.src(src_js_vendor + '/*.js')
		.pipe(concat(project + '-vendor.js'))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.on('error', gutil.log)
		.pipe(gulp.dest(dest_js));
});

// Scripts task: run the three other scripts tasks
gulp.task('scripts', function() {
	gulp.start('scripts-custom');
	gulp.start('scripts-plugins');
	gulp.start('scripts-vendor');
});


// Images: for now, just move them into /www/, but we really should be imageminning them
gulp.task('images', function() {
	var filesToMove = [ src_images + '/**/*.*' ];

	return gulp.src(filesToMove)
		.pipe(gulp.dest(dest_images));
})


// Clean
gulp.task('clean', function() {
	del( [dest + '/*'], function( err ) {
		console.log( 'Web directory contents deleted.' );
	});
});


// build-www: build web (html) files to the www directory
gulp.task('build-www', function() {
	var filesToMove = [
		src_html + '/**/*.*',
		src_html + '/**/.htaccess'
	];

	return gulp.src(filesToMove, { base: src_html })
		.pipe(gulp.dest(dest));
});

// build: run the build-www, CSS & JS processing tasks
gulp.task('build', ['styles', 'scripts', 'images'], function() {
	gulp.start('build-www');
});


// Dist: much like build, except clean our destination first.
gulp.task('dist', ['clean'], function() {
	gulp.start('build');
});

// Default: right now, just running build
gulp.task('default', function() {
	gulp.start('build');
});


// Watch: watch our files and do things when they change
gulp.task('watch', function() {
	gulp.start('default');

	// Watch .scss files
	gulp.watch( src_sass + '/**/*.scss', ['styles'] );

	// Watch custom JavaScript files
	gulp.watch( src_js + '/*.js', ['scripts-custom'] );

	// Watch HTML files
	gulp.watch( src_html + '/**/*.*', ['build-www'] );

	// Watch image files
	gulp.watch( src_images + '/**/*.*', ['images'] );
});
