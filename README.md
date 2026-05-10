# Water Quest

PWA счетчик воды для iPhone: дневная цель 4 литра, быстрые добавления 300/400/500 мл, история в `localStorage`, серия успешных дней, промежуточная победа за 7 дней подряд и суперкубок за 30 дней подряд.

## Локальный запуск

```bash
npm run serve
```

Открыть:

```text
http://localhost:4173/
```

## Публикация на GitHub Pages

1. Создай пустой репозиторий на GitHub, например `water-quest`.
2. В этой папке выполни:

```bash
git remote add origin https://github.com/YOUR_USERNAME/water-quest.git
git branch -M main
git push -u origin main
```

3. На GitHub открой `Settings` -> `Pages`.
4. В `Build and deployment` выбери:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Нажми `Save`.

Через минуту приложение будет доступно по адресу:

```text
https://YOUR_USERNAME.github.io/water-quest/
```

На iPhone открой этот адрес в Safari: `Поделиться` -> `На экран "Домой"` -> `Добавить`.
