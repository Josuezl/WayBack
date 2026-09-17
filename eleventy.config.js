const fs = require('node:fs');
const path = require('node:path');

module.exports = function (eleventyConfig) {
  // Estos se copian tal cual, sin que Eleventy los procese.
  eleventyConfig.addPassthroughCopy({ 'src/styles.css': 'styles.css' });
  eleventyConfig.addPassthroughCopy({ 'src/script.js': 'script.js' });
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/robots.txt': 'robots.txt' });

  // El panel de Decap: HTML, configuracion y tema. Se copian sin tocar porque
  // Decap los lee crudos desde el navegador.
  eleventyConfig.addPassthroughCopy({ 'src/admin': 'admin' });

  // Sin esto Eleventy trata admin/index.html como plantilla Nunjucks. Hoy
  // pasaria, pero el dia que ese HTML traiga llaves dobles —Decap las usa en
  // su documentacion— el build reventaria por intentar interpretarlas.
  eleventyConfig.ignores.add('src/admin/**');

  // Las imagenes que sube el cliente desde el panel llegan como salen de la
  // camara o del disenador: la foto de la banda pesaba 5.9 MB y el afiche de
  // Honduras Adora 8.3 MB. Esto genera en el build una copia WebP del ancho que
  // la pagina necesita y devuelve su URL, asi puede subir cualquier tamano sin
  // que el sitio se vuelva lento.
  //
  // Es asincrono: dentro de un bucle hay que usar `asyncEach`, no `for`.
  eleventyConfig.addAsyncShortcode('imagen', async function (src, ancho) {
    // Decap guarda "/assets/foto.webp"; los datos anteriores, "assets/foto.webp".
    const archivo = path.join('src', src.replace(/^\//, ''));
    // Mejor que falle el build: el deploy se detiene y el sitio publicado se
    // queda como estaba, en vez de salir con una imagen rota.
    if (!fs.existsSync(archivo)) {
      throw new Error(`La imagen "${src}" no existe (se busco en ${archivo}).`);
    }
    const { default: Image } = await import('@11ty/eleventy-img');
    const generadas = await Image(archivo, {
      widths: [ancho],
      formats: ['webp'],
      outputDir: '_site/img/',
      urlPath: '/img/',
    });
    return generadas.webp[0].url;
  });

  // El panel guarda el numero como lo escribe una persona ("9623-6221"). Con
  // 8 digitos es hondureno y le falta el codigo de pais para wa.me.
  eleventyConfig.addFilter('whatsapp', function (numero, mensaje) {
    let digitos = String(numero).replace(/\D/g, '');
    if (digitos.length === 8) digitos = `504${digitos}`;
    return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
  });

  return {
    dir: { input: 'src', output: '_site', data: '_data' },
    htmlTemplateEngine: 'njk',
  };
};
