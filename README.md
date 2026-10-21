# Wildbound

An original creature-collecting RPG for the browser. You catch, train and battle Wildlings across the Verdania region. All creatures, characters, story, art and music are original and are generated in code.

## Play online

**https://Vocal101.github.io/wildbound/** works in the browser with nothing to install.

## Install and play offline

1. At the top of this page, click the green **Code** button, then **Download ZIP**.
2. Unzip it: right-click the file and choose **Extract All** on Windows, or double-click it on a Mac.
3. Open the unzipped folder and double-click `index.html`. The game opens in your web browser.

If you use git, run `git clone https://github.com/Vocal101/wildbound.git` and open `index.html` the same way.

There's nothing else to install and no internet needed once it's downloaded. Chrome or Edge is recommended.

**Saving:** the game does not autosave. Open the menu (Esc) and choose **SAVE**. Saves live in your browser, so the online version and a downloaded copy each keep their own save.

## How to play

Pick a starter Wildling from Professor Wren, then explore Verdania. Walk through tall grass to meet wild Wildlings, weaken them in battle and throw an Orb to catch them. Win battles to level up your team, beat the five Wardens to earn their Sigils, and stop the Hollow Syndicate on your way to the Champion. Heal for free at any Haven.

## Controls

| Key | Action |
|---|---|
| Arrows / WASD | Move, navigate menus |
| Z / Space / Enter | A: confirm, talk, interact |
| X / Backspace | B: back, cancel |
| Esc / M / Tab | Open the menu |
| Shift (hold) | Run |

## What's in it

- **72 creatures** (including 3 legendaries), each with its own procedural pixel art (front, back, icon), evolution by level or stone, Dex entries, height and weight
- **Shinies**: about 1 in 512 wild creatures appears in alternate colours with a sparkle. The Glimmer Charm triples the odds.
- **15 types** with a full effectiveness chart, **122 moves** (physical, special, status), **15 abilities**, and **25 temperaments** (stat-nature modifiers)
- **Battles**: wild, trainer, Warden (boss), rival, champion and legendary fights. Includes speed and priority order, critical hits, same-type bonus, accuracy and evasion, stat stages, burn, poison, paralysis, sleep, freeze, confusion, flinch, leech, drain, recoil, multi-hit and self-KO moves. Trainer AI scores its moves, and bosses use healing items.
- **Catching**: 7 orb types (including Tide, Night and Swift Orbs with special conditions), shake animation, nicknames, and overflow to PC boxes
- **Experience and levels**: 3 growth rates, a shared exp bar, a stat-gain panel, learning new moves (forget one if you already know four), and an evolution scene you can cancel with B
- **Encounters**: tall grass, caves, fishing with two rods, day/night-only species (uses your PC clock), and static legendary encounters
- **Bag** with 5 pockets: Items, Medicine, Orbs, Discs (reusable move teachers) and Key Items
- **Menus**: Team, Summary (info, stats, moves), Wildling Dex, Trainer Card with Sigils, Options, Save
- Havens (free healing), Supply Shops (buy and sell), PC storage (8 boxes of 30), Ward Spray, Return Feather, Bicycle
- **World**: 6 towns, 7 routes (including the Route 6 marsh and Whisperwood Forest), Whisper Cave and its lower level, the Syndicate Tower, the Sunken Ruins, Frost Hollow ice cave, the Summit Path, the summit and a shrine. Around 60 maps, 100+ NPCs, signs, items on the ground (some hidden), ledges, and trainers who spot you and walk over.
- **Side systems**: Verdania Map, Wing Whistle fast travel to visited towns, Share Band (team-wide experience), Marsh Daycare, in-game trades, a move tutor, a Name Rater, a fortune teller who reads a creature's potential, a daily fruit farm, and a hot spring
- **Characters**: 5 Wardens, a rival you meet 4 times, Juno the travelling reporter, Tobin the lab aide, the Hollow Syndicate, the Champion, and a cast of townsfolk with their own lines
- **Story**: choose a starter from Professor Wren and beat your rival. Earn 5 Sigils from the Wardens Petra, Ignatius, Volta, Coralie and Halden. Stop Admin Rook and Boss Vex of the Hollow Syndicate, who want to bind the guardian Aurelis. Beat your rival one last time and challenge Champion Seraphine. After the credits, the Shrine of Dawn opens for Aurelis, Glaciel appears in Frost Hollow, and the Sunken Ruins' seal can be broken to face Vex once more and meet Umbrath. Post-game, you can rematch the Champion.
- Chiptune soundtrack (12 tracks) and sound effects, synthesized live with Web Audio

## Files

`js/core.js` engine and input · `ui.js` text, boxes, dialogs · `audio.js` music and sound effects · `data_*.js` types, moves, species, items · `sprites.js` creature art generator · `tiles.js` tiles, buildings, people · `mon.js` creature stats and storage · `battle.js` battle engine · `menus.js` all menus · `world.js` overworld · `maps.js` original region and interiors · `maps2.js` expansion maps and a small map builder · `story.js` cutscenes · `title.js` title, intro, credits · `devtest.js` test harness (loads only with `?dev` in the URL)
