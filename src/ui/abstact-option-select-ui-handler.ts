import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import {Button} from "#enums/buttons";

export interface OptionSelectConfig {
  xOffset?: number;
  yOffset?: number;
  options: OptionSelectItem[];
  maxOptions?: integer;
  delay?: integer;
  noCancel?: boolean;
  supportHover?: boolean;
  noBg?: boolean;
  textStyle?: TextStyle;
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle;
}

export interface OptionSelectItem {
  label: string;
  handler: () => boolean;
  onHover?: () => void;
  keepOpen?: boolean;
  overrideSound?: boolean;
  item?: string;
  itemArgs?: any[];
}

const scrollUpLabel = "↑";
const scrollDownLabel = "↓";

export default abstract class AbstractOptionSelectUiHandler extends UiHandler {
  protected optionSelectContainer: Phaser.GameObjects.Container;
  protected optionSelectBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text[];
  protected optionSelectIcons: Phaser.GameObjects.Sprite[];

  protected config: OptionSelectConfig;

  protected blockInput: boolean;

  protected scrollCursor: integer = 0;

  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  abstract getWindowWidth(): integer;

  getWindowHeight(): integer {
    return (Math.min((this.config?.options || []).length, this.config?.maxOptions || 99) + 1) * 16;
  }

  setup() {
    const ui = this.getUi();

    this.optionSelectContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - 1, -48);
    this.optionSelectContainer.setName(`option-select-${Mode[this.mode]}`);
    this.optionSelectContainer.setVisible(false);
    ui.add(this.optionSelectContainer);

    this.optionSelectBg = addWindow(this.scene, 0, 0, this.getWindowWidth(), this.getWindowHeight());
    this.optionSelectBg.setName("option-select-bg");
    this.optionSelectBg.setOrigin(1, 1);
    this.optionSelectBg.ignoreDestroy = true;
    this.optionSelectContainer.add(this.optionSelectBg);

    this.optionSelectIcons = [];

    this.setCursor(0);
  }

  protected setupOptions() {
    const options = this.config?.options || [];

    if (this.optionSelectText) {
      Phaser.Actions.Call(this.optionSelectText, (text) => text.destroy(), this);
    }
    const optionText = this.config?.options.length > this.config?.maxOptions ? this.getOptionsWithScroll() : options;
    const optionTextStyle = {
      maxLines: options.length, lineSpacing: 12
    };
    if (this.config.extraStyleOptions) {
      Object.assign(optionTextStyle, this.config.extraStyleOptions);
    }
    this.optionSelectText = [];
    this.optionSelectText = optionText.map(o => {
      const ret = addTextObject(this.scene, 0, 0,
        o.item ? `    ${o.label}` : o.label,
        ( this.config?.textStyle ?? TextStyle.WINDOW),
        optionTextStyle
      );
      ret.setName(`text-${o.label}`);
      return ret;
    });

    const displayWidth = Math.max(...this.optionSelectText.map(t => t.displayWidth));
    this.optionSelectContainer.add(this.optionSelectText);
    this.optionSelectContainer.setPosition(this.scene.scaledCanvas.width - 1 - (this.config?.xOffset || 0), -48 + (this.config?.yOffset || 0));

    this.optionSelectBg.width = Math.max(displayWidth + 24, this.getWindowWidth());
    this.optionSelectBg.height = this.getWindowHeight();

    Phaser.Actions.Call(this.optionSelectText, (t: Phaser.GameObjects.Text) => t.setPositionRelative(this.optionSelectBg, 16, 9), this);
    Phaser.Actions.SetY(this.optionSelectText, this.optionSelectText[0].y, 16);

    if (this.config?.noBg) {
      this.optionSelectBg.setVisible(false);
    }

    this.optionSelectIcons.forEach(i => i.destroy());
    options.forEach((option: OptionSelectItem, i: integer) => {
      if (option.item) {
        const iconGroup = new Phaser.GameObjects.Group(this.scene, [], {
          classType: Phaser.GameObjects.Sprite,
          createCallback: (sprite: Phaser.GameObjects.Sprite) => {
            sprite.setName(`icon-${option.item}`);
            sprite.setScale(0.6);
            sprite.setPositionRelative(this.optionSelectText[0], 6, 5 + 16 * i);
          }
        });
        const itemIcon = new Phaser.GameObjects.Sprite(this.scene, 0, 0, "items", option.item);
        iconGroup.add(itemIcon);
        if (option.item === "candy") {
          const itemOverlayIcon = new Phaser.GameObjects.Sprite(this.scene, 0, 0, "items", "candy_overlay");
          iconGroup.add(itemOverlayIcon);

          itemIcon.setTint(Number(`0x${option.itemArgs[0]}`));
          itemOverlayIcon.setTint(Number(`0x${option.itemArgs[1]}`));
        }
        this.optionSelectIcons.push(...(iconGroup.children.getArray() as Phaser.GameObjects.Sprite[]));

        this.optionSelectContainer.add(this.optionSelectIcons);
      }
    });
  }

  show(args: any[]): boolean {
    if (!args.length || !args[0].hasOwnProperty("options") || !args[0].options.length) {
      return false;
    }

    super.show(args);

    this.config = args[0] as OptionSelectConfig;
    this.setupOptions();

    this.scene.ui.bringToTop(this.optionSelectContainer);

    this.optionSelectContainer.setVisible(true);
    this.scrollCursor = 0;
    this.setCursor(0);

    if (this.config.delay) {
      this.blockInput = true;
      Phaser.Actions.SetAlpha(this.optionSelectText, 0.5);
      this.scene.time.delayedCall(Utils.fixedInt(this.config.delay), () => this.unblockInput());
    }

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const options = this.getOptionsWithScroll();

    let playSound = true;

    if (button === Button.ACTION || button === Button.CANCEL) {
      if (this.blockInput) {
        ui.playError();
        return false;
      }

      success = true;
      if (button === Button.CANCEL) {
        if (this.config?.maxOptions && this.config.options.length > this.config.maxOptions) {
          this.scrollCursor = (this.config.options.length - this.config.maxOptions) + 1;
          this.cursor = options.length - 1;
        } else if (!this.config?.noCancel) {
          this.setCursor(options.length - 1);
        } else {
          return false;
        }
      }
      const option = this.config?.options[this.cursor + (this.scrollCursor - (this.scrollCursor ? 1 : 0))];
      if (option?.handler()) {
        if (!option.keepOpen) {
          this.clear();
        }
        playSound = !option.overrideSound;
      } else {
        ui.playError();
      }
    } else {
      switch (button) {
      case Button.UP:
        if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.DOWN:
        if (this.cursor < options.length - 1) {
          success = this.setCursor(this.cursor + 1);
        }
        break;
      }
      if (this.config?.supportHover) {
        // handle hover code if the element supports hover-handlers and the option has the optional hover-handler set.
        this.config?.options[this.cursor + (this.scrollCursor - (this.scrollCursor ? 1 : 0))]?.onHover?.();
      }
    }

    if (success && playSound) {
      ui.playSelect();
    }

    return success;
  }

  unblockInput(): void {
    if (!this.blockInput) {
      return;
    }

    this.blockInput = false;
    Phaser.Actions.SetAlpha(this.optionSelectText, 1);
  }

  getOptionsWithScroll(): OptionSelectItem[] {
    if (!this.config) {
      return [];
    }

    const options = this.config.options.slice(0);

    if (!this.config.maxOptions || this.config.options.length < this.config.maxOptions) {
      return options;
    }

    const optionsScrollTotal = options.length;
    const optionStartIndex = this.scrollCursor;
    const optionEndIndex = Math.min(optionsScrollTotal, optionStartIndex + (!optionStartIndex || this.scrollCursor + (this.config.maxOptions - 1) >= optionsScrollTotal ? this.config.maxOptions - 1 : this.config.maxOptions - 2));

    if (this.config?.maxOptions && options.length > this.config.maxOptions) {
      options.splice(optionEndIndex, optionsScrollTotal);
      options.splice(0, optionStartIndex);
      if (optionStartIndex) {
        options.unshift({
          label: scrollUpLabel,
          handler: () => true
        });
      }
      if (optionEndIndex < optionsScrollTotal) {
        options.push({
          label: scrollDownLabel,
          handler: () => true
        });
      }
    }

    return options;
  }

  setCursor(cursor: integer): boolean {
    const changed = this.cursor !== cursor;

    let isScroll = false;
    const options = this.getOptionsWithScroll();
    if (changed && this.config?.maxOptions && this.config.options.length > this.config.maxOptions) {
      const optionsScrollTotal = options.length;
      if (Math.abs(cursor - this.cursor) === options.length - 1) {
        this.scrollCursor = cursor ? optionsScrollTotal - (this.config.maxOptions - 1) : 0;
        this.setupOptions();
      } else {
        const isDown = cursor && cursor > this.cursor;
        if (isDown) {
          if (options[cursor].label === scrollDownLabel) {
            isScroll = true;
            this.scrollCursor++;
          }
        } else {
          if (!cursor && this.scrollCursor) {
            isScroll = true;
            this.scrollCursor--;
          }
        }
        if (isScroll && this.scrollCursor === 1) {
          this.scrollCursor += isDown ? 1 : -1;
        }
      }
    }
    if (isScroll) {
      this.setupOptions();
    } else {
      this.cursor = cursor;
    }

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
      this.cursorObj.setName("cursor");
      this.optionSelectContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.optionSelectBg, 12, 17 + this.cursor * 16);

    return changed;
  }

  clear() {
    super.clear();
    this.config = null;
    this.optionSelectContainer.setVisible(false);
    this.optionSelectContainer.removeBetween(1);
    this.optionSelectIcons.forEach(i => i.destroy());
    this.optionSelectText.forEach(t => t.destroy());
    this.eraseCursor();
  }

  eraseCursor() {
    this.cursorObj?.destroy();
    this.cursorObj = null;
  }
}
