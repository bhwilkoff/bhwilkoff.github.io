// World events from 2007-2022 to provide context for tweets
export interface WorldEvent {
  date: string; // YYYY-MM-DD format
  title: string;
  description: string;
  category: 'technology' | 'politics' | 'culture' | 'science' | 'economics' | 'other';
}

export const worldEvents: WorldEvent[] = [
  // 2007
  { date: '2007-01-09', title: 'iPhone Announced', description: 'Steve Jobs unveils the first iPhone at Macworld', category: 'technology' },
  { date: '2007-06-29', title: 'iPhone Released', description: 'First iPhone goes on sale in the US', category: 'technology' },
  { date: '2007-07-21', title: 'Harry Potter Finale', description: 'Harry Potter and the Deathly Hallows released', category: 'culture' },

  // 2008
  { date: '2008-01-10', title: 'MacBook Air Launched', description: 'Apple introduces the ultra-thin MacBook Air', category: 'technology' },
  { date: '2008-09-15', title: 'Lehman Brothers Collapse', description: 'Financial crisis deepens with Lehman bankruptcy', category: 'economics' },
  { date: '2008-11-04', title: 'Obama Elected President', description: 'Barack Obama elected as 44th US President', category: 'politics' },
  { date: '2008-09-23', title: 'Android Released', description: 'First commercial Android device (HTC Dream) launched', category: 'technology' },

  // 2009
  { date: '2009-01-15', title: 'Miracle on the Hudson', description: 'US Airways Flight 1549 safely lands on Hudson River', category: 'other' },
  { date: '2009-06-25', title: 'Michael Jackson Dies', description: 'Pop icon Michael Jackson passes away at 50', category: 'culture' },
  { date: '2009-12-09', title: 'Avatar Released', description: 'James Cameron\'s Avatar becomes highest-grossing film', category: 'culture' },

  // 2010
  { date: '2010-01-27', title: 'iPad Announced', description: 'Apple unveils the iPad tablet', category: 'technology' },
  { date: '2010-04-20', title: 'Deepwater Horizon Oil Spill', description: 'BP oil rig explosion causes massive environmental disaster', category: 'other' },
  { date: '2010-10-06', title: 'Instagram Launched', description: 'Photo-sharing app Instagram debuts on iOS', category: 'technology' },

  // 2011
  { date: '2011-01-25', title: 'Arab Spring Begins', description: 'Egyptian revolution and protests across Middle East', category: 'politics' },
  { date: '2011-03-11', title: 'Fukushima Nuclear Disaster', description: 'Earthquake and tsunami cause nuclear meltdown in Japan', category: 'science' },
  { date: '2011-05-02', title: 'Osama bin Laden Killed', description: 'Al-Qaeda leader killed by US forces in Pakistan', category: 'politics' },
  { date: '2011-10-05', title: 'Steve Jobs Dies', description: 'Apple co-founder Steve Jobs passes away at 56', category: 'technology' },
  { date: '2011-09-27', title: 'Occupy Wall Street', description: 'Protest movement against economic inequality begins', category: 'politics' },

  // 2012
  { date: '2012-05-18', title: 'Facebook IPO', description: 'Facebook goes public with largest tech IPO ever', category: 'technology' },
  { date: '2012-08-06', title: 'Curiosity Lands on Mars', description: 'NASA\'s Curiosity rover successfully lands on Mars', category: 'science' },
  { date: '2012-10-29', title: 'Hurricane Sandy', description: 'Superstorm Sandy devastates US East Coast', category: 'other' },
  { date: '2012-12-14', title: 'Sandy Hook Shooting', description: 'Mass shooting at elementary school in Connecticut', category: 'other' },

  // 2013
  { date: '2013-03-13', title: 'Pope Francis Elected', description: 'Jorge Mario Bergoglio becomes Pope Francis', category: 'culture' },
  { date: '2013-06-06', title: 'Snowden NSA Leaks', description: 'Edward Snowden reveals NSA surveillance programs', category: 'politics' },
  { date: '2013-09-20', title: 'iOS 7 Released', description: 'Major redesign of Apple\'s mobile operating system', category: 'technology' },

  // 2014
  { date: '2014-02-19', title: 'Facebook Buys WhatsApp', description: 'Facebook acquires WhatsApp for $19 billion', category: 'technology' },
  { date: '2014-08-09', title: 'Michael Brown Shooting', description: 'Ferguson protests spark Black Lives Matter movement', category: 'politics' },
  { date: '2014-09-19', title: 'Alibaba IPO', description: 'Chinese e-commerce giant has record-breaking IPO', category: 'economics' },
  { date: '2014-11-12', title: 'Rosetta Lands on Comet', description: 'First spacecraft to land on a comet', category: 'science' },

  // 2015
  { date: '2015-01-07', title: 'Charlie Hebdo Attack', description: 'Terrorist attack on French satirical magazine', category: 'politics' },
  { date: '2015-06-26', title: 'Same-Sex Marriage Legalized', description: 'US Supreme Court legalizes same-sex marriage nationwide', category: 'politics' },
  { date: '2015-07-14', title: 'New Horizons at Pluto', description: 'NASA probe reaches Pluto after 9-year journey', category: 'science' },
  { date: '2015-09-25', title: 'Volkswagen Emissions Scandal', description: 'VW admits to cheating on emissions tests', category: 'economics' },

  // 2016
  { date: '2016-02-11', title: 'Gravitational Waves Detected', description: 'LIGO confirms Einstein\'s prediction of gravitational waves', category: 'science' },
  { date: '2016-06-23', title: 'Brexit Vote', description: 'UK votes to leave European Union', category: 'politics' },
  { date: '2016-07-06', title: 'Pokémon GO Released', description: 'AR mobile game becomes global phenomenon', category: 'technology' },
  { date: '2016-11-08', title: 'Trump Elected President', description: 'Donald Trump wins US presidential election', category: 'politics' },

  // 2017
  { date: '2017-01-20', title: 'Trump Inauguration', description: 'Donald Trump inaugurated as 45th US President', category: 'politics' },
  { date: '2017-04-13', title: 'MOAB Dropped', description: 'US drops largest non-nuclear bomb in Afghanistan', category: 'politics' },
  { date: '2017-08-21', title: 'Total Solar Eclipse', description: 'Total solar eclipse visible across United States', category: 'science' },
  { date: '2017-10-05', title: 'MeToo Movement', description: 'Weinstein scandal sparks global MeToo movement', category: 'culture' },
  { date: '2017-09-13', title: 'iPhone X Announced', description: 'Apple unveils iPhone X with Face ID', category: 'technology' },

  // 2018
  { date: '2018-02-06', title: 'Falcon Heavy Launch', description: 'SpaceX launches most powerful operational rocket', category: 'technology' },
  { date: '2018-03-26', title: 'Facebook Data Scandal', description: 'Cambridge Analytica scandal revealed', category: 'technology' },
  { date: '2018-06-12', title: 'Trump-Kim Summit', description: 'Historic meeting between Trump and Kim Jong-un', category: 'politics' },
  { date: '2018-08-01', title: 'Apple Trillion Dollar Valuation', description: 'Apple becomes first trillion-dollar company', category: 'economics' },

  // 2019
  { date: '2019-04-10', title: 'First Black Hole Image', description: 'Scientists capture first image of black hole', category: 'science' },
  { date: '2019-04-15', title: 'Notre-Dame Fire', description: 'Historic cathedral severely damaged by fire', category: 'culture' },
  { date: '2019-07-24', title: 'Boris Johnson Becomes PM', description: 'Boris Johnson becomes UK Prime Minister', category: 'politics' },
  { date: '2019-11-12', title: 'Disney+ Launches', description: 'Disney streaming service launches with major fanfare', category: 'technology' },

  // 2020
  { date: '2020-01-31', title: 'COVID-19 Emergency', description: 'WHO declares COVID-19 a global health emergency', category: 'science' },
  { date: '2020-03-11', title: 'COVID-19 Pandemic', description: 'WHO declares COVID-19 a pandemic', category: 'science' },
  { date: '2020-05-25', title: 'George Floyd Killed', description: 'Death sparks worldwide protests for racial justice', category: 'politics' },
  { date: '2020-05-30', title: 'SpaceX Crew Dragon', description: 'First commercial crewed spacecraft to ISS', category: 'technology' },
  { date: '2020-11-03', title: 'Biden Elected President', description: 'Joe Biden wins US presidential election', category: 'politics' },

  // 2021
  { date: '2021-01-06', title: 'Capitol Riot', description: 'US Capitol stormed during electoral vote count', category: 'politics' },
  { date: '2021-02-18', title: 'Perseverance Lands on Mars', description: 'NASA\'s newest Mars rover successfully lands', category: 'science' },
  { date: '2021-04-19', title: 'Ingenuity Mars Helicopter', description: 'First powered flight on another planet', category: 'science' },
  { date: '2021-11-10', title: 'Crypto Market Peak', description: 'Bitcoin and crypto markets reach all-time highs', category: 'economics' },
  { date: '2021-10-28', title: 'Facebook Becomes Meta', description: 'Facebook rebrands to Meta, focusing on metaverse', category: 'technology' },

  // 2022
  { date: '2022-02-24', title: 'Russia Invades Ukraine', description: 'Russia launches full-scale invasion of Ukraine', category: 'politics' },
  { date: '2022-07-12', title: 'Webb Telescope Images', description: 'James Webb Space Telescope releases first images', category: 'science' },
  { date: '2022-09-08', title: 'Queen Elizabeth II Dies', description: 'UK\'s longest-reigning monarch dies at 96', category: 'culture' },
  { date: '2022-10-27', title: 'Elon Musk Buys Twitter', description: 'Elon Musk completes $44 billion Twitter acquisition', category: 'technology' },
  { date: '2022-11-30', title: 'ChatGPT Released', description: 'OpenAI launches ChatGPT, sparking AI boom', category: 'technology' },
];

// Get events for a specific month/year
export function getEventsForMonth(year: number, month: number): WorldEvent[] {
  return worldEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
}

// Get events for a specific year
export function getEventsForYear(year: number): WorldEvent[] {
  return worldEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === year;
  });
}

// Get category color for styling
export function getCategoryColor(category: WorldEvent['category']): string {
  const colors = {
    technology: 'blue',
    politics: 'red',
    culture: 'purple',
    science: 'green',
    economics: 'yellow',
    other: 'gray',
  };
  return colors[category];
}
