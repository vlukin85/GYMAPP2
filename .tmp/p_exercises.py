PAIRS = [
    # --- хук языка -----------------------------------------------------------
    ('const { lang } = useLanguage();', 'const { lang, t } = useLanguage();'),
    # --- данные: подпись «Моё изображение» в оверрайде фото -------------------
    ('label: "Моё изображение"', 'label: t("catalog.detail.photoMine")'),
    ('], [customExercises, exerciseImageOverrides]);',
     '], [customExercises, exerciseImageOverrides, t]);'),
    # --- локаль поиска -------------------------------------------------------
    ('const locale = lang === "en" ? "en-US" : "ru";',
     'const locale = lang === "en" ? "en-US" : "ru-RU";'),
    # --- поиск программ по локализованному названию --------------------------
    ('`${program.name} ${program.description}`.toLocaleLowerCase("ru").includes(programQuery.trim().toLocaleLowerCase("ru"))',
     '`${program.name} ${program.nameEn ?? ""} ${program.description}`.toLocaleLowerCase(locale).includes(programQuery.trim().toLocaleLowerCase(locale))'),
    ('"newest"), [programQuery, programs]);', '"newest"), [locale, programQuery, programs]);'),
    # --- выбор программы: алерты --------------------------------------------
    ('Alert.alert(added ? "Упражнение добавлено" : "Уже в программе", added ? `«${programPickerExercise.name}» добавлено в «${program?.name ?? "программу"}».` : `«${programPickerExercise.name}» уже есть в «${program?.name ?? "программе"}».`);',
     'Alert.alert(added ? t("catalog.picker.addedTitle") : t("catalog.picker.existsTitle"), added ? t("catalog.picker.addedMessage", { name: exerciseName(programPickerExercise, lang), program: programTitle(program) || t("catalog.picker.fallbackProgram") }) : t("catalog.picker.existsMessage", { name: exerciseName(programPickerExercise, lang), program: programTitle(program) || t("catalog.picker.fallbackProgramGen") }));'),
    # --- ручное упражнение: алерты ------------------------------------------
    ('Alert.alert("Не удалось добавить", manualName.trim() ? "Упражнение с таким названием уже есть в личном каталоге." : "Укажите название упражнения.");',
     'Alert.alert(t("catalog.manual.errorTitle"), manualName.trim() ? t("catalog.manual.duplicate") : t("catalog.manual.nameRequired"));'),
    ('Alert.alert("Упражнение создано", "Оно добавлено в личный каталог. Теперь выберите программу, куда его добавить.", [{ text: "Позже" }, { text: "Выбрать программу",',
     'Alert.alert(t("catalog.manual.createdTitle"), t("catalog.manual.createdMessage"), [{ text: t("catalog.manual.later") }, { text: t("catalog.manual.chooseProgram"),'),
    ('name: "Новое упражнение", group: manualGroup', 'name: t("catalog.manual.fallbackName"), group: manualGroup'),
    # --- шапка --------------------------------------------------------------
    ('>База движений</Text>', '>{t("catalog.tab.eyebrow")}</Text>'),
    ('>Упражнения</Text>', '>{t("catalog.tab.title")}</Text>'),
    ('>Находите движения, создавайте свои и добавляйте их в планы.</Text>',
     '>{t("catalog.tab.subtitle")}</Text>'),
    ('<Pressable onPress={() => setShowManualForm(true)} style={({ pressed }) => [styles.createButton,',
     '<Pressable accessibilityRole="button" accessibilityLabel={t("catalog.tab.createA11y")} onPress={() => setShowManualForm(true)} style={({ pressed }) => [styles.createButton,'),
    ('placeholder="Поиск по названию или оборудованию"',
     'placeholder={t("catalog.search.placeholder")}'),
    # --- фильтры групп мышц -------------------------------------------------
    ('fontWeight: "700" }}>{item}</Text></Pressable>} />',
     'fontWeight: "700" }}>{muscleGroupLabel(item, lang)}</Text></Pressable>} />'),
    ('>Найдено упражнений</Text>', '>{t("catalog.meta.found")}</Text>'),
    # --- карточка упражнения ------------------------------------------------
    ('? " · МОЁ" : ""}', '? t("catalog.card.mine") : ""}'),
    ('>В программу</Text>', '>{t("catalog.card.addToProgram")}</Text>'),
    ('<Pressable onPress={() => openProgramPicker(item)} style={({ pressed }) => [styles.addToPlan,',
     '<Pressable accessibilityLabel={t("catalog.card.addToProgramA11y", { name: exerciseName(item, lang) })} onPress={() => openProgramPicker(item)} style={({ pressed }) => [styles.addToPlan,'),
    ('>Ничего не найдено. Измените поиск или создайте упражнение вручную.</Text>',
     '>{t("catalog.empty")}</Text>'),
    # --- шторка выбора программы --------------------------------------------
    ('>Добавление в программу</Text>', '>{t("catalog.picker.eyebrow")}</Text>'),
    ('>Выберите программу. Поиск работает по названию и описанию.</Text>',
     '>{t("catalog.picker.hint")}</Text>'),
    ('placeholder="Найти программу"', 'placeholder={t("catalog.picker.searchPlaceholder")}'),
    ('>{program.name}</Text><Text style={[styles.programOptionMeta, { color: colors.muted }]}>{program.exercises.length} упражнений · {program.description}</Text>',
     '>{programTitle(program)}</Text><Text style={[styles.programOptionMeta, { color: colors.muted }]}>{t("catalog.picker.exercisesCount", { count: program.exercises.length })} · {program.description}</Text>'),
    ('borderColor: colors.border }]}><Text style={[styles.sheetCancelText, { color: colors.foreground }]}>Отмена</Text></Pressable><Pressable onPress={saveManualExercise}',
     'borderColor: colors.border }]}><Text style={[styles.sheetCancelText, { color: colors.foreground }]}>{t("catalog.manual.cancel")}</Text></Pressable><Pressable onPress={saveManualExercise}'),
    ('>Отмена</Text>', '>{t("catalog.picker.cancel")}</Text>'),
    # --- форма своего упражнения --------------------------------------------
    ('>Личный каталог</Text>', '>{t("catalog.manual.eyebrow")}</Text>'),
    ('>Новое упражнение</Text>', '>{t("catalog.manual.title")}</Text>'),
    ('placeholder="Название упражнения"', 'placeholder={t("catalog.manual.namePlaceholder")}'),
    ('>Группа мышц</Text>', '>{t("catalog.manual.groupLabel")}</Text>'),
    ('fontWeight: "700" }}>{group}</Text></Pressable>)}</View>',
     'fontWeight: "700" }}>{muscleGroupLabel(group, lang)}</Text></Pressable>)}</View>'),
    ('placeholder="Оборудование"', 'placeholder={t("catalog.manual.equipmentPlaceholder")}'),
    ('placeholder="Краткая подсказка по технике (необязательно)"',
     'placeholder={t("catalog.manual.descriptionPlaceholder")}'),
    ('>Создать</Text>', '>{t("catalog.manual.save")}</Text>'),
    # --- хелпер локализованного названия программы --------------------------
    ('  const openProgramPicker = (exercise: Exercise) => {',
     '  // Название программы — данные каталога: nameEn показывается при lang === "en".\n  const programTitle = (program?: { name: string; nameEn?: string } | null) => (program ? (lang === "en" ? (program.nameEn ?? program.name) : program.name) : "");\n  const openProgramPicker = (exercise: Exercise) => {'),
]
