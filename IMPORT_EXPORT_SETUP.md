# Import/Export Clientes - Documentación

## Overview

La Fase 2 de InsuraFlow CRM permite a los agentes importar y exportar clientes desde/hacia archivos Excel y CSV.

### Funcionalidades

1. **Importar Clientes** desde Excel (.xlsx, .xls) o CSV
2. **Exportar Clientes** a Excel (.xlsx)
3. **Exportar Clientes** a PDF (reporte formateado)
4. **Validación** automática de datos
5. **Drag & Drop** para importar archivos
6. **Auditoría** de todas las operaciones

---

## Formato de Importación

### Campos Requeridos

| Campo | Descripción | Validación | Ejemplo |
|-------|-------------|-----------|---------|
| **name** | Nombre del cliente | Mín 2 caracteres | Juan Pérez |
| **email** | Email del cliente | Formato válido (opcional) | juan@example.com |
| **phone** | Teléfono | Mín 10 dígitos (opcional) | 3055550123 |
| **type** | Tipo de cliente | personal, empresa, prospecto | personal |
| **status** | Estado | active, inactive, archived | active |
| **address** | Dirección | Texto libre (opcional) | 123 Main St |
| **city** | Ciudad | Texto libre (opcional) | Miami |
| **state** | Estado/Provincia | Texto libre (opcional) | FL |
| **zip_code** | Código Postal | Texto libre (opcional) | 33101 |
| **notes** | Notas | Texto libre (opcional) | Cliente VIP |

### Ejemplo de Archivo Excel/CSV

```
name,email,phone,type,status,address,city,state,zip_code,notes
Juan Pérez,juan@example.com,3055550123,personal,active,123 Main St,Miami,FL,33101,Cliente importante
María González,maria@example.com,3055550172,empresa,active,456 Oak Ave,Miami,FL,33102,Empresa de seguros
Roberto López,,7865550193,personal,inactive,789 Pine Rd,Coral Gables,FL,33134,
```

---

## Endpoints API

### Importar Clientes

```
POST /api/import/clients
```

**Parámetros:**
- `file` (multipart/form-data): Archivo Excel o CSV
- `agencyId` (body): ID de la agencia

**Response:**
```json
{
  "total": 100,
  "successful": 98,
  "failed": 2,
  "errors": [
    {
      "row": 5,
      "errors": ["Email inválido", "Teléfono debe tener al menos 10 dígitos"]
    },
    {
      "row": 12,
      "errors": ["Nombre requerido (mín 2 caracteres)"]
    }
  ]
}
```

### Exportar a Excel

```
GET /api/export/clients/excel?agencyId=1
```

**Response:** Archivo Excel descargado como `clientes_YYYY-MM-DD.xlsx`

### Exportar a PDF

```
GET /api/export/clients/pdf?agencyId=1
```

**Response:** Archivo PDF descargado como `clientes_YYYY-MM-DD.pdf`

---

## Instrucciones de Uso

### Importar Clientes

1. Ve a la sección **Clientes**
2. Haz clic en **"Importar/Exportar Clientes"** (aparece en la parte superior)
3. En la sección **"Importar desde archivo"**:
   - Selecciona un archivo Excel (.xlsx, .xls) o CSV
   - O arrastra y suelta el archivo
4. El sistema validará los datos y mostrará un resumen:
   - ✅ Clientes importados correctamente
   - ❌ Errores por fila (si aplica)
5. Los clientes se agregan automáticamente a la agencia

### Exportar Clientes

#### Excel

1. Ve a la sección **Clientes**
2. Haz clic en el botón **"Excel"**
3. Se descargará un archivo con todos los clientes en formato Excel

#### PDF

1. Ve a la sección **Clientes**
2. Haz clic en el botón **"PDF"**
3. Se descargará un reporte formateado en PDF

---

## Validaciones

### Validación de Entrada

1. **Nombre**: Requerido, mínimo 2 caracteres
2. **Email**: Opcional, pero si se proporciona debe ser válido
3. **Teléfono**: Opcional, pero si se proporciona debe tener mín 10 dígitos
4. **Tipo**: Debe ser uno de: personal, empresa, prospecto
5. **Estado**: Debe ser uno de: active, inactive, archived

### Tamaño de Archivo

- **Máximo**: 10MB
- **Formatos soportados**: .xlsx, .xls, .csv

### Auditoría

Todas las importaciones/exportaciones quedan registradas en `audit_logs`:
- Usuario que realizó la operación
- Fecha y hora
- Cantidad de registros procesados
- Dirección IP

---

## Archivos Modificados/Creados

### Backend

- ✅ `backend/middleware/fileParser.js` - Parseo de Excel/CSV
- ✅ `backend/routes/import.js` - Endpoint de importación
- ✅ `backend/routes/export.js` - Endpoints de exportación
- ✅ `backend/server.js` - Registro de nuevas rutas
- ✅ `backend/uploads/` - Carpeta de archivos temporales (creada automáticamente)

### Frontend

- ✅ `src/components/ImportExportPanel.jsx` - Componente UI
- ✅ `src/main.jsx` - Integración del componente

### Librerías Instaladas

```
- xlsx: Lectura/escritura de archivos Excel
- papaparse: Parseo de archivos CSV
- pdfkit: Generación de reportes PDF
- multer: Manejo de file uploads
```

---

## Limitaciones Conocidas

1. Solo se puede importar desde el primer sheet de un archivo Excel
2. Los números de teléfono se validan solo por cantidad de dígitos (no por formato específico)
3. Las importaciones se realizan de forma sincrónica (archivos muy grandes pueden tomar tiempo)

---

## Ejemplos de Uso

### Crear archivo CSV para importar

```bash
# Linux/Mac
cat > clientes.csv << 'EOF'
name,email,phone,type,status,notes
Juan Pérez,juan@example.com,3055550123,personal,active,Cliente importante
María González,maria@example.com,3055550172,empresa,active,Empresa de seguros
EOF

# Windows PowerShell
@"
name,email,phone,type,status,notes
Juan Pérez,juan@example.com,3055550123,personal,active,Cliente importante
María González,maria@example.com,3055550172,empresa,active,Empresa de seguros
"@ | Out-File -FilePath clientes.csv -Encoding utf8
```

### Importar mediante cURL

```bash
curl -X POST http://localhost:5000/api/import/clients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@clientes.csv" \
  -F "agencyId=1"
```

---

## Troubleshooting

### Error: "Tipo de archivo no válido"
- Solo se aceptan archivos .xlsx, .xls o .csv
- Verifica que la extensión sea correcta

### Error: "Archivo demasiado grande"
- El tamaño máximo es 10MB
- Intenta dividir el archivo en partes más pequeñas

### Error: "Nombre requerido (mín 2 caracteres)"
- La columna "name" no puede estar vacía y debe tener al menos 2 caracteres

### Error: "Email inválido"
- Verifica que el formato sea válido: usuario@dominio.com

### Error: "Teléfono debe tener al menos 10 dígitos"
- El teléfono debe contener al menos 10 dígitos (sin contar caracteres especiales)

---

## Seguridad

- ✅ Validación de entrada en ambos lados (frontend + backend)
- ✅ Rate limiting en endpoints de importación
- ✅ CSRF protection
- ✅ Autenticación requerida
- ✅ Auditoría de todas las operaciones
- ✅ Archivos temporales eliminados automáticamente
- ✅ Máximo tamaño de archivo limitado

---

## Roadmap Futuro

- [ ] Importación asincrónica para archivos grandes
- [ ] Mapeo personalizado de columnas
- [ ] Duplicación de clientes (alerta si email/teléfono ya existe)
- [ ] Historial de importaciones
- [ ] Exportación con filtros personalizados
- [ ] Plantillas de importación descargables

---

## Contacto/Soporte

Para reportar problemas o sugerir mejoras, por favor contacta al equipo de desarrollo.
