// Las 8 categorías canónicas de Funko (las que la fábrica escribe en
// web_productos.categoria) y su slug para la URL. Un único sitio para que
// la home, el hub /funko y las páginas de categoría hablen el mismo idioma.
export const CATS = [
  'Anime y Manga',
  'Películas y TV',
  'Animación',
  'Cómics y Superhéroes',
  'Terror',
  'Videojuegos',
  'Música',
  'Deportes',
];

const SLUGS = {
  'Anime y Manga': 'anime-y-manga',
  'Películas y TV': 'peliculas-y-tv',
  'Animación': 'animacion',
  'Cómics y Superhéroes': 'comics-y-superheroes',
  'Terror': 'terror',
  'Videojuegos': 'videojuegos',
  'Música': 'musica',
  'Deportes': 'deportes',
};

export const slugCat = (cat) => SLUGS[cat] || null;
export const catDeSlug = (slug) => Object.keys(SLUGS).find((k) => SLUGS[k] === slug) || null;
