module.exports = function(grunt) {
    'use strict';
 
    require('matchdep').filterDev('grunt-!(cli)').forEach(grunt.loadNpmTasks);
 
    grunt.initConfig({
        less: {
            dev: {
                options: {
                    sourceMap: true,
                    sourceMapFilename: 'style.map'
                },
                files: {
                    'css/app.css': 'css/app.less'
                }
            }
        },
        watch: {
            all: {
                files: ['css/*.less'],
                tasks: ['less'],
            }
        }
    });
 
    grunt.registerTask('default', ['less', 'watch']);
};