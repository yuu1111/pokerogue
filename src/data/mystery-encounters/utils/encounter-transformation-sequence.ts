import BattleScene from "#app/battle-scene";
import { PlayerPokemon } from "#app/field/pokemon";
import { getFrameMs } from "#app/utils";
import { cos, sin } from "#app/field/anims";
import { getTypeRgb } from "#app/data/type";

export enum TransformationScreenPosition {
  CENTER,
  LEFT,
  RIGHT
}

/**
 * Initiates an "evolution-like" animation to transform a pokemon (presumably from the player's party) into a new one, not necessarily an evolution species.
 * @param scene
 * @param pokemon
 * @param transformedPokemon
 * @param screenPosition
 */
export function doPokemonTransformationSequence(scene: BattleScene, pokemon: PlayerPokemon, transformedPokemon: PlayerPokemon, screenPosition: TransformationScreenPosition) {
  return new Promise<void>(resolve => {
    const transformationContainer = scene.fieldUI.getByName("Dream Background") as Phaser.GameObjects.Container;
    const transformationBaseBg = scene.add.image(0, 0, "default_bg");
    transformationBaseBg.setOrigin(0, 0);
    transformationBaseBg.setVisible(false);
    transformationContainer.add(transformationBaseBg);

    let pokemonSprite: Phaser.GameObjects.Sprite;
    let pokemonTintSprite: Phaser.GameObjects.Sprite;
    let pokemonEvoSprite: Phaser.GameObjects.Sprite;
    let pokemonEvoTintSprite: Phaser.GameObjects.Sprite;

    const xOffset = screenPosition === TransformationScreenPosition.CENTER ? 0 :
      screenPosition === TransformationScreenPosition.RIGHT ? 100 : -100;
    // Centered transformations occur at a lower y Position
    const yOffset = screenPosition !== TransformationScreenPosition.CENTER ? -15 : 0;

    const getPokemonSprite = () => {
      const ret = scene.addPokemonSprite(pokemon, transformationBaseBg.displayWidth / 2 + xOffset, transformationBaseBg.displayHeight / 2 + yOffset, "pkmn__sub");
      ret.setPipeline(scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
      return ret;
    };

    transformationContainer.add((pokemonSprite = getPokemonSprite()));
    transformationContainer.add((pokemonTintSprite = getPokemonSprite()));
    transformationContainer.add((pokemonEvoSprite = getPokemonSprite()));
    transformationContainer.add((pokemonEvoTintSprite = getPokemonSprite()));

    pokemonSprite.setAlpha(0);
    pokemonTintSprite.setAlpha(0);
    pokemonTintSprite.setTintFill(0xFFFFFF);
    pokemonEvoSprite.setVisible(false);
    pokemonEvoTintSprite.setVisible(false);
    pokemonEvoTintSprite.setTintFill(0xFFFFFF);

    [ pokemonSprite, pokemonTintSprite, pokemonEvoSprite, pokemonEvoTintSprite ].map(sprite => {
      sprite.play(pokemon.getSpriteKey(true));
      sprite.setPipeline(scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: false, teraColor: getTypeRgb(pokemon.getTeraType()) });
      sprite.setPipelineData("ignoreTimeTint", true);
      sprite.setPipelineData("spriteKey", pokemon.getSpriteKey());
      sprite.setPipelineData("shiny", pokemon.shiny);
      sprite.setPipelineData("variant", pokemon.variant);
      [ "spriteColors", "fusionSpriteColors" ].map(k => {
        if (pokemon.summonData?.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = pokemon.getSprite().pipelineData[k];
      });
    });

    [ pokemonEvoSprite, pokemonEvoTintSprite ].map(sprite => {
      sprite.play(transformedPokemon.getSpriteKey(true));
      sprite.setPipelineData("ignoreTimeTint", true);
      sprite.setPipelineData("spriteKey", transformedPokemon.getSpriteKey());
      sprite.setPipelineData("shiny", transformedPokemon.shiny);
      sprite.setPipelineData("variant", transformedPokemon.variant);
      [ "spriteColors", "fusionSpriteColors" ].map(k => {
        if (transformedPokemon.summonData?.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = transformedPokemon.getSprite().pipelineData[k];
      });
    });

    scene.tweens.add({
      targets: pokemonSprite,
      alpha: 1,
      ease: "Cubic.easeInOut",
      duration: 2000,
      onComplete: () => {
        doSpiralUpward(scene, transformationBaseBg, transformationContainer, xOffset, yOffset);
        scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 1000,
          onUpdate: t => {
            pokemonTintSprite.setAlpha(t.getValue());
          },
          onComplete: () => {
            pokemonSprite.setVisible(false);
            scene.time.delayedCall(700, () => {
              doArcDownward(scene, transformationBaseBg, transformationContainer, xOffset, yOffset);
              scene.time.delayedCall(1000, () => {
                pokemonEvoTintSprite.setScale(0.25);
                pokemonEvoTintSprite.setVisible(true);
                doCycle(scene, 2, 6, pokemonTintSprite, pokemonEvoTintSprite).then(success => {
                  pokemonEvoSprite.setVisible(true);
                  doCircleInward(scene, transformationBaseBg, transformationContainer, xOffset, yOffset);

                  scene.time.delayedCall(900, () => {
                    scene.tweens.add({
                      targets: pokemonEvoTintSprite,
                      alpha: 0,
                      duration: 1500,
                      delay: 150,
                      easing: "Sine.easeIn",
                      onComplete: () => {
                        scene.time.delayedCall(2500, () => {
                          resolve();
                          scene.tweens.add({
                            targets: pokemonEvoSprite,
                            alpha: 0,
                            duration: 2000,
                            delay: 150,
                            easing: "Sine.easeIn",
                            // onComplete: () => {
                            // transformedPokemon.destroy();
                            // }
                          });
                        });
                      }
                    });
                  });
                });
              });
            });
          }
        });
      }
    });
  });
}

function doSpiralUpward(scene: BattleScene, transformationBaseBg, transformationContainer, xOffset: number, yOffset: number) {
  let f = 0;

  scene.tweens.addCounter({
    repeat: 64,
    duration: getFrameMs(1),
    onRepeat: () => {
      if (f < 64) {
        if (!(f & 7)) {
          for (let i = 0; i < 4; i++) {
            doSpiralUpwardParticle(scene, (f & 120) * 2 + i * 64, transformationBaseBg, transformationContainer, xOffset, yOffset);
          }
        }
        f++;
      }
    }
  });
}

function doArcDownward(scene: BattleScene, transformationBaseBg, transformationContainer, xOffset: number, yOffset: number) {
  let f = 0;

  scene.tweens.addCounter({
    repeat: 96,
    duration: getFrameMs(1),
    onRepeat: () => {
      if (f < 96) {
        if (f < 6) {
          for (let i = 0; i < 9; i++) {
            doArcDownParticle(scene, i * 16, transformationBaseBg, transformationContainer, xOffset, yOffset);
          }
        }
        f++;
      }
    }
  });
}

function doCycle(scene: BattleScene, l: number, lastCycle: integer, pokemonTintSprite, pokemonEvoTintSprite): Promise<boolean> {
  return new Promise(resolve => {
    const isLastCycle = l === lastCycle;
    scene.tweens.add({
      targets: pokemonTintSprite,
      scale: 0.25,
      ease: "Cubic.easeInOut",
      duration: 500 / l,
      yoyo: !isLastCycle
    });
    scene.tweens.add({
      targets: pokemonEvoTintSprite,
      scale: 1,
      ease: "Cubic.easeInOut",
      duration: 500 / l,
      yoyo: !isLastCycle,
      onComplete: () => {
        if (l < lastCycle) {
          doCycle(scene, l + 0.5, lastCycle, pokemonTintSprite, pokemonEvoTintSprite).then(success => resolve(success));
        } else {
          pokemonTintSprite.setVisible(false);
          resolve(true);
        }
      }
    });
  });
}

function doCircleInward(scene: BattleScene, transformationBaseBg, transformationContainer, xOffset: number, yOffset: number) {
  let f = 0;

  scene.tweens.addCounter({
    repeat: 48,
    duration: getFrameMs(1),
    onRepeat: () => {
      if (!f) {
        for (let i = 0; i < 16; i++) {
          doCircleInwardParticle(scene, i * 16, 4, transformationBaseBg, transformationContainer, xOffset, yOffset);
        }
      } else if (f === 32) {
        for (let i = 0; i < 16; i++) {
          doCircleInwardParticle(scene, i * 16, 8, transformationBaseBg, transformationContainer, xOffset, yOffset);
        }
      }
      f++;
    }
  });
}

function doSpiralUpwardParticle(scene: BattleScene, trigIndex: integer, transformationBaseBg, transformationContainer, xOffset: number, yOffset: number) {
  const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
  const particle = scene.add.image(initialX, 0, "evo_sparkle");
  transformationContainer.add(particle);

  let f = 0;
  let amp = 48;

  const particleTimer = scene.tweens.addCounter({
    repeat: -1,
    duration: getFrameMs(1),
    onRepeat: () => {
      updateParticle();
    }
  });

  const updateParticle = () => {
    if (!f || particle.y > 8) {
      particle.setPosition(initialX, 88 - (f * f) / 80 + yOffset);
      particle.y += sin(trigIndex, amp) / 4;
      particle.x += cos(trigIndex, amp);
      particle.setScale(1 - (f / 80));
      trigIndex += 4;
      if (f & 1) {
        amp--;
      }
      f++;
    } else {
      particle.destroy();
      particleTimer.remove();
    }
  };

  updateParticle();
}

function doArcDownParticle(scene: BattleScene, trigIndex: integer, transformationBaseBg, transformationContainer, xOffset: number, yOffset: number) {
  const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
  const particle = scene.add.image(initialX, 0, "evo_sparkle");
  particle.setScale(0.5);
  transformationContainer.add(particle);

  let f = 0;
  let amp = 8;

  const particleTimer = scene.tweens.addCounter({
    repeat: -1,
    duration: getFrameMs(1),
    onRepeat: () => {
      updateParticle();
    }
  });

  const updateParticle = () => {
    if (!f || particle.y < 88) {
      particle.setPosition(initialX, 8 + (f * f) / 5 + yOffset);
      particle.y += sin(trigIndex, amp) / 4;
      particle.x += cos(trigIndex, amp);
      amp = 8 + sin(f * 4, 40);
      f++;
    } else {
      particle.destroy();
      particleTimer.remove();
    }
  };

  updateParticle();
}

function doCircleInwardParticle(scene: BattleScene, trigIndex: integer, speed: integer, transformationBaseBg, transformationContainer, xOffset: number, yOffset: number) {
  const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
  const initialY = transformationBaseBg.displayHeight / 2 + yOffset;
  const particle = scene.add.image(initialX, initialY, "evo_sparkle");
  transformationContainer.add(particle);

  let amp = 120;

  const particleTimer = scene.tweens.addCounter({
    repeat: -1,
    duration: getFrameMs(1),
    onRepeat: () => {
      updateParticle();
    }
  });

  const updateParticle = () => {
    if (amp > 8) {
      particle.setPosition(initialX, initialY);
      particle.y += sin(trigIndex, amp);
      particle.x += cos(trigIndex, amp);
      amp -= speed;
      trigIndex += 4;
    } else {
      particle.destroy();
      particleTimer.remove();
    }
  };

  updateParticle();
}
