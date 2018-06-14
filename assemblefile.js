var _ = require('underscore');
var fs = require('fs');
var del = require('del');
var path = require('path');
var less = require('gulp-less');
var postcss = require('gulp-postcss');
var assemble = require('assemble');
var htmlmin = require('gulp-htmlmin');
var extname = require('gulp-extname');
var watch = require('gulp-watch');
var argv = require('minimist')(process.argv.slice(2));
var createServer = require('http-server').createServer;
var cleanCSS = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var changed = require('gulp-changed');
var app = assemble();

var DEST = './dist';
var SRC = './src';
var STYLES_TO_COMPILE = 'style.less';
var SERVER = !!(argv.server || argv.s);
var COMPRESSION = !!(argv.compression || argv.c);
var SERVER_PORT = 8080;

var paths =
{
	src:
	{
		config:		path.join(SRC, 'config.json'),
		assets:		path.join(SRC, 'assets/**/*'),
		styles:		path.join(SRC, 'less/**/*'),
		layouts:	path.join(SRC, 'layouts/**/*.hbs'),
		pages:		path.join(SRC, 'pages/**/*.hbs'),
	},
	dest:
	{
		assets:	path.join(DEST, 'assets'),
		styles:	path.join(DEST, 'assets'),
		site:	path.join(DEST)
	}
};

function loadConfig()
{
	console.log('Loading config file');
	
	try
	{
		var config = fs.readFileSync(paths.src.config);
		app.cache.data = (JSON.parse(config));
	}
	catch(_)
	{

	}
}

function compileHTML(path)
{
	console.log('Compiling HTML file(s)\n\t', _.flatten([path]).join('\n\t'));

	return app.src(path)
		.pipe(htmlmin())
		.pipe(extname())
		.pipe(app.renderFile())
		.pipe(app.dest(paths.dest.site));
}

function compileStyles()
{
	console.log('Compiling styles');

	var mainLessFiles = _.flatten([STYLES_TO_COMPILE]).map(function(file)
	{
		return path.join(SRC, '/less/', file);
	});

	var stream = app.src(mainLessFiles);

	if(COMPRESSION)
	{
		stream = stream.pipe(less())
					.pipe(cleanCSS());
	}
	else
	{
		stream = stream.pipe(sourcemaps.init())
					.pipe(less().on('error', function(err)
					{
						gutil.log(err);
						this.emit('end');
					}))
					.pipe(postcss([require('autoprefixer')]))
					.pipe(sourcemaps.write('./'));
	}

	return stream.pipe(app.dest(paths.dest.styles));
}

function copyAssets(path)
{
	console.log('Copying asset file(s)\n\t', _.flatten([path]).join('\n\t'));

	return app.src(path)
			.pipe(changed(paths.dest.assets))
			.pipe(app.dest(paths.dest.assets));
}

app.task('html', function()
{
	return compileHTML(paths.src.pages);
});

app.task('assets', function()
{
	return copyAssets(paths.src.assets);
});

app.task('styles', function()
{
	return compileStyles();
});

app.task('default', ['html', 'styles', 'assets']);

app.task('watch', ['default'], function()
{
	//Watch layouts
	watch(paths.src.layouts, function(vinyl)
	{
		if(vinyl.event == 'unlink') return;
		app.layouts(paths.src.layouts);
		return compileHTML(paths.src.pages);
	});

	//Watch pages
	watch(paths.src.pages, function(vinyl)
	{
		if(vinyl.event == 'unlink') return;
		return compileHTML(vinyl.path);
	});

	//Watch styles
	watch(paths.src.styles, function(vinyl)
	{
		if(vinyl.event == 'unlink') return;
		return compileStyles();
	});

	//Watch assets
	watch(paths.src.assets, function(vinyl)
	{
		if(vinyl.event == 'unlink') return;
		return copyAssets(paths.src.assets);
		// return copyAssets(vinyl.path);
	});

	//Watch config
	watch(paths.src.config, function(vinyl)
	{
		if(vinyl.event == 'unlink') return;
		
		console.log('CONFIG FILE CHANGED, YOU NEED TO RESTART THE PROCESS');
		process.exit();

		// loadConfig();
		// return compileHTML(paths.src.pages);
	});
});

app.layouts(paths.src.layouts);

app.helpers('ifCond', function(v1, operator, v2, options)
{
	switch (operator)
	{
		case '==':
			return (v1 == v2) ? options.fn(this) : options.inverse(this);
		case '===':
			return (v1 === v2) ? options.fn(this) : options.inverse(this);
		case '<':
			return (v1 < v2) ? options.fn(this) : options.inverse(this);
		case '<=':
			return (v1 <= v2) ? options.fn(this) : options.inverse(this);
		case '>':
			return (v1 > v2) ? options.fn(this) : options.inverse(this);
		case '>=':
			return (v1 >= v2) ? options.fn(this) : options.inverse(this);
		case '&&':
			return (v1 && v2) ? options.fn(this) : options.inverse(this);
		case '||':
			return (v1 || v2) ? options.fn(this) : options.inverse(this);
		default:
			return options.inverse(this);
	}
});

loadConfig();

del(path.join(DEST, '**/*'));

if(SERVER)
{
	var server = createServer({ root: DEST });
	server.listen(SERVER_PORT, function()
	{
		console.log('╔═════════════════════════════╗');
		console.log('║ Development Server running. ║');
		console.log('╚═════════════════════════════╝');
	});
}

module.exports = app;