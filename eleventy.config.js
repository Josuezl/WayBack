module.exports = function (eleventyConfig) {
  // Estos tres se copian tal cual, sin que Eleventy los procese.
  eleventyConfig.addPassthroughCopy({ 'src/styles.css': 'styles.css' });
  eleventyConfig.addPassthroughCopy({ 'src/script.js': 'script.js' });
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

  return {
    dir: { input: 'src', output: '_site', data: '_data' },
    htmlTemplateEngine: 'njk',
  };
};
