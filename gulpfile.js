var gulp = require('gulp'),
    watch = require('gulp-watch'),
    istanbul = require('gulp-istanbul'),
    mocha = require('gulp-mocha');

gulp.task('pre-test', () => {
  return gulp.src(['lib/**/*.js'])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], () => {
  return gulp.src(['test/**/*.js'])
    .pipe(mocha())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports())
    // Enforce a coverage of at least 90%
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
});

gulp.task('develop', () => {
  return watch(['lib/**/*.js', 'test/**/*.js'], () => {
    gulp.run('test');
  });
});
