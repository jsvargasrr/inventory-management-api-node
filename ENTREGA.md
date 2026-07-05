# Checklist pre-entrega

Ejecutar antes de enviar la prueba:

```bash
npm ci
npm run db:generate
npm run lint
npm run build
npm test
npm run verify:enunciado
```

## Resultados esperados

- [ ] `npm test` → 53 tests passing
- [ ] `npm run verify:enunciado` → 27/27 checks
- [ ] `npm run lint` → sin errores
- [ ] `GET /health` → `{ "status": "ok" }`
- [ ] `GET /docs` → Swagger UI
- [ ] Repo público en GitHub
- [ ] URL de deploy en README (Render/Railway)

## Verificación manual rápida

1. `npm run dev`
2. Abrir http://localhost:3000/docs
3. Listar productos con alerta: `GET /products?hasActiveAlert=true`
4. Flujo orden: alerta → crear orden → aprobar → recibir
5. Confirmar stock incrementado y alerta resuelta

## Deploy Render (paso a paso)

1. Push a GitHub (rama `main`)
2. render.com → New → Blueprint → seleccionar repo
3. Esperar build (~3-5 min)
4. Copiar URL del servicio
5. Actualizar línea "Demo en vivo" en README.md
6. Verificar: `curl https://URL/health`
