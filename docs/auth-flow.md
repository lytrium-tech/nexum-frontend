# Flujo de Autenticación (Supabase + FastAPI)

1. **Autenticación Base (Client/Server Actions):**
El frontend enruta el formulario de login y signup a `actions.ts` donde se invoca `@supabase/ssr` (createServerClient) para manejar credenciales de email y contraseña.
   
2. **Persistencia y Refresh:**
El middleware de Next.js (`middleware.ts` / `src/lib/supabase/middleware.ts`) refresca transparentemente el token de sesión en la cookie cada vez que caduca, asegurando que las llamadas subyacentes cuenten siempre con una sesión viva.

3. **Inyección en Peticiones (API Client):**
Al invocar a `apiClient(...)`, se evalúa el contexto de ejecución (Browser vs Server). Supabase proporciona un `access_token` temporal (JWT). El API Client adhiere este JWT a las cabeceras HTTP de la petición, permitiendo que FastAPI valide las firmas JWKS en su propio backend sin necesidad de delegar back-channeling.

4. **Bootstrap y Onboarding:**
Con la sesión establecida en Supabase, el backend necesita conocer al usuario para asociar sus transacciones. El frontend garantiza que cada usuario registrado pase forzosamente por `/api/v1/users/me/bootstrap` antes de habilitar el panel (`/app`).
