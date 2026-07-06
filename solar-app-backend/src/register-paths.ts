import * as tsConfigPaths from 'tsconfig-paths';
import * as path from 'path';

// Obtener la ruta absoluta del directorio del backend (un nivel arriba de src/)
const backendDir = path.resolve(__dirname, '..');
console.log('Registering paths with baseUrl:', backendDir);

tsConfigPaths.register({
  baseUrl: backendDir,
  paths: {
    "src/*": ["src/*", "dist/*"]
  }
});
console.log('Paths registered successfully using tsconfig-paths');
