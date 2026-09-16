# Objeto 3D primigenio: referencia de recuperación

Guardado el 17/09/2026 por petición de Manuel. **Conservar para rescatar y realizar pruebas visuales aisladas más adelante. No sustituir el orbe público actual.**

## Localización aportada por Manuel y comprobada en Git

- Repositorio: `portfolio-manuelgarciallera`.
- Commit de origen: `5d61c8099a584153dbe2ad5a78d6df36d5904169` (`5d61c80`), «Refactor portfolio architecture and add spline integration lab», 16/03/2026.
- Rama remota de referencia: `origin/codex/manuel`, en `6889ddf0eca77c19c61fae51849206a7eefabb8c`, 18/03/2026. Es la referencia remota almacenada localmente; no se realizó fetch en esta comprobación.
- Archivos existentes en el commit de origen:
  - `src/features/portfolio/three/HeroBackgroundCanvas.jsx` — blob `7b6871d78aa49e49ee3ac96df980d9dcf341ebfa`.
  - `src/features/portfolio/three/heroShaders.js` — blob `cd41b7c6f790410c9e5612521f4a0422cecbc64f`.

Los objetos Git y rutas existen. La correspondencia visual con el primer ente recordado por Manuel queda pendiente de renderizar: no se ha abierto ni restaurado la escena en esta tarea.

## Pista histórica de los commits solo en disco

Manuel transmite que el Hub registró aproximadamente **310 commits solo en disco, nunca empujados**, frente a 24 de aquel conjunto que habrían llegado a GitHub. Guardar esta pista, pero **no tratarla como recuento actualmente verificado** ni interpretar 24 como total de historia remota.

Comprobación local de esta tarea:

- `codex/manuel` sí existe: `8dfcdbde498c9b00bec00fe7465a0e5bd8dfc84b`.
- `git rev-list --count codex/manuel`: **119**.
- `git rev-list --count origin/codex/manuel`: **118**.
- `git rev-list --left-right --count origin/codex/manuel...codex/manuel`: **0 / 1** (un commit exclusivo de la rama local actual).

Esto no acredita los ~310 commits, pero tampoco descarta objetos o ramas históricas en otros reflogs/copias. No se ejecutó búsqueda exhaustiva de objetos inalcanzables. No ejecutar limpieza, prune o GC para esta recuperación.

## Comandos de recuperación de solo lectura (PowerShell)

```powershell
git log --all --oneline -- '**/HeroBackgroundCanvas.jsx' '**/heroShaders.js'
git show 5d61c80:src/features/portfolio/three/HeroBackgroundCanvas.jsx
git show 5d61c80:src/features/portfolio/three/heroShaders.js

git rev-list --count codex/manuel
git rev-list --count origin/codex/manuel
git log codex/manuel --oneline -- '**/Hero*' '**/hero*' '**/three/**'

# Para investigar después si falta historia en las referencias actuales:
git reflog show codex/manuel
git reflog --all
git fsck --unreachable --no-reflogs | Select-String 'commit'
```

## Próxima tarea, no ejecutada

Leer los dos archivos y sus dependencias en ese commit; localizar posibles variantes históricas; preparar una prueba aislada y comparar visualmente con Manuel. Conservar la escena pública y el laboratorio azul/violeta. Si se recuperan objetos inalcanzables relevantes, decidir un respaldo explícito antes de cualquier limpieza. No cambiar la rama compartida ni restaurar archivos sobre el trabajo actual.
