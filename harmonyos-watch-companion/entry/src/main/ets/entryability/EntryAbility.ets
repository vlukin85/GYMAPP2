import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        console.error(`IronRise Watch failed to load content: ${JSON.stringify(err)}`);
        return;
      }
      console.info('IronRise Watch companion ready');
    });
  }

  onWindowStageDestroy(): void {
    console.info('IronRise Watch companion window destroyed');
  }

  onForeground(): void {
    console.info('IronRise Watch companion foreground');
  }

  onBackground(): void {
    console.info('IronRise Watch companion background');
  }
}
