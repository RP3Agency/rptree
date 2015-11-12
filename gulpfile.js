// Load plugins
var gulp			= require('gulp'),
	gutil			= require('gulp-util'),
	notify			= require('gulp-notify'),
	plumber			= require('gulp-plumber'),

	// CSS preprocessors
	sass			= require('gulp-sass'),
	autoprefixer	= require('gulp-autoprefixer'),
	minifycss		= require('gulp-minify-css'),
	sourcemaps		= require('gulp-sourcemaps'),

	// JS preprocessors
	jshint			= require('gulp-jshint'),
	uglify			= require('gulp-uglify'),

	// HTML preprocessors
	extender		= require('gulp-html-extend'),
	ejs				= require('gulp-ejs'),

	// File operations
	concat			= require('gulp-concat'),
	rename			= require('gulp-rename'),
	del				= require('del'),

	// Development environment
	livereload		= require('gulp-livereload'),
	express			= require('express'),
	server			= express(),

	// Deployment
	aws_s3			= require('gulp-s3-upload')({
		region: 'us-east-1'
	});

// Disable notify if not on Mac
if( process.platform != 'darwin' ) {
	notify = notify.withReporter( function(options, callback) {
		console.log(options.message);
		callback();
	});
}

// Define gulp-plumber error handler
function logError(err) {
    gutil.log( gutil.colors.red('ERROR'), err);
	gutil.beep();
    this.emit('end');
}

// Process sass files
gulp.task('styles', function() {
  	return gulp.src( __dirname + '/src/sass/*.scss')
	.pipe( plumber(logError) )
	.pipe( sass({
		errLogToConsole: true
	}) )
	.pipe( autoprefixer({
		browsers: [ 'last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4' ]
	}) )
	.pipe( gulp.dest( __dirname + '/dist/css') )
	.pipe( minifycss() )
	.pipe( rename({
		suffix: '.min'
	}) )
	.pipe( gulp.dest( __dirname + '/dist/css') )
	// .pipe( notify({ message: 'Styles task complete', onLast: true }) )
	.pipe( livereload() );
});

// Process js files
gulp.task('scripts', function() {
	return gulp.src(__dirname + '/src/js/*.js')
	.pipe( plumber(logError) )
	.pipe( jshint(__dirname + '/src/js/.jshintrc') )
	.pipe( jshint.reporter('default') )
	.pipe( concat('rptree.js') )
	.pipe( rename({suffix: '.min'}) )
	.pipe( uglify() )
	.pipe( gulp.dest(__dirname + '/dist/js') )
	.pipe( notify({ message: 'Scripts task complete', onLast: true }) )
	.pipe( livereload() );
});

// Process html files
gulp.task('html', function(){
	return gulp.src([ __dirname + '/src/html/**/*.html', '!' + __dirname + '/src/html/_templates/**', '!' + __dirname + '/src/html/**/_*.html' ])
	.pipe( plumber(logError) )
	.pipe( extender({
		annotations: false,
		verbose: false,
		root: './src/html',
	}) )
	.pipe( ejs() )
	.pipe( gulp.dest(__dirname + '/dist') )
	.pipe( notify({ message: 'HTML task complete', onLast: true }) )
	.pipe( livereload() );
});

// Process static files
gulp.task('static', function() {
	return gulp.src(__dirname + '/src/static/**')
	.pipe( plumber(logError) )
	.pipe( gulp.dest(__dirname + '/dist') )
	.pipe( notify({ message: 'Static task complete', onLast: true }) )
	.pipe( livereload() );
});

// Process the cardboard proof of concept
gulp.task( 'cardboard', function() {
	return gulp.src( __dirname + '/src/cardboard/**' )
		.pipe( plumber( logError ) )
		.pipe( gulp.dest( __dirname + '/dist/cardboard' ) )
		.pipe( notify( { message: 'Cardboard task complete', onLast: true } ) )
		.pipe( livereload() );
});

// Clean task
gulp.task('clean', function() {
	return del([__dirname + '/dist/**']);
});

// Build task
gulp.task('build', [ 'static', 'html', 'styles', 'scripts', 'cardboard' ]);

// Rebuild task
gulp.task('rebuild', [ 'clean' ], function() {
	gulp.start( 'build' );
});

// Static file server with livereload
gulp.task('serve', function() {
	server.use( express.static(__dirname + '/dist') );
	server.listen(8080);
	gutil.log('Started development static server on localhost:8080');
	livereload.listen();
	gutil.log('LiveReload server activated');
});

// Watch task
gulp.task('watch', function() {

	gulp.watch( __dirname + '/src/sass/**/*.scss',		['styles'] );
	gulp.watch( __dirname + '/src/js/**/*.js',			['scripts'] );
	gulp.watch( __dirname + '/src/html/**/*.html',		['html'] );
	gulp.watch( __dirname + '/src/static/**/*.*',		['static'] );
	gulp.watch( __dirname + '/src/cardboard/**/*.*',	['cardboard'] )

});

// Default task
gulp.task('default', [ 'build', 'serve', 'watch' ]);

// Deploy task
gulp.task('deploy', function() {
	return gulp.src(__dirname + '/dist/**')
	.pipe( aws_s3({
		Bucket: 'rptree.com',
		ACL:    'public-read'
	}) );
});
