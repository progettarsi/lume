import type { Category } from './types';
import {EDITORIAL_TUNING} from './editorial';
import {EDITORIAL_SEEDS} from './editorialSeeds';
export const CATEGORIES: Category[] = [
  {id:'curiosity',label:'Curiosità',wiki:'Fenomeni naturali',seeds:['Pioggia di animali','Effetto Mpemba','Sindrome della mano aliena','Pietre mobili','Paradosso del compleanno','Pesce volante','Isola di Pasqua','Danza delle api','Pareidolia','Sinestesia','Gloria (fenomeno ottico)','Numero di Dunbar','Petricore','Bollo di zuppa','Gatto di Schrödinger','Formica del miele','Vantablack','Manoscritto Voynich','Ponte del diavolo','Fata Morgana (ottica)','Lago Hillier','Octopus mimus','Quokka','Wombat','Fiocco di neve','Sbadiglio','Déjà vu','Effetto Stroop','Nastro di Möbius','Rana di vetro']},
  {id:'science',label:'Scienza',wiki:'Fisica',seeds:['Effetto Doppler','Diffusione di Rayleigh','Rotazione sincrona','Buco nero','Gravità','Fotosintesi clorofilliana']},
  {id:'technology',label:'Tecnologia',wiki:'Tecnologia',seeds:['Internet','Intelligenza artificiale','Stampa 3D','GPS','Transistor','Batteria agli ioni di litio']},
  {id:'history',label:'Storia',wiki:'Storia',seeds:['Stele di Rosetta','Via della seta','Rivoluzione industriale','Pompei','Stampa a caratteri mobili','Biblioteca di Alessandria']},
  {id:'geography',label:'Geografia',wiki:'Geografia',seeds:['Proiezione cartografica','Deserto del Sahara','Islanda','Fuso orario','Delta fluviale','Aurora polare']},
  {id:'nature',label:'Natura',wiki:'Ecologia',seeds:['Bioluminescenza','Migrazione degli uccelli','Barriera corallina','Mimetismo','Impollinazione','Tardigrada']},
  {id:'philosophy',label:'Filosofia',wiki:'Filosofia',seeds:['Paradosso della nave di Teseo','Stoicismo','Mito della caverna','Rasoio di Occam','Dilemma del carrello','Socrate']},
  {id:'psychology',label:'Psicologia',wiki:'Psicologia',seeds:['Serendipità','Effetto Dunning-Kruger','Memoria','Bias di conferma','Effetto placebo','Condizionamento classico']},
  {id:'arts',label:'Arte',wiki:'Arte',seeds:['Impressionismo','Prospettiva','Origami','Camera oscura','Rinascimento','Mosaico']},
  {id:'entertainment',label:'Spettacolo',wiki:'Spettacolo',seeds:['Illusionismo','Teatro','Circo','Danza','Cabaret','Festival']},
  {id:'food',label:'Cibo',wiki:'Alimenti',seeds:['Fermentazione','Reazione di Maillard','Cacao','Caffè','Pasta','Lievito']},
  {id:'sport',label:'Sport',wiki:'Sport',seeds:['Giochi olimpici','Maratona','Scacchi','Parkour','Surf','Arrampicata sportiva']},
  {id:'society',label:'Società',wiki:'Società',seeds:['Esperanto','Calendario gregoriano','Moneta','Biblioteca','Cooperazione','Scrittura']},
  {id:'politics',label:'Politica',wiki:'Politica',seeds:['Democrazia','Parlamento','Costituzione','Elezioni','Suffragio universale','Separazione dei poteri'],parent:'society'},
  {id:'music',label:'Musica',wiki:'Musica',seeds:['Jazz','Sinfonia','Pianoforte','Opera','Musica classica','Ludwig van Beethoven'],parent:'arts',aliases:['Musicale']},
  {id:'cinema',label:'Cinema',wiki:'Cinema',seeds:['Cinema di animazione','Stop motion','Neorealismo','Montaggio','Cinema muto','Federico Fellini'],parent:'arts'},
  {id:'biology',label:'Biologia',wiki:'Biologia',seeds:['Cellula','DNA','Genetica','Evoluzione','Fotosintesi clorofilliana','Microbiologia'],parent:'science'},
  {id:'economics',label:'Economia',wiki:'Economia',seeds:['Inflazione','Moneta','Mercato','Commercio','Banca centrale','Prodotto interno lordo'],parent:'society'},
  {id:'astronomy',label:'Astronomia',wiki:'Astronomia',seeds:['Buco nero','Sistema solare','Galassia','Stella','Telescopio','Rotazione sincrona'],parent:'science'},
  {id:'literature',label:'Letteratura',wiki:'Letteratura',seeds:['Romanzo','Poesia','Dante Alighieri','Italo Calvino','Fiaba','Odissea'],parent:'arts'},
  {id:'medicine',label:'Medicina',wiki:'Medicina',seeds:['Vaccino','Antibiotico','Sistema immunitario','Anestesia','Penicillina','Epidemiologia'],parent:'science'},
  {id:'mathematics',label:'Matematica',wiki:'Matematica',seeds:['Numero primo','Probabilità','Geometria','Nastro di Möbius','Paradosso del compleanno','Teorema di Pitagora'],parent:'science'},
];
// Keep the original themes above for a single internal rollback before app initialization.
if(EDITORIAL_TUNING.enabled)for(const category of CATEGORIES)category.seeds=[...(EDITORIAL_SEEDS[category.id]||category.seeds)];
// The registry is larger than the rail. Retrieval always has bounded seeds and links.
const icons:Record<string,string>={science:'flask-outline',technology:'chip',history:'pillar',geography:'earth',nature:'leaf',arts:'palette-outline',music:'music-note',cinema:'movie-outline',biology:'dna',politics:'bank-outline',economics:'chart-line',astronomy:'star-outline',philosophy:'thought-bubble-outline',psychology:'head-outline',food:'food-apple-outline',sport:'basketball',society:'account-group-outline',literature:'book-open-outline',medicine:'medical-bag',mathematics:'calculator',curiosity:'compass-outline',entertainment:'drama-masks'};
for(const c of CATEGORIES){c.icon=icons[c.id]||'tag-outline';c.aliases=[...(c.aliases||[]),c.id,c.label,...(c.id==='arts'?['Arte e cultura']:c.id==='entertainment'?['Intrattenimento']:[])]}
export const normalizeTopic=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').replace(/[^a-z0-9]+/g,' ').trim();
export function categoryId(value:string){const key=normalizeTopic(value);return CATEGORIES.find(c=>c.aliases?.some(a=>normalizeTopic(a)===key))?.id}
export function categoryLabel(id:string){return CATEGORIES.find(c=>c.id===id)?.label||'Enciclopedia'}
export const categoryOrder = (ids: string[]) => {
  const valid = [...new Set(ids.map(id=>categoryId(id)).filter((id):id is string=>!!id))];
  return [...valid, ...CATEGORIES.map(c => c.id).filter(id => !valid.includes(id))];
};
