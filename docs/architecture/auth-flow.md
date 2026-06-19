# Flujo de Autenticación (Supabase + FastAPI)

1. **Autenticación Base (Client/Server Actions):**
El frontend enruta el formulario de login y signup a `actions.ts` donde se invoca `@supabase/ssr` (createServerClient) para manejar credenciales de email y contraseña.
   
2. **Persistencia y Refresh:**
El middleware de Next.js (`middleware.ts` / `src/lib/supabase/middleware.ts`) refresca transparentemente el token de sesión en la cookie cada vez que caduca, asegurando que las llamadas subyacentes cuenten siempre con una sesión viva.

3. **Inyección en Peticiones (API Client):**
Al invocar a `apiClient(...)`, se evalúa el contexto de ejecución (Browser vs Server). Supabase proporciona un `access_token` temporal (JWT). El API Client adhiere este JWT a las cabeceras HTTP de la petición, permitiendo que FastAPI valide las firmas JWKS en su propio backend sin necesidad de delegar back-channeling.

4. **Bootstrap y Onboarding (Idempotente):**
Con la sesión establecida en Supabase, el layout seguro (`/app/layout.tsx`) recupera el JWT localmente.
De contar con un JWT válido, se dispara `POST /api/v1/users/me/bootstrap` como primer paso (idempotente) antes de consultar `users.me` y `accounts`. Si la petición de datos falla con un `401`, la redirección devuelve a `/login` sin crear loops. De no encontrar cuentas ni categorías, redirige a las subsecuentes fases de onboarding.
