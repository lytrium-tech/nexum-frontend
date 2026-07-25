# Frontend Sync Handoff: Goals V1.8 Phase 1

- **Frontend Baseline**: 43e67b5
- **Backend Baseline**: 06e682d
- **Contratos Sincronizados**: sí (OpenAPI y tipos generados estrictos).
- **reservations_by_account**: incluido y tipado correctamente.
- **Release contract**: endpoints /api/v1/goals/{goal_id}/releases implementados en wrappers.
- **Idempotencia**: agregada en endpoints correspondientes con preservación visual en reintentos.
- **Estrategia Frontend (Errores)**: Se implementó una normalización estricta apoyada en status, error_code y fragmentos del message retornados por el servicio (asegurando estabilidad), debido a que el backend carece de códigos granulares para dominios específicos (ej. eserva insuficiente). Los fallbacks se mantienen de forma segura.
- **Módulos no modificados**: Accounts, Wallets, Obligations, Transfers, Categories. Se comprobó que el drift de TS se había originado por usar un baseline antiguo, y en main actual no ocurren roturas de tipos cruzadas.
- **Validaciones**: build y typecheck limpios sin type erasure ni ny.
- **UI Diferida**: La UI de liberaciones de metas se implementará en la Fase 2.