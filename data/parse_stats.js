const tsv_data = `Name	Str	Mag	Skl	Spd	Lck	Def	Res	Mov
Nohr Prince_ss	2		1	1	2			
Nohr Noble	2	2	1	1			2	
Cavalier	2					2	2	
Paladin	2					2	2	1
Great Knight	2					4		1
Knight	2					4		
General	3					5		
Fighter	4			2				
Berserker	5			3				
Mercenary			2	3		1		
Hero			3	3		2		
Bow Knight			3	3				1
Outlaw				2			2	1
Adventurer				4			2	1
Wyvern Rider	3					3		
Wyvern Lord	3					3		1
Malig Knight		2				2	2	1
Dark Mage		3					3	
Sorcerer		5					3	
Dark Knight		3				3		1
Troubadour		2			2		2	
Strategist		2			2		2	1
Maid, Butler		2		3	3			
Wolfskin	3			3				
Wolfssegner	4			4		
Hoshido Noble	2		1	1	2	2		
Samurai				4	2			
Swordmaster				5	3			
Master of Arms	2		2	2		2		
Oni Savage	4					2		
Oni Chieftain	4					4		
Blacksmith	3		2			3		
Spear Fighter	2		2	2				
Spear Master	3		3	2				
Basara					5		3	
Diviner		3		3				
Onmyoji		4		4				
Monk, Shrine Maiden		2			2		2	
Great Master		3			2		3	
Priestess		3			2		3	
Sky Knight				3			3	
Falcon Knight				3			3	1
Kinshi Knight			2	2	2			1
Archer	2		2	2				
Sniper	2		3	3				
Ninja			1	3				1
Master Ninja			2	4				1
Mechanist	2		2			2	2	
Apothecary	3					2	1	
Merchant	3					3	2	
Kitsune				4	2			
Nine-Tails				5	3			
Songstress			2	2	4			
Villager			3		3		
Dread Fighter	2			2			4	
Dark Falcon		3		3				1
Ballistician	3		1		2	1	1	
Witch		5		3			
Lodestar	2			3	3			
Vanguard	5					3		
Great Lord				4	4			
Grandmaster	2	2	2	2				`;

import fs from "fs";
const __dirname = import.meta.dirname;
console.log(__dirname);

const lines = tsv_data.split("\n");
const headers = lines[0].split("\t").slice(1);
const stats = {};

for (let i = 1; i < lines.length; i++) {
  const [name, ...values] = lines[i].split("\t");
  const snakeCaseName = name.toLowerCase().replace(/\s+/g, "_").replace(/,/g, "");
  values.unshift(values.pop());
  stats[snakeCaseName] = values.map((v) => (isNaN(v) ? undefined : +v));
}

// console.log(JSON.stringify(stats, null, "  "));

const statsFromFile = JSON.parse(fs.readFileSync(__dirname + "/class_stats.json", "utf-8"));

Object.entries(stats).forEach(([key, value]) => {
  if (statsFromFile[key]) {
    statsFromFile[key].pairUp = value;
  }
});

fs.writeFileSync(__dirname + "/class_stats_2.json", JSON.stringify(statsFromFile, null, "  "));
