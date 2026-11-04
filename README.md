# InsuraFlow CRM — Premium UI

Frontend visual de demostración basado en el mockup aprobado. **No incluye backend, autenticación real, almacenamiento persistente, datos de pólizas reales ni integración de pagos.** Los nombres, cifras y vencimientos son datos ficticios de demostración.

## Instalación en Windows
1. Descomprime el ZIP dentro de `C:\Users\Yeinier\OneDrive\Escritorio\Insurance`.
2. Abre la carpeta `InsuraFlow-CRM` en VS Code.
3. Abre la terminal de esa carpeta y ejecuta:

```bash
npm install
npm run dev
```

4. Abre la dirección local que muestra Vite (normalmente `http://localhost:5173`).

## Incluye
- Pantalla de bienvenida premium
- Dashboard con tarjetas de métricas, comisiones y tareas
- Lista de clientes con búsqueda y filtros
- Perfil de cliente con pestañas
- Renovaciones y alertas
- Vistas de prospectos, calendario y ajustes
- Formulario de alta de cliente (solo en memoria)
- Cambio de idioma ES/EN en elementos principales
- Diseño mobile-first y simulación de teléfono en escritorio

## Para continuar con Claude Code
Mantener intacta la identidad visual y la composición actual. Implementar backend, persistencia, autenticación, roles, validaciones, aislamiento multi-tenant, auditoría, consentimiento para comunicaciones y medidas de seguridad adecuadas para datos de seguros. No almacenar datos personales reales en esta demo.
