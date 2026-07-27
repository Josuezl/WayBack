const nunjucks = require('nunjucks');

module.exports = function (eleventyConfig) {
  // Estos tres se copian tal cual, sin que Eleventy los procese.
  eleventyConfig.addPassthroughCopy({ 'src/styles.css': 'styles.css' });
  eleventyConfig.addPassthroughCopy({ 'src/script.js': 'script.js' });
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

  // Escapa para contexto de atributo HTML SIN tocar "&".
  //
  // Por qué existe: el copy original trae un "&" suelto sin codificar
  // (p.ej. alt="Julián & Becky Collazos - 2024") y reference/index.html lo
  // conserva tal cual, byte a byte. Nunjucks autoescapa "&" -> "&amp;" por
  // defecto, lo que rompería el diff contra la referencia; usar "| safe"
  // en su lugar deja pasar "<", ">", "\"" y "'" sin escapar, lo cual permite
  // salir del atributo (ver alt="{{ foto.alt | safe }}" en index.njk antes
  // de este filtro). Este filtro es la salida intermedia: escapa todo lo
  // que permite fugarse de un atributo entre comillas dobles, pero deja el
  // "&" suelto para no divergir del snapshot congelado.
  //
  // NO "arregles" esto quitando la excepción de "&": reference/index.html
  // es la fuente de verdad y el gate de bytes (`diff -u`) fallará si el
  // "&" se codifica a "&amp;".
  eleventyConfig.addFilter('escapeAttrKeepAmp', (value) => {
    const escaped = String(value)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    // Marca el resultado como "seguro" para que el autoescape de Nunjucks
    // no vuelva a codificar el "&" que dejamos intacto a propósito.
    return new nunjucks.runtime.SafeString(escaped);
  });

  return {
    dir: { input: 'src', output: '_site', data: '_data' },
    htmlTemplateEngine: 'njk',
  };
};
