module.exports = function(grunt) {
  grunt.initConfig({
    // your grunt config here
  });
  grunt.loadNpmTasks('grunt-contrib-xyz'); // load required plugins
  grunt.registerTask('default', ['xyz']);
};
