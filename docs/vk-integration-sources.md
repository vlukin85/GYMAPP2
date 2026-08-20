# VK ID и публикация результатов

Авторизация реализована как мобильный OAuth 2.1 / PKCE-поток. Для запуска необходим ID зарегистрированного Android-приложения VK и redirect URI в формате `vk<APP_ID>://vk.ru/blank.html`.

| Назначение | Официальный источник | Использованное требование |
|---|---|---|
| Настройка Android-авторизации | https://id.vk.ru/about/business/go/docs/ru/vkid/latest/vk-id/connection/setting-up-auth/setup-android | PKCE: `code_verifier`, `code_challenge` S256, `state`, обмен кода через `/oauth2/auth`. |
| OAuth-поток Android | https://id.vk.ru/about/business/go/docs/ru/vkid/latest/vk-id/connection/start-integration/how-auth-works/auth-flow-android | Возврат кода, `device_id` и `state` через redirect URI; access token привязан к клиентской среде. |
| Публикация записи | https://dev.vk.com/method/wall.post | Карточка прикрепляется после загрузки на стену, а публикация требует отдельного подтверждения пользователя. |

Токен авторизации сохраняется только в `expo-secure-store` на устройстве. Приложение никогда не публикует запись автоматически: перед вызовом VK API показывается отдельное подтверждение.
