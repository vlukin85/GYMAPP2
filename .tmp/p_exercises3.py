PAIRS = [
    ('const selectableGroups = muscleGroups.filter((group): group is MuscleGroup => group !== "Все");',
     '// Служебное значение «Все» — первый элемент muscleGroups, а не подпись UI:\n// на экране группы показываются через muscleGroupLabel().\nconst ALL_MUSCLE_GROUPS = muscleGroups[0];\nconst selectableGroups = muscleGroups.filter((group): group is MuscleGroup => group !== ALL_MUSCLE_GROUPS);\n// Оборудование по умолчанию для своего упражнения — значение каталога\n// (показывается через equipmentLabel()), а не подпись интерфейса.\nconst DEFAULT_EQUIPMENT = "Тренажёр";'),
    ('const [active, setActive] = useState<MuscleGroup | "Все">("Все");',
     'const [active, setActive] = useState<MuscleGroup | "Все">(ALL_MUSCLE_GROUPS);'),
    ('const [manualGroup, setManualGroup] = useState<MuscleGroup>("Грудь");',
     'const [manualGroup, setManualGroup] = useState<MuscleGroup>(selectableGroups[0]);'),
    ('const [manualEquipment, setManualEquipment] = useState("Тренажёр");',
     'const [manualEquipment, setManualEquipment] = useState(DEFAULT_EQUIPMENT);'),
    ('(active === "Все" || exercise.group === active)',
     '(active === ALL_MUSCLE_GROUPS || exercise.group === active)'),
    ('setManualEquipment("Тренажёр")', 'setManualEquipment(DEFAULT_EQUIPMENT)'),
]
