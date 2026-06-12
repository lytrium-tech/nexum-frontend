# Reporte Final: Fase 12.7 - Onboarding Autenticado e Idempotente

## Resumen Ejecutivo
Se ha completado exitosamente la Fase 12.7, logrando la integración real entre el Auth de Supabase (JWT) y el perfil interno de base de datos de Nexum (`public.users`). Con esta fase culminada, el ecosistema de producción cuenta con una validación perimetral fuerte, creación segura de identidades bajo demanda, y propagación correcta del perfil a todos los dominios financieros e integraciones conversacionales.

---

## 1. a 6. Resultados del Smoke Test Autenticado

El `scripts/smoke_authenticated_onboarding.py` ha corrido de extremo a extremo contra producción verificando todos los hitos del ciclo de vida de un usuario nuevo autenticado:

1. **Bootstrap inicial (`POST /api/v1/users/me/bootstrap`)**: Respuesta `200 OK` con `created: True`. El usuario se registró correctamente en `public.users` extrayendo el `auth_user_id` y el email directamente desde el JWT de Supabase, validando la firma criptográficamente mediante JWKS.
2. **Bootstrap idempotente (`POST /api/v1/users/me/bootstrap`)**: Segunda petición con respuesta `200 OK` y `created: False`. Nexum reconoce al usuario previamente insertado sin arrojar conflicto y devuelve el mismo perfil.
3. **GET `/users/me`**: Respuesta `200 OK` con la información del perfil del usuario (id, timezone, currency).
4. **Intelligence autenticado**: Los endpoints de `/api/v1/intelligence/snapshot` respondieron correctamente datos iniciales (`200 OK`) usando `CurrentUserProfile`.
5. **Conversations autenticado**: `POST /api/v1/conversations/message` respondió `200 OK` validando exitosamente el paso de `current_profile.id` al repositorio (`messages` vinculados a un usuario válido sin errores de ForeignKeyViolation).

---

## 7. a 10. Confirmaciones Arquitectónicas

1. **Validación JWT real en producción**: Confirmada. El middleware de `AuthenticatedIdentity` descarga y cachea el set JWKS desde `https://<SUPABASE_URL>/auth/v1/verify`. Ningún request sin token válido o con firma rota puede tocar los dominios protegidos.
2. **Creación de usuario interno en `public.users`**: Confirmada. Durante el bootstrap, se genera un nuevo UUID v4 de Postgres para `public.users.id` y se asocia el `auth_user_id` de Supabase, permitiendo separar lógicamente la identidad externa (Supabase) del perfil interno de negocio (Nexum).
3. **Uso de `CurrentUserProfile` en todos los dominios**: Confirmado. Se migró exitosamente toda la lógica de `Cash`, `Conversations`, `Credit`, `Goals` e `Intelligence` para depender de `current_profile: CurrentUserProfile` en el router, extrayendo y propagando `current_profile.id` a la capa de servicio. El bypass de desarrollo (`resolve_user_id`) fue descartado.
4. **Despliegue Productivo**: Confirmado. `https://api.nexum.lytrium.tech` se encuentra operando la última rama `main` en su contenedor con Nginx y FastAPI.

---

## 11. Estado actual de la arquitectura

* **Infraestructura**: Docker Compose en VPS, Nginx como Reverse Proxy (con HTTPS automático administrado externamente o localmente).
* **Seguridad API**: FastAPI + CORS restringido a frontends permitidos + JWT Validation nativa (PyJWKClient).
* **Base de Datos**: PostgreSQL aislada (solo expone al contenedor interno). El modelo relacional soporta UUIDs y FKs estables sin conflictos.
* **Inteligencia Artificial**: Interacción con Gemini probada y operativa de manera segura.
* **Patrones**: Arquitectura Hexagonal sólida. Router $\rightarrow$ Service $\rightarrow$ Repository / UoW, con inyección de dependencias limpios. 
* **Testing**: Cobertura robusta de unit tests (118 test activos en verde localmente).

---

## 12. Bloqueantes Restantes

Actualmente **no existen bloqueantes técnicos** para la operatividad general del backend ni para el inicio del desarrollo del frontend. Todos los flujos fundamentales están operables de manera segura. Sin embargo, para escalar a nuevos usuarios reales, restan piezas funcionales por pulir.

---

## 13. Riesgos Pendientes

1. **Ausencia de Catálogo de Categorías Globales**: La cuenta está creada, pero en el bootstrap no se siembran (seed) categorías por usuario, ni hay categorías globales disponibles para asignar gastos/ingresos. Esto generará fricción si Gemini intenta categorizar un gasto y no encuentra un catálogo predeterminado.
2. **Desincronización de Sesión**: Falta asegurar si el frontend sabrá cómo manejar un JWT expirado (manejo de refresh tokens a nivel cliente y CORS headers extra si fuese necesario, aunque actualmente Supabase client maneja esto en frontend).
3. **Control de Límites Financieros (Rate Limiting y Billing)**: Un usuario verificado puede llenar de transacciones su cuenta o exceder los límites operativos previstos para la capa de AI, generando un gasto innecesario en la API de Gemini si no se limita en la capa perimetral.
4. **Falta de cuenta predeterminada**: El usuario nace sin ninguna cuenta o billetera (`accounts`). Si inicia una conversación para insertar un gasto, esta fallará a menos que el frontend u onboarding interactivo lo obligue a registrar su primera cuenta (ej. "Efectivo").

---

## 14. Recomendación de Siguiente Fase

**Fase 13.0: Core Catalogs & Initial State (Seed de estado inicial).**
Se recomienda abordar la resolución de "qué recibe el usuario al nacer" después del bootstrap técnico:
* Crear y exponer un endpoint seguro de solo lectura para listar categorías globales.
* Alternativamente, si se definió una arquitectura privada, disparar la creación de 4 o 5 categorías base durante el bootstrap.
* Exigir o inducir la creación de la primera Billetera (Cuenta manual) desde el frontend justo después de que el endpoint de bootstrap confirme la finalización del onboarding.

---

## Evaluación Honesta del Estado del Producto

Analizando la madurez actual del ecosistema Nexum, su estado se clasifica firmemente como:

> **Alpha Privada (Early Alpha)**

### Justificación:
1. **No es un simple MVP Técnico**: El término MVP técnico quedó atrás hace dos fases. Ya tienes separación de responsabilidades, base de datos de grado de producción (Postgres), validación asimétrica de tokens (JWKS), inyección de dependencias, y una arquitectura limpia con unit testing y migraciones. El "prototipo" fue superado.
2. **Por qué es "Alpha Privada" y no "Beta Privada"**:
   * **Alpha**: Es funcional end-to-end (login, procesamiento natural vía LLM, registro financiero y analíticas) y es **estable** a nivel técnico. Se puede empezar a usar por el desarrollador (tú) o un equipo interno ("Dogfooding").
   * **Falta para Beta**: Una Beta implica que un grupo reducido de usuarios externos (que no saben programar) lo prueben. Nexum aún carece del Frontend ensamblado que consuma este flujo de onboarding real y carece de sembrado de información inicial (cuenta 0, categorías básicas), lo que significa que un usuario Beta externo llegaría y vería errores semánticos u operacionales al interactuar con el AI de entrada.
3. **Por qué no es "Producción temprana"**: Hasta que no haya un frontend desplegado en Vercel/Netlify que se comunique mediante Supabase Client en tiempo real con este backend estable, el flujo comercial no está completo.

**Conclusión Final:** Tienes en tus manos un motor financiero/IA de clase empresarial en estado *Alpha Privada*, listo y a la espera de que el cliente (Frontend) empiece a consumir todo este ecosistema blindado.
