// Edition No. 003 · Tuesday 10 November 2026
// Written in a Claude Code session (no API call) from out/clusters.json fetched 2026-11-10T15:06Z,
// following the same rules as write.mjs. Snapshot of the inputs: 2026-11-10.sources.json.
export default {
  no: 3, date: "2026-11-10",
  line: "Ukraine talks resume in <em>Abu Dhabi</em>, France blames Iran for a fridge hack, and South Africa's ANC hits a new low.",
  stories: [
    { id: "ua", place: "UAE", city: "Abu Dhabi", cat: "War", lat: 24.45, lon: 54.38,
      short: "Ukraine, Russia and the US talk again",
      hed: "Ukraine, Russia and the US hold their first joint talks since February",
      body: "Negotiators from Ukraine, Russia and the US met in Abu Dhabi for the first {three-way talks|trilateral talks} since February. They talked for nearly 4 hours, and the US called the first day \"very productive\". A ceasefire is not on the table, according to the New York Times, and the main sticking point hasn't moved: Ukraine wants security guarantees, which Russia rejects.",
      why: "It's the first time all three sides have sat down together in nine months, in what is Europe's biggest war since the Second World War. Expectations are low, but any progress would matter to millions of people.",
      ctx: "Russia launched its full-scale invasion of Ukraine in February 2022. Three rounds of US-led talks earlier this year produced no breakthrough.",
      fig: { type: "big", n: "4 hours", u: "of talks on the first day, according to NPR. Three earlier rounds this year brought no breakthrough." },
      people: [["Steve Witkoff", "US special envoy"], ["Jared Kushner", "Trump adviser and son-in-law"]],
      sources: [["BBC", "https://www.bbc.co.uk/news/articles/cqpvgvrpjvv8o?at_medium=RSS&at_campaign=rss"], ["NPR", "https://www.npr.org/2026/11/10/g-s1-152773/russia-ukraine-war-talks"], ["New York Times", "https://www.nytimes.com/2026/11/09/world/europe/ukraine-russia-peace-talks.html"], ["DW", "https://www.dw.com/en/new-trilateral-talks-on-ukraine-war-in-abu-dhabi-what-to-expect/a-79905734?maca=en-rss-en-world-4025-rdf"], ["Financial Times", "https://www.ft.com/content/352539b3-41fd-4418-a171-43975897ec0e?syn-25a6b1a6=1"]] },

    { id: "fr", place: "France", city: "Paris", cat: "Security", lat: 48.86, lon: 2.35,
      short: "France blames Iran for a fridge hack",
      hed: "France says Iran hacked supermarket fridges and spoiled tons of food",
      body: "France says hackers from Iran's {Revolutionary Guards} took over the refrigeration controls at around 700 shops in October, turning up temperatures at night and spoiling tons of chilled and frozen food. Paris summoned Iran's ambassador and will seek European sanctions. Foreign Minister Jean-Noël Barrot said France ruled out \"nothing\" in its response. Iran denies it was behind the attack.",
      why: "It's a rare case of a government publicly blaming another for attacking something as ordinary as the food supply. It shows how everyday connected equipment, like a shop's freezers, can become a target.",
      ctx: "Western governments have accused Iranian-linked hackers of attacks before, usually on government or industrial systems. Proving who is behind a cyberattack is hard, which is why public blame like this is unusual.",
      fig: { type: "big", n: "700", u: "shops, roughly, whose fridges and freezers France says were taken over in October." },
      people: [["Jean-Noël Barrot", "Foreign minister of France"]],
      sources: [["NPR", "https://www.npr.org/2026/11/09/g-s1-152724/france-iran-cyber-sabotage-fridge-attacks"], ["BBC", "https://www.bbc.co.uk/news/articles/cmg474vk6dyqo?at_medium=RSS&at_campaign=rss"], ["PBS NewsHour", "https://www.pbs.org/newshour/world/france-blames-iran-for-last-months-cyberattack-on-supermarket-fridges"], ["France 24", "https://www.france24.com/en/video/20261110-france-vows-tough-response-to-freezer-cyberattack-blamed-on-iran"], ["RFI", "https://www.rfi.fr/en/international/20261110-france-threatens-consequences-for-iran-after-linking-it-to-supermarket-cyberattacks"]] },

    { id: "il", place: "Israel", city: "Jerusalem", cat: "Politics", lat: 31.78, lon: 35.22,
      short: "A new parliament, but no government",
      hed: "Israel's new parliament is sworn in with no government in sight",
      body: "Israel's new {Knesset} was sworn in on Tuesday. Opposition leader Gadi Eisenkot has the first chance to build a {coalition} and replace Prime Minister Benjamin Netanyahu. Reports differ on whether his side already has a majority, but the opposition hopes to use parliament quickly, including to set up a commission into security failures.",
      why: "If Eisenkot succeeds, it would end the long era of Netanyahu, Israel's longest-serving prime minister. Who chairs parliament could decide how fast that happens.",
      ctx: "No Israeli party ever wins a majority alone, so governments are coalitions of several parties. Eisenkot is a former head of the military.",
      fig: { type: "seats", total: 120, mark: 61, n: "61", u: "of the 120 seats are needed to form a government." },
      people: [["Gadi Eisenkot", "Opposition leader"], ["Benjamin Netanyahu", "Prime minister of Israel"]],
      verified: ["61", "120"],
      sources: [["France 24", "https://www.france24.com/en/middle-east/20261110-israel-s-new-parliament-to-be-sworn-in-as-eisenkot-forms-government"], ["New York Times", "https://www.nytimes.com/2026/11/10/world/middleeast/israel-parliament-eisenkot.html"], ["Guardian", "https://www.theguardian.com/world/2026/nov/10/new-knesset-speaker-ousting-netanyahu-israel-pm"], ["BBC", "https://www.bbc.co.uk/news/articles/crd939lpzjp9o?at_medium=RSS&at_campaign=rss"]] },

    { id: "nv", place: "United States", city: "Santa Clara", cat: "Tech", lat: 37.35, lon: -121.95,
      short: "Nvidia's boss and an alleged spy",
      hed: "Nvidia's boss admits an affair with a woman accused of spying for China",
      body: "Jensen Huang, head of the chipmaker Nvidia, admitted to an affair with a business executive who, according to the New York Times, US intelligence believes was gathering information for Beijing. Nvidia is investigating whether he was targeted, and President Trump says the FBI is looking into it. China dismissed the claims as a smear.",
      why: "Nvidia makes the chips behind the AI boom and is worth more than $4 trillion, so questions about its security reach well beyond one company.",
      ctx: "The US limits sales of its most advanced AI chips to China. The Times says the affair has put a spotlight on a murky trade in smuggling those chips into the country.",
      fig: { type: "big", n: "$4 trillion", u: "Nvidia's market value, which makes it one of the biggest drivers of the stock market." },
      people: [["Jensen Huang", "Founder and chief executive of Nvidia"]],
      sources: [["PBS NewsHour", "https://www.pbs.org/newshour/world/nvidia-investigates-whether-ceo-jensen-huang-was-targeted-by-chinese-spy-when-he-had-affair"], ["BBC", "https://www.bbc.co.uk/news/articles/cqg7x7dpvym8o?at_medium=RSS&at_campaign=rss"], ["New York Times", "https://www.nytimes.com/2026/11/09/world/nvidia-affair-jensen-huang-russell-brand.html"], ["PBS NewsHour", "https://www.pbs.org/newshour/world/china-dismisses-claims-of-spy-plot-involving-nvidia-ceo-huang-as-a-smear-campaign"]] },

    { id: "us", place: "United States", city: "Washington", cat: "Politics", lat: 38.9, lon: -77.04,
      short: "A bid to impeach Pete Hegseth",
      hed: "A Republican moves to impeach the US defence secretary over Iran",
      body: "Thomas Massie, a Republican congressman from Kentucky, introduced eight articles of {impeachment} against Defence Secretary Pete Hegseth on Monday. He accuses Hegseth of waging the war in Iran without approval from Congress and of abusing his powers. Hegseth called it a \"political spectacle\" and a farce that will fail. Massie is retiring after losing a primary to a challenger backed by President Trump.",
      why: "It comes days after Republicans lost both chambers of Congress in the {midterms}, and tests how far the party is now willing to break with the administration over Iran.",
      ctx: "In the US, the House votes to impeach, which is like bringing charges, and the Senate then holds a trial. The Congress elected last week doesn't take its seats until January.",
      fig: { type: "big", n: "8", u: "articles of impeachment, or formal charges, that Massie filed against Hegseth." },
      people: [["Pete Hegseth", "US defence secretary"], ["Thomas Massie", "Republican congressman from Kentucky"]],
      sources: [["Guardian", "https://www.theguardian.com/us-news/2026/nov/10/pete-hegseth-impeachment-massie"], ["The Hindu", "https://www.thehindu.com/news/international/pentagon-chief-hegseth-calls-moves-to-impeach-him-a-farce-that-will-fail/article71686563.ece"], ["France 24", "https://www.france24.com/en/video/20261110-us-hegseth-faces-republican-impeachment-bid-over-abuse-of-power-in-iran-war"], ["New York Times", "https://www.nytimes.com/2026/11/10/world/thomas-massie-impeachment-hegseth.html"]] },

    { id: "tr", place: "Turkey", city: "Aliağa", cat: "Disaster", lat: 38.8, lon: 26.97,
      short: "Steel plant blast kills at least 17",
      hed: "An explosion at a Turkish steel plant kills at least 17 workers",
      body: "An explosion and fire tore through the Habaş iron and steel plant in Aliağa, in western Turkey's Izmir province, on Monday. Witnesses said the blast felt like an earthquake. Turkey's president put the death toll at 16, while the BBC and Euronews report 17. The victims were factory workers, and rescuers have been clearing a collapsed platform.",
      why: "Turkey has long struggled with workplace safety, and the blast will bring fresh questions about how heavy industry is inspected.",
      ctx: "Aliağa, north of the city of Izmir, is one of Turkey's main heavy-industry hubs, home to steelworks, an oil refinery and a ship-breaking yard.",
      fig: { type: "big", n: "17", u: "people killed, according to the BBC and Euronews. The president's count was 16." },
      people: [["Cemil Tugay", "Mayor of Izmir"]],
      sources: [["BBC", "https://www.bbc.co.uk/news/articles/cq2d6d5z9y5jo?at_medium=RSS&at_campaign=rss"], ["Sky News", "https://news.sky.com/story/explosion-at-steel-plant-in-turkey-kills-at-least-16-officials-say-13610161"], ["Euronews", "https://www.euronews.com/video/2026/11/09/turkey-steel-plant-explosion-kills-17-in-izmir-province"], ["The Hindu", "https://www.thehindu.com/news/international/blast-at-steel-factory-near-turkiyes-izmir-death-toll/article71682667.ece"]] },

    { id: "za", place: "South Africa", city: "Johannesburg", cat: "Politics", lat: -26.2, lon: 28.05,
      short: "The ANC's worst result ever",
      hed: "South Africa's ANC suffers its worst election result ever",
      body: "The {African National Congress|ANC} won 30.76 percent of the vote in last week's local elections, its weakest result since the end of {apartheid}, the electoral commission said on Sunday. No party won outright in many towns and cities, so rival parties will now have to share power. Corruption, joblessness and infighting have all cost the party support.",
      why: "The ANC led the fight against white minority rule and has dominated South Africa ever since. Falling below a third of the vote shows how much trust it has lost.",
      ctx: "In 2024 the ANC lost its national majority for the first time and had to form a coalition government with its rivals.",
      fig: { type: "grid", pct: 31, n: "30.76%", u: "of the vote went to the ANC, its lowest share ever." },
      sources: [["France 24", "https://www.france24.com/en/video/20261110-south-africa-s-anc-slumps-to-worst-ever-election-result"], ["RFI", "https://www.rfi.fr/en/africa/20261109-south-africa-s-anc-slumps-to-worst-ever-election-result"], ["The Hindu", "https://www.thehindu.com/news/international/the-fall-of-the-anc-how-mandelas-party-slid-to-its-worst-ever-result-explained/article71684912.ece"]] },

    { id: "sg", place: "Singapore", city: "Singapore", cat: "Lighter", lat: 1.26, lon: 103.82, lite: true,
      short: "The \"cruise for life\" runs aground",
      hed: "A \"cruise for life\" ends with the ship seized in Singapore",
      body: "The Odyssey was meant to sail guests around the world for years. Instead its operator, Villa Vie, ran out of money, the ship dropped its passengers in Cambodia, and Singapore's port authorities have now seized it under a court order won by its creditors.",
      why: "A reminder that \"forever\" is a big promise, especially at sea.",
      ctx: "Residential cruises sell cabins a bit like flats, with people living on board for years while the ship circles the globe.",
      sources: [["BBC", "https://www.bbc.co.uk/news/articles/cqr7y7myer53o?at_medium=RSS&at_campaign=rss"], ["Financial Times", "https://www.ft.com/content/f53c5923-29b1-4ec8-963a-6fb57c000588?syn-25a6b1a6=1"]] }
  ],
  quiz: [
    { q: "What does France say Iranian hackers took over?", a: ["Train signals", "Hospital records", "Supermarket fridges"], c: 2, x: "<b>Supermarket fridges.</b> France says around 700 shops had their refrigeration controls turned up at night, spoiling tons of food." },
    { q: "Where did Ukraine, Russia and the US meet for talks?", a: ["Abu Dhabi", "Geneva", "Istanbul"], c: 0, x: "<b>Abu Dhabi.</b> It was the first three-way meeting since February, in the United Arab Emirates." },
    { q: "Roughly what share of the vote did South Africa's ANC win?", a: ["About half", "About a third", "About a tenth"], c: 1, x: "<b>About a third.</b> It took 30.76 percent in local elections, its worst result ever." }
  ],
  glossary: {
    "Revolutionary Guards": "Iran's most powerful military force, separate from the regular army and answering to the supreme leader. It also runs intelligence and cyber units."
  }
};
