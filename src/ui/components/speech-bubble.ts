export class SpeechBubble extends Phaser.GameObjects.Container {
  private bubble: Phaser.GameObjects.NineSlice;
  private trail: Phaser.GameObjects.Triangle;
  private trailStrokes: Phaser.GameObjects.Line[];
  private text: Phaser.GameObjects.Text;

  constructor(scene, x, y, text?: Phaser.GameObjects.Text) {
    super(scene, x, y);

    this.text = text;
    this.text.setPadding(0, 0);
    this.text.setPosition(-(this.text.width / 12), -(this.text.height / 12));

    this.bubble = new Phaser.GameObjects.NineSlice(
      scene,
      0, 0,
      "window_speech", null,
      (this.text.width / 6) + 18, 100);
    this.bubble.setName("speech-bubble");

    this.trail = new Phaser.GameObjects.Triangle(
      scene,
      0, 0,
      -51, 21,
      -51, 11,
      -39, 13,
      0xffffff,
      1
    );
    this.trail.setName("speech-bubble-trail");

    this.trailStrokes = [];
    this.trailStrokes.push(
      new Phaser.GameObjects.Line(
        scene,
        0, 0,
        -57, 19,
        -57, 13,
        0xa6a6a6, 1
      ),
      new Phaser.GameObjects.Line(
        scene,
        0, 0,
        -52, 19,
        -41, 13,
        0xa6a6a6, 1
      ),
    );

    this.add([this.bubble, this.trail, ...this.trailStrokes, this.text]);
  }
}
