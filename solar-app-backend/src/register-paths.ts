import * as tsConfigPaths from 'tsconfig-paths';

// Registrar los paths para resolver imports de "src/" en Vercel antes de que se cargue AppModule
tsConfigPaths.register({
  baseUrl: './',
  paths: {
    "src/*": ["src/*", "dist/*"]
  }
});
console.log('Paths registered successfully using tsconfig-paths');
