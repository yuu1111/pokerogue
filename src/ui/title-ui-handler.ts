import BattleScene from "../battle-scene";
import OptionSelectUiHandler from "./settings/option-select-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { TextStyle, addTextObject } from "./text";
import { getSplashMessages } from "../data/splash-messages";
import i18next from "i18next";
import { TimedEventDisplay } from "#app/timed-event-manager.js";

export default class TitleUiHandler extends OptionSelectUiHandler {
  private titleContainer: Phaser.GameObjects.Container;
  private logo: Phaser.GameObjects.Image;
  private playerCountLabel: Phaser.GameObjects.Text;
  private splashMessage: string;
  private splashMessageText: Phaser.GameObjects.Text;
  private eventDisplay: TimedEventDisplay;
  private iconContainer: TitleIcons;

  private titleStatsTimer: NodeJS.Timeout;

  constructor(scene: BattleScene, mode: Mode = Mode.TITLE) {
    super(scene, mode);
  }

  setup() {
    super.setup();

    const ui = this.getUi();

    this.titleContainer = this.scene.add.container(0, -(this.scene.game.canvas.height / 6));
    this.titleContainer.setName("title");
    this.titleContainer.setAlpha(0);
    ui.add(this.titleContainer);

    this.logo = this.scene.add.image((this.scene.scaledCanvas.width / 4) + 3, 8, "logo");
    this.logo.setName("logo");
    this.logo.setOrigin(0.5, 0);
    this.titleContainer.add(this.logo);

    this.iconContainer = new TitleIcons(this.scene, 15, this.scene.scaledCanvas.height - 15);
    this.iconContainer.setup();
    this.titleContainer.add(this.iconContainer);

    if (this.scene.eventManager.isEventActive()) {
      this.eventDisplay = new TimedEventDisplay(this.scene, 170, 66, this.scene.eventManager.activeEvent());
      this.eventDisplay.setup();
      this.titleContainer.add(this.eventDisplay);
    }

    this.playerCountLabel = addTextObject(this.scene, 8, this.scene.scaledCanvas.height - 132, i18next.t("menu:playersOnline", { count: 0 }), TextStyle.MESSAGE, { fontSize: "54px" });
    console.log(this.playerCountLabel);
    this.playerCountLabel.setName("player-count");
    this.playerCountLabel.setOrigin(0);
    this.titleContainer.add(this.playerCountLabel);

    this.splashMessageText = addTextObject(this.scene, this.logo.x + 64, this.logo.y + this.logo.displayHeight - 8, "", TextStyle.MONEY, { fontSize: "54px" });
    this.splashMessageText.setName("splash-message");
    this.splashMessageText.setOrigin(0.5);
    this.splashMessageText.setAngle(-20);
    this.titleContainer.add(this.splashMessageText);

    const originalSplashMessageScale = this.splashMessageText.scale;

    this.scene.tweens.add({
      targets: this.splashMessageText,
      duration: Utils.fixedInt(350),
      scale: originalSplashMessageScale * 1.25,
      loop: -1,
      yoyo: true,
    });
  }

  updateTitleStats(): void {
    Utils.apiFetch("game/titlestats")
      .then(request => request.json())
      .then((stats: { playerCount: number, battleCount: number }) => {
        this.playerCountLabel.setText(i18next.t("menu:playersOnline", { count: stats.playerCount }));
      })
      .catch(err => {
        console.error("Failed to fetch title stats:\n", err);
      });
  }

  show(args: any[]): boolean {
    const ret = super.show(args);

    if (ret) {
      this.splashMessage = Utils.randItem(getSplashMessages());
      this.splashMessageText.setText(this.splashMessage.replace("{COUNT}", "?"));

      const ui = this.getUi();

      if (this.scene.eventManager.isEventActive()) {
        this.eventDisplay.show();
      }

      this.iconContainer.setVisible(true);

      this.updateTitleStats();

      this.titleStatsTimer = setInterval(() => {
        this.updateTitleStats();
      }, 60000);

      this.scene.tweens.add({
        targets: [ this.titleContainer, ui.getMessageHandler().bg ],
        duration: Utils.fixedInt(325),
        alpha: (target: any) => target === this.titleContainer ? 1 : 0,
        ease: "Sine.easeInOut"
      });
    }

    return ret;
  }

  clear(): void {
    super.clear();

    const ui = this.getUi();

    this.eventDisplay?.setVisible(false);
    this.iconContainer?.setVisible(false);

    clearInterval(this.titleStatsTimer);
    this.titleStatsTimer = null;

    this.scene.tweens.add({
      targets: [ this.titleContainer, ui.getMessageHandler().bg ],
      duration: Utils.fixedInt(325),
      alpha: (target: any) => target === this.titleContainer ? 0 : 1,
      ease: "Sine.easeInOut"
    });
  }
}

class TitleIcons extends Phaser.GameObjects.Container {
  private icons: Array<Icon> = [];
  private wiki: Icon;
  private discord: Icon;
  private github: Icon;
  private reddit: Icon;
  private readonly ICON_WIDTH = 84;
  private readonly ICON_HEIGHT = 84;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);
  }

  setup() {
    // urls
    let wikiUrl = "https://wiki.pokerogue.net/start";
    const discordUrl = "https://discord.gg/uWpTfdKG49";
    const githubUrl = "https://github.com/pagefaultgames/pokerogue";
    const redditUrl = "https://www.reddit.com/r/pokerogue";


    // wiki url directs based on languges available on wiki
    const lang = i18next.resolvedLanguage.substring(0,2);
    if (["de", "fr", "ko", "zh"].includes(lang)) {
      wikiUrl = `https://wiki.pokerogue.net/${lang}:start`;
    }
    this.wiki = new Icon(this.scene, 0, 0, "wiki", wikiUrl);
    this.icons.push(this.wiki);

    this.discord = new Icon(this.scene, 0, 0, "discord", discordUrl);
    this.icons.push(this.discord);

    this.github = new Icon(this.scene, 0, 0, "github", githubUrl);
    this.icons.push(this.github);

    this.reddit = new Icon(this.scene, 0, 0, "reddit", redditUrl);
    this.icons.push(this.reddit);

    Phaser.Actions.IncX(this.icons, 0, this.ICON_WIDTH + 30);

    this.add(this.icons);
    this.setScale(1/6);
  }

  clear() {
    this.icons.forEach((icon: Icon) => icon.destroy());
  }
}

class Icon extends Phaser.GameObjects.Sprite {
  private readonly DEFAULT_ALPHA = 0.5;

  constructor(scene, x, y, texture, link) {
    super(scene, x, y, texture);
    this.setName(texture);
    this.setInteractive();
    this.setAlpha(this.DEFAULT_ALPHA);
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      this.setAlpha(1);
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      this.setAlpha(this.DEFAULT_ALPHA);
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      window.open(link, "_blank").focus();
    });
  }

}
