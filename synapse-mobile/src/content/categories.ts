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
  {id:'arts',label:'Arte e cultura',wiki:'Arte',seeds:['Impressionismo','Prospettiva','Origami','Camera oscura','Rinascimento','Mosaico']},
  {id:'entertainment',label:'Intrattenimento',wiki:'Cinema',seeds:['Cinema di animazione','Stop motion','Jazz','Effetto speciale','Illusionismo','Colonna sonora']},
  {id:'food',label:'Cibo',wiki:'Alimenti',seeds:['Fermentazione','Reazione di Maillard','Cacao','Caffè','Pasta','Lievito']},
  {id:'sport',label:'Sport',wiki:'Sport',seeds:['Giochi olimpici','Maratona','Scacchi','Parkour','Surf','Arrampicata sportiva']},
  {id:'society',label:'Società',wiki:'Società',seeds:['Esperanto','Calendario gregoriano','Moneta','Biblioteca','Cooperazione','Scrittura']},
];
// Keep the original themes above for a single internal rollback before app initialization.
if(EDITORIAL_TUNING.enabled)for(const category of CATEGORIES)category.seeds=[...(EDITORIAL_SEEDS[category.id]||category.seeds)];
export const categoryOrder = (ids: string[]) => {
  const valid = [...new Set(ids)].filter(id => CATEGORIES.some(c => c.id === id));
  return [...valid, ...CATEGORIES.map(c => c.id).filter(id => !valid.includes(id))];
};
