# ⏱️ dsh-deepseek-price-timer

Widget para el **DeepSeek Harness Web GUI** que muestra en vivo las **tarifas pico/valle de DeepSeek** (deepseek-v4-flash y deepseek-v4-pro).

**Detecta automáticamente la zona horaria de tu PC** y siempre muestra el **contraste entre tu hora local y UTC**, para que sepas al instante si estás en PICO (tarifa ×2) o VALLE (tarifa a mitad de precio).

![Screenshot del widget](../docs/screenshot.png)

> **Read in English — [README.md](./README.md)**

---

## ✨ Características

| | |
|---|---|
| 🌐 | **Precios oficiales en vivo** — descarga la tabla de precios de [api-docs.deepseek.com/quick_start/pricing](https://api-docs.deepseek.com/quick_start/pricing/) cada 30 min (fallback embebido sin conexión) |
| 🕐 | **Reloj local del PC** con su offset UTC detectado (`12:34 PM (UTC-5)`) |
| 🌍 | **Reloj UTC** siempre visible al lado (`17:34 UTC`) |
| 🔴🟢🟡 | **Píldora PICO / VALLE / FLAT** con punto pulsante — FLAT con countdown al cutover de tarifas |
| 📊 | **Timeline de 24h** en hora local: valle en verde, pico en rojo, horas de inicio/fin y marcador "ahora" |
| 💰 | **Tabla de precios** con **todos los modelos** de la página oficial (valle y pico) |
| 🧮 | **Coste estimado de la sesión** en vivo (valle y pico) desde el uso real de tokens |
| 🔔 | **Alerta** al cambiar la ventana: "¡PICO empezó!" / "VALLE — tarifa a mitad" |
| 📌 | **Píldora en el header de sesión** — siempre visible junto al botón de Session log |
| 🗜️ | **Colapso** a píldora mínima (ideal móvil) |
| 🖱️ | **Tooltips** con detalles en el timeline |
| 🌍 | **i18n ES/EN** automático según el idioma del navegador |
| ⚙️ | **Funciona en cualquier zona horaria** (cruce de medianoche y DST soportados) |
| 🔄 | **Auto-update** — descarga, valida y aplica versiones nuevas del repo y reinicia |

### Ventanas pico oficiales (UTC)

- **01:00 – 04:00 UTC** y **06:00 – 10:00 UTC**
- El resto es **VALLE** (mitad del precio pico)
- Nueva tarifa vigente desde **2026-08-16 16:00 UTC** (en tu hora local)

### Precios por 1M tokens (USD)

| Modelo | Cache hit (valle/pico) | Cache miss (valle/pico) | Output (valle/pico) |
|---|---|---|---|
| deepseek-v4-flash | $0.007 / $0.014 | $0.22 / $0.44 | $0.66 / $1.32 |
| deepseek-v4-pro | $0.022 / $0.044 | $0.66 / $1.32 | $1.98 / $3.96 |

---

## 📦 Instalación

> Requisito: [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh web`).

### Opción A — automática (Windows, Linux y macOS)

```bash
npm run install:profile            # detecta el sistema
npm run install:profile:win        # Windows
npm run install:profile:unix       # Linux/macOS
```

### Opción B — manual

1. **Vincula/copia el paquete** al fallback plano de perfiles:

   ```powershell
   cmd /c mklink /J "$env:USERPROFILE\.dsh\profiles\node_modules\dsh-deepseek-price-timer" "C:\ruta\al\proyecto"
   ```

   ```bash
   ln -s /ruta/al/proyecto "$HOME/.dsh/profiles/node_modules/dsh-deepseek-price-timer"
   ```

2. **Registra la fila** en el patch de nivel *home* (aplica a **todos los perfiles**):

   ```yaml
   # $HOME/.dsh/cordis.patch.yml
   - insert:
       - id: dspt-permanent
         name: 'dsh-deepseek-price-timer'
   ```

3. **Reinicia el servidor web** (`dsh web`) y recarga la página.

---

## ⚙️ Configuración (variables de entorno)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DSH_DSPT_REPO` | Tu repo (`usuario/repo`). Activa el **comprobador de actualizaciones** (`version.json` en `main`). | `DSH_DSPT_REPO=dacs2019/dsh-deepseek-price-timer` |
| `DSH_DSPT_PEAK_WINDOWS` | Sobrescribe las ventanas pico (minutos UTC, `inicio-fin,inicio-fin`) **sin tocar código**. | `DSH_DSPT_PEAK_WINDOWS=60-240,360-600` |

## ⚠️ Limitaciones conocidas

- **Etiquetas del timeline el día del cambio de DST**: las posiciones son correctas, las etiquetas pueden desfasarse 1 h ese día.
- **Coste de sesión**: usa el precio del primer modelo (el harness no expone el modelo en uso).
- **Precios**: se obtienen parseando la página oficial; si cambia su estructura, se usan los precios embebidos y se indica "precios embebidos (sin conexión)".
- **Self-update**: confía en HTTPS del repo configurado; en Windows necesita la tarea `DSH Web Restart` (la crea `install.ps1`), en Linux/macOS un process manager o reinicio manual.

## 📄 Licencia

MIT — ver [LICENSE](./LICENSE).

## Changelog

**v1.5.0** — píldora en el header de sesión, fase FLAT con countdown al cutover, accesibilidad (role/aria/data-phase), lógica `phaseAt()` con tests.
**v1.4.1** — instalador npm multiplataforma, fuente única de `inject`.
**v1.4.0** — ronda de auditoría: CI corregida, sin doble writeHead, precios NaN, CSRF, rollback .bak, segmentos sin ancho cero, i18n completo, marca de agua de versión.
**v1.3.x** — parser guiado por cabecera, CORS mismo-origen, self-update validado.
**v1.2.0** — self-update multiplataforma, instalador Unix, tests + CI, anti-BOM.
**v1.1.0** — auto-update interno, precios oficiales en vivo, hora local/UTC.
