export const clowningAroundDialogue = {
  intro: "It's...@d{64} a clown?",
  speaker: "Clown",
  intro_dialogue: "Bumbling buffoon, brace for a brilliant battle!\nYou’ll be beaten by this brawling busker!",
  title: "Clowning Around",
  description: "Something is off about this encounter. The clown seems eager to goad you into a battle, but to what end?\n\nThe Blacephalon is especially strange, like it has @[TOOLTIP_TITLE]{weird types and ability.}",
  query: "What will you do?",
  option: {
    1: {
      label: "Battle the Clown",
      tooltip: "(-) Strange Battle\n(?) Affects Pokémon Abilities",
      selected: "Your pitiful Pokémon are poised for a pathetic performance!",
      apply_ability_dialogue: "A sensational showcase!\nYour savvy suits a sensational skill as spoils!",
      apply_ability_message: "The clown is offering to permanently Skill Swap one of your Pokémon's ability to {{ability}}!",
      ability_prompt: "Would you like to permanently teach a Pokémon the {{ability}} ability?",
      ability_gained: "@s{level_up_fanfare}{{chosenPokemon}} gained the {{ability}} ability!"
    },
    2: {
      label: "Remain Unprovoked",
      tooltip: "(-) Upsets the Clown\n(?) Affects Pokémon Items",
      selected: "Dismal dodger, you deny a delightful duel?\nFeel my fury!",
      selected_2: "The clown's Blacephalon uses Trick!\nAll of your {{switchPokemon}}'s items were randomly swapped!",
      selected_3: "Flustered fool, fall for my flawless deception!",
    },
    3: {
      label: "Return the Insults",
      tooltip: "(-) Upsets the Clown\n(?) Affects Pokémon Types",
      selected: "Dismal dodger, you deny a delightful duel?\nFeel my fury!",
      selected_2: "The clown's Blacephalon uses a strange move!\nAll of your team's types were randomly swapped!",
      selected_3: "Flustered fool, fall for my flawless deception!",
    },
  },
  outro: "The clown and his cohorts\ndisappear in a puff of smoke."
};
