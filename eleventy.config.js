module.exports = function (eleventyConfig) {
  // Estos se copian tal cual, sin que Eleventy los procese.
  eleventyConfig.addPassthroughCopy({ 'src/styles.css': 'styles.css' });
  eleventyConfig.addPassthroughCopy({ 'src/script.js': 'script.js' });
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

  // El panel de Decap: HTML, configuracion y tema. Se copian sin tocar porque
  // Decap los lee crudos desde el navegador.
  eleventyConfig.addPassthroughCopy({ 'src/admin': 'admin' });

  // Sin esto Eleventy trata admin/index.html como plantilla Nunjucks. Hoy
  // pasaria, pero el dia que ese HTML traiga llaves dobles —Decap las usa en
  // su documentacion— el build reventaria por intentar interpretarlas.
  eleventyConfig.ignores.add('src/admin/**');

  return {
    dir: { input: 'src', output: '_site', data: '_data' },
    htmlTemplateEngine: 'njk',
  };
};
