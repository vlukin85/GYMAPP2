enum CompanionMode {
  IDLE = 'idle',
  SET = 'set',
  REST = 'rest',
  SYNC = 'sync'
}

@Entry
@Component
struct Index {
  @State private mode: CompanionMode = CompanionMode.IDLE;
  @State private connected: boolean = false;

  private accentColor(): string {
    return this.mode === CompanionMode.REST ? '#F2A93B' : '#E53935';
  }

  private modeLabel(): string {
    switch (this.mode) {
      case CompanionMode.SET:
        return 'ПОДХОД';
      case CompanionMode.REST:
        return 'ОТДЫХ';
      case CompanionMode.SYNC:
        return 'СИНХРОНИЗАЦИЯ';
      default:
        return 'ОЖИДАНИЕ';
    }
  }

  private primaryLabel(): string {
    switch (this.mode) {
      case CompanionMode.IDLE:
        return 'СТАРТ';
      case CompanionMode.SET:
        return 'ЗАВЕРШИТЬ';
      case CompanionMode.REST:
        return 'ПРОПУСТИТЬ';
      default:
        return 'ПРОДОЛЖИТЬ';
    }
  }

  private primaryAction(): void {
    if (this.mode === CompanionMode.IDLE) {
      this.connected = true;
      this.mode = CompanionMode.SET;
    } else if (this.mode === CompanionMode.SET) {
      this.mode = CompanionMode.REST;
    } else if (this.mode === CompanionMode.REST) {
      this.mode = CompanionMode.SET;
    } else {
      this.connected = true;
      this.mode = CompanionMode.SET;
    }
  }

  private statusText(): string {
    return this.connected ? 'IRONRISE • ПОДКЛЮЧЕНО' : 'IRONRISE • НЕ ПОДКЛЮЧЕНО';
  }

  @Builder
  private watchHeader() {
    Row() {
      Text(this.modeLabel())
        .fontSize(8)
        .fontColor('#9AA3AE')
        .fontWeight(FontWeight.Bold)
        .letterSpacing(1.2)
      Blank()
      Text('09:41')
        .fontSize(8)
        .fontColor('#9AA3AE')
        .fontWeight(FontWeight.Bold)
    }
    .width('100%')
    .justifyContent(FlexAlign.SpaceBetween)
  }

  @Builder
  private watchContent() {
    Column() {
      if (this.mode === CompanionMode.IDLE) {
        Text('СЛЕДУЮЩАЯ')
          .fontSize(8)
          .fontColor('#9AA3AE')
          .fontWeight(FontWeight.Bold)
          .letterSpacing(1.2)
        Text('Жим лёжа')
          .fontSize(19)
          .fontColor('#F4F6F8')
          .fontWeight(FontWeight.Bold)
          .margin({ top: 8 })
        Text('4 × 8')
          .fontSize(28)
          .fontColor(this.accentColor())
          .fontWeight(FontWeight.Bold)
          .margin({ top: 12 })
        Text('Нажмите старт на часах')
          .fontSize(9)
          .fontColor('#7F8994')
          .margin({ top: 10 })
      } else if (this.mode === CompanionMode.SET) {
        Text('УПРАЖНЕНИЕ 01')
          .fontSize(8)
          .fontColor('#9AA3AE')
          .fontWeight(FontWeight.Bold)
          .letterSpacing(1.2)
        Text('Жим лёжа')
          .fontSize(19)
          .fontColor('#F4F6F8')
          .fontWeight(FontWeight.Bold)
          .margin({ top: 8 })
        Text('СЕТ 2 / 4')
          .fontSize(25)
          .fontColor(this.accentColor())
          .fontWeight(FontWeight.Bold)
          .margin({ top: 12 })
        Text('80 кг  •  8 повторов')
          .fontSize(10)
          .fontColor('#C8CFD7')
          .fontWeight(FontWeight.Medium)
          .margin({ top: 12 })
      } else if (this.mode === CompanionMode.REST) {
        Text('ОТДЫХ')
          .fontSize(9)
          .fontColor('#F2A93B')
          .fontWeight(FontWeight.Bold)
          .letterSpacing(1.2)
        Text('01:24')
          .fontSize(43)
          .fontColor('#F2A93B')
          .fontWeight(FontWeight.Bold)
          .margin({ top: 14 })
        Text('Следующий: сет 3')
          .fontSize(12)
          .fontColor('#F4F6F8')
          .fontWeight(FontWeight.Bold)
          .margin({ top: 10 })
        Text('Вибрация за 10 секунд')
          .fontSize(9)
          .fontColor('#7F8994')
          .margin({ top: 10 })
      } else {
        Text('СВЯЗЬ')
          .fontSize(9)
          .fontColor('#9AA3AE')
          .fontWeight(FontWeight.Bold)
          .letterSpacing(1.2)
        Text('↕')
          .fontSize(38)
          .fontColor('#F4F6F8')
          .fontWeight(FontWeight.Bold)
          .margin({ top: 16 })
        Text('Синхронизация')
          .fontSize(16)
          .fontColor('#F4F6F8')
          .fontWeight(FontWeight.Bold)
          .margin({ top: 8 })
        Text('Состояние сохранено в телефоне')
          .fontSize(9)
          .fontColor('#7F8994')
          .margin({ top: 10 })
      }
    }
    .layoutWeight(1)
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .width('100%')
  }

  build() {
    Column() {
      Row() {
        this.watchHeader()
      }
      .width('100%')

      this.watchContent()

      Button(this.primaryLabel(), { type: ButtonType.Capsule })
        .width('78%')
        .height(46)
        .fontSize(11)
        .fontWeight(FontWeight.Bold)
        .fontColor('#0B0D10')
        .backgroundColor(this.accentColor())
        .onClick(() => this.primaryAction())
    }
    .width('100%')
    .height('100%')
    .padding({ top: 26, bottom: 18, left: 24, right: 24 })
    .backgroundColor('#0B0D10')
    .borderRadius(120)
    .clip(true)
  }
}
