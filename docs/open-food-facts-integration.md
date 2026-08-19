# Open Food Facts: проверенные сведения для IronRise

Дата проверки: 19 августа 2026 года.

Для поиска неизвестного штрихкода используется публичный endpoint Open Food Facts API v2:

```text
GET https://world.openfoodfacts.net/api/v2/product/{barcode}?fields=product_name,nutriments
```

Официальная документация подтверждает, что ответ содержит `status` и объект `product`; при найденном продукте в `product.nutriments` доступны значения на 100 г, включая `energy-kcal_100g`, `proteins_100g`, `fat_100g` и `carbohydrates_100g`. Приложение не передаёт пользовательские записи питания в этот API и сохраняет найденный продукт только после явного выбора пользователя.

Источники: [введение в API](https://openfoodfacts.github.io/openfoodfacts-server/api/) и [официальный пример поиска по штрихкоду](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/).
