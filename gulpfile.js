var gulp = require('gulp');
var gutil = require('gulp-util');
var tsc   = require('gulp-tsc');
var yuidoc = require("gulp-yuidoc");

gulp.task('default', function(){
    gulp.src(['server.ts', 'app/models/*.ts', 'app/routes/*.ts', 'app/helper/*.ts', 'public/js/*.ts' ])
        .pipe(tsc())
        .pipe(gulp.dest("."));
});

gulp.task('doc', function() {
    gulp.src(["./app/*/*.js"])
        .pipe(yuidoc())
        .pipe(gulp.dest("./doc"));
});
